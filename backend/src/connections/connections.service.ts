import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceConnection,
  ConnectionStatus,
} from './entities/workspace-connection.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspacePlan } from '../workspaces/workspace.entity';
import { randomBytes } from 'crypto';
import { InviteConnectionDto } from './dto/invite-connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(WorkspaceConnection)
    private connectionsRepository: Repository<WorkspaceConnection>,
    private workspacesService: WorkspacesService,
  ) {}

  async inviteConnection(inviterWorkspaceId: string, dto: InviteConnectionDto) {
    // 1. Validate inviter plan
    const workspace =
      await this.workspacesService.getWorkspaceById(inviterWorkspaceId);
    if (workspace.plan === WorkspacePlan.FREE) {
      throw new ForbiddenException(
        'El plan Free no permite enviar invitaciones de conexión. Actualiza a Pro para armar tu red.',
      );
    }

    // 2. Prevent duplicate pending or accepted connections with the same email
    const existing = await this.connectionsRepository.findOne({
      where: [
        {
          inviterWorkspaceId,
          inviteEmail: dto.email,
          status: ConnectionStatus.PENDING,
        },
        {
          inviterWorkspaceId,
          inviteEmail: dto.email,
          status: ConnectionStatus.ACCEPTED,
        },
      ],
    });

    if (existing) {
      throw new BadRequestException(
        'Ya existe una conexión con este correo electrónico.',
      );
    }

    // 3. Prevent inviting yourself
    // In a real scenario we might also check if the email belongs to the inviter
    // Wait, the inviter email is the owner of inviterWorkspaceId. We'll skip for now.

    const token = randomBytes(32).toString('hex');

    const connection = this.connectionsRepository.create({
      inviterWorkspaceId,
      inviteEmail: dto.email,
      token,
      status: ConnectionStatus.PENDING,
    });

    const savedConnection = await this.connectionsRepository.save(connection);

    // TODO: Send Email using mailService
    // await this.mailService.sendConnectionInvite(dto.email, inviterWorkspaceId, token);

    return {
      message: 'Invitación enviada por correo',
      connection: savedConnection,
    };
  }

  async generateConnectionLink(inviterWorkspaceId: string) {
    // 1. Validate inviter plan
    const workspace =
      await this.workspacesService.getWorkspaceById(inviterWorkspaceId);
    if (workspace.plan === WorkspacePlan.FREE) {
      throw new ForbiddenException(
        'El plan Free no permite generar enlaces de conexión. Actualiza a Pro para armar tu red.',
      );
    }

    // Generate a new token
    const token = randomBytes(32).toString('hex');

    // Create generic connection without an email
    const connection = this.connectionsRepository.create({
      inviterWorkspaceId,
      inviteEmail: null,
      token,
      status: ConnectionStatus.PENDING,
    });

    await this.connectionsRepository.save(connection);

    return {
      message: 'Enlace de conexión generado',
      token,
    };
  }
  async testGetPendingInvitesAndConnections(workspaceId: string) {
    const active = await this.connectionsRepository.find({
      where: [
        { inviterWorkspaceId: workspaceId, status: ConnectionStatus.ACCEPTED },
        { inviteeWorkspaceId: workspaceId, status: ConnectionStatus.ACCEPTED },
      ],
      relations: ['inviterWorkspace', 'inviteeWorkspace'],
    });

    const pendingSent = await this.connectionsRepository.find({
      where: {
        inviterWorkspaceId: workspaceId,
        status: ConnectionStatus.PENDING,
      },
      relations: ['inviterWorkspace'],
    });

    return { active, pendingSent };
  }

  async getPendingRequestsForEmail(email: string) {
    return this.connectionsRepository.find({
      where: { inviteEmail: email, status: ConnectionStatus.PENDING },
      relations: ['inviterWorkspace'],
    });
  }

  async acceptConnection(
    token: string,
    inviteeWorkspaceId: string,
    userEmail: string,
  ) {
    const connection = await this.connectionsRepository.findOne({
      where: { token, status: ConnectionStatus.PENDING },
    });

    if (!connection) {
      throw new NotFoundException('Invitación inválida o expirada.');
    }

    // If it's a specific email invite, verify the email matches
    if (connection.inviteEmail && connection.inviteEmail !== userEmail) {
      throw new ForbiddenException(
        'No tienes permiso para aceptar esta invitación.',
      );
    }

    if (connection.inviterWorkspaceId === inviteeWorkspaceId) {
      throw new BadRequestException(
        'No puedes conectarte con tu propio workspace.',
      );
    }

    // Check if a connection already exists to prevent duplicate acceptances
    const existingConnection = await this.connectionsRepository.findOne({
      where: {
        inviterWorkspaceId: connection.inviterWorkspaceId,
        inviteeWorkspaceId: inviteeWorkspaceId,
        status: ConnectionStatus.ACCEPTED,
      },
    });

    if (existingConnection) {
      throw new BadRequestException('Ya estás conectado con este workspace.');
    }

    if (connection.inviteEmail) {
      // It's a direct email invite (single use). Update it directly.
      connection.inviteeWorkspaceId = inviteeWorkspaceId;
      connection.status = ConnectionStatus.ACCEPTED;
      await this.connectionsRepository.save(connection);
    } else {
      // It's a public link (reusable). Leave the public token as PENDING and
      // create a NEW explicit ACCEPTED connection for this specific invitee.
      const newConnection = this.connectionsRepository.create({
        inviterWorkspaceId: connection.inviterWorkspaceId,
        inviteeWorkspaceId: inviteeWorkspaceId,
        inviteEmail: userEmail,
        token: randomBytes(32).toString('hex'), // Accepted active connections need a unique token
        status: ConnectionStatus.ACCEPTED,
      });
      await this.connectionsRepository.save(newConnection);
    }

    return { message: 'Conexión aceptada exitosamente.' };
  }

  async rejectConnection(token: string, userEmail: string) {
    const connection = await this.connectionsRepository.findOne({
      where: { token, status: ConnectionStatus.PENDING },
    });

    if (!connection) {
      throw new NotFoundException('Invitación inválida o expirada.');
    }

    // If it's a specific email invite, verify the email matches
    if (connection.inviteEmail && connection.inviteEmail !== userEmail) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta invitación.',
      );
    }

    connection.status = ConnectionStatus.REJECTED;
    await this.connectionsRepository.save(connection);

    return { message: 'Conexión rechazada.' };
  }

  async getPublicInviteInfo(token: string) {
    const connection = await this.connectionsRepository.findOne({
      where: { token, status: ConnectionStatus.PENDING },
      relations: ['inviterWorkspace'],
    });

    if (!connection) {
      throw new NotFoundException('Invitación inválida o expirada.');
    }

    return {
      inviterName: connection.inviterWorkspace.businessName,
      inviterLogo: connection.inviterWorkspace.logo,
      inviteEmail: connection.inviteEmail,
    };
  }
}
