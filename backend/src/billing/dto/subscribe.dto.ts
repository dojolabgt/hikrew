import { IsEnum } from 'class-validator';

export class SubscribeDto {
    @IsEnum(['pro', 'premium'])
    plan: 'pro' | 'premium';

    @IsEnum(['month', 'year'])
    interval: 'month' | 'year';
}
