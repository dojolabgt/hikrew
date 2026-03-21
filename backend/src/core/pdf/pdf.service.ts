import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface QuotationItemPayload {
  name: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface QuotationPayload {
  optionName?: string;
  total: number;
  currency: string;
  currencySymbol: string;
  items: QuotationItemPayload[];
  terms?: string;
}

export interface BriefFieldSchema {
  id: string;
  label: string;
  type?: string;
}

export interface BriefPayload {
  name: string;
  schema: BriefFieldSchema[];
  responses: Record<string, unknown>;
}

export interface DealWonPdfJob {
  type: 'deal_won';
  projectId: string;
  projectName: string;
  dealName: string;
  clientName?: string;
  driveFolderId?: string | null;
  driveRootFolderId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  quotation?: QuotationPayload | null;
  briefs?: BriefPayload[];
}

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private redis: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
    this.redis.on('error', (err) =>
      this.logger.error('Redis connection error', err),
    );
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async enqueueDealWon(job: DealWonPdfJob): Promise<void> {
    const queue = this.config.get<string>('PDF_JOBS_QUEUE', 'pdf_jobs');
    await this.redis.lpush(queue, JSON.stringify(job));
    this.logger.log(`Enqueued PDF job for project ${job.projectId}`);
  }
}
