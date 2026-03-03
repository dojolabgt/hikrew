import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(workspaceId: string, dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepo.create({
      ...dto,
      workspaceId,
    });
    return this.serviceRepo.save(service);
  }

  async findAll(workspaceId: string): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { workspaceId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id, workspaceId },
    });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findOne(workspaceId, id);
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    const service = await this.findOne(workspaceId, id);
    service.isActive = false;
    await this.serviceRepo.save(service);
  }
}
