import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Client } from './client.entity';
import { ClientPortalInvite } from './entities/client-portal-invite.entity';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ClientsQueryDto } from './dto/clients-query.dto';
import { paginate, PaginatedResponse } from '../common/dto/pagination.dto';
import { Workspace, WorkspacePlan } from '../workspaces/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/workspace-member.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../core/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../auth/constants/roles';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(ClientPortalInvite)
    private readonly inviteRepo: Repository<ClientPortalInvite>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(workspaceId: string, dto: CreateClientDto): Promise<Client> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (workspace?.plan === WorkspacePlan.FREE) {
      const count = await this.clientRepo.count({ where: { workspaceId } });
      if (count >= 5) {
        throw new BadRequestException(
          'Has alcanzado el límite de 5 clientes para el plan gratuito. Mejora tu plan para agregar más.',
        );
      }
    }

    const client = this.clientRepo.create({ ...dto, workspaceId });
    return this.clientRepo.save(client);
  }

  async findAll(
    workspaceId: string,
    query: ClientsQueryDto,
  ): Promise<PaginatedResponse<Client>> {
    const { search, type, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const qb = this.clientRepo
      .createQueryBuilder('client')
      .where('client.workspaceId = :workspaceId', { workspaceId });

    if (search) {
      qb.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      qb.andWhere('client.type = :type', { type });
    }

    const allowedSort = ['name', 'email', 'createdAt'];
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(
      `client.${orderField}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, query);
  }

  async findOne(workspaceId: string, id: string): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { id, workspaceId },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.findOne(workspaceId, id);
    Object.assign(client, dto);
    return this.clientRepo.save(client);
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    const client = await this.findOne(workspaceId, id);
    await this.clientRepo.remove(client);
  }

  // ─── PORTAL INVITE ────────────────────────────────────────────────────────

  /**
   * Generate a magic invite link for a client, invalidate previous unused invites,
   * and send the link by email.
   * Returns the magic link so the frontend can also share it via WhatsApp.
   */
  async inviteToPortal(
    workspaceId: string,
    clientId: string,
  ): Promise<{ magicLink: string }> {
    const client = await this.clientRepo.findOne({
      where: { id: clientId, workspaceId },
      relations: ['workspace'],
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Invalidate any existing unused invite for this client
    await this.inviteRepo.update(
      { clientId: client.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    // Create new invite token (7-day expiry)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.inviteRepo.save({ clientId: client.id, token, expiresAt });

    // Build the magic link pointing to the invite acceptance page
    const appUrl = this.configService.get<string>(
      'NEXT_PUBLIC_DASHBOARD_URL',
      'http://localhost:3000',
    );
    const magicLink = `${appUrl}/invite/client?token=${token}`;

    // Send email (always — "si o si")
    try {
      await this.mailService.sendClientInvite(
        client,
        client.workspace,
        magicLink,
      );
    } catch {
      // Log but don't fail — magic link is still returned for WhatsApp sharing
    }

    return { magicLink };
  }

  /**
   * Public: resolve invite token into enough context to show the accept form.
   */
  async getInviteDetails(token: string): Promise<{
    clientName: string;
    email: string;
    hasAccount: boolean;
    hasPassword: boolean;
    workspace: { businessName?: string; logo?: string };
  }> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['client', 'client.workspace'],
    });

    if (!invite) throw new NotFoundException('Invitación no encontrada');
    if (invite.usedAt)
      throw new BadRequestException('Esta invitación ya fue utilizada');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Esta invitación ha expirado');

    const existingUser = await this.usersService.findOneByEmailWithPassword(invite.client.email);

    return {
      clientName: invite.client.name,
      email: invite.client.email,
      hasAccount: !!existingUser,
      hasPassword: !!(existingUser?.password),
      workspace: {
        businessName: invite.client.workspace?.businessName,
        logo: invite.client.workspace?.logo,
      },
    };
  }

  /**
   * Public: accept an invite — creates a CLIENT user (or reuses existing one)
   * and links them to the client record.
   */
  async acceptInvite(token: string, password?: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['client'],
    });

    if (!invite) throw new NotFoundException('Invitación no encontrada');
    if (invite.usedAt)
      throw new BadRequestException('Esta invitación ya fue utilizada');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Esta invitación ha expirado');

    const { client } = invite;

    // Find or create user — always FREELANCER at user level.
    // Client context is determined by workspace membership, not user.role.
    let user = await this.usersService.findOneByEmail(client.email);
    if (!user) {
      if (!password) {
        throw new BadRequestException('Se requiere contraseña para crear la cuenta');
      }
      const nameParts = client.name.trim().split(/\s+/);
      user = await this.usersService.create({
        email: client.email,
        password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '',
        role: UserRole.FREELANCER,
      });
    }

    // Grant CLIENT membership in the inviting workspace (idempotent)
    const existing = await this.workspaceMemberRepo.findOne({
      where: { userId: user.id, workspaceId: client.workspaceId },
    });
    if (!existing) {
      await this.workspaceMemberRepo.save(
        this.workspaceMemberRepo.create({
          userId: user.id,
          workspaceId: client.workspaceId,
          role: WorkspaceRole.CLIENT,
        }),
      );
    }

    // Link user to client record
    await this.clientRepo.update(client.id, { linkedUserId: user.id });

    // Mark invite as used
    invite.usedAt = new Date();
    await this.inviteRepo.save(invite);
  }

  /**
   * Accepts an invite for an already-authenticated user.
   * No password required — the user is identified via JWT.
   */
  async acceptInviteForUser(token: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['client'],
    });

    if (!invite) throw new NotFoundException('Invitación no encontrada');
    if (invite.usedAt)
      throw new BadRequestException('Esta invitación ya fue utilizada');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Esta invitación ha expirado');

    const { client } = invite;

    const existing = await this.workspaceMemberRepo.findOne({
      where: { userId, workspaceId: client.workspaceId },
    });
    if (!existing) {
      await this.workspaceMemberRepo.save(
        this.workspaceMemberRepo.create({
          userId,
          workspaceId: client.workspaceId,
          role: WorkspaceRole.CLIENT,
        }),
      );
    }

    await this.clientRepo.update(client.id, { linkedUserId: userId });

    invite.usedAt = new Date();
    await this.inviteRepo.save(invite);
  }
}
