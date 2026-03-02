import {
    Controller,
    Get,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants/roles';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FREELANCER)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    /**
     * Returns the current plan, planExpiresAt, active subscription, and pricing.
     */
    @Get('status')
    getStatus(@Request() req: { user: { id: string } }) {
        return this.billingService.getStatus(req.user.id);
    }

    /**
     * Creates a Recurrente checkout for a subscription.
     * Returns the checkout URL to redirect the user.
     */
    @Post('subscribe')
    subscribe(
        @Request() req: { user: { id: string } },
        @Body() dto: SubscribeDto,
    ) {
        return this.billingService.subscribe(req.user.id, dto);
    }

    /**
     * Cancels the active subscription and downgrades the plan to free.
     */
    @Post('cancel')
    @HttpCode(HttpStatus.NO_CONTENT)
    cancel(@Request() req: { user: { id: string } }) {
        return this.billingService.cancelSubscription(req.user.id);
    }

    /**
     * Returns the billing history (all subscriptions) for the freelancer.
     */
    @Get('history')
    getHistory(@Request() req: { user: { id: string } }) {
        return this.billingService.getHistory(req.user.id);
    }
}
