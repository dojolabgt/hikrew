import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspacePlan } from '../workspaces/workspace.entity';
import {
  PLAN_LIMITS,
  PlanLimits,
  UPGRADE_MESSAGE,
} from './plan-limits.constants';

/** Which plan first unlocks a given feature (used in error messages) */
const FEATURE_REQUIRED_PLAN: Partial<Record<keyof PlanLimits, WorkspacePlan>> =
  {
    canSendConnections: WorkspacePlan.PRO,
    googleDrive: WorkspacePlan.PRO,
    recurrente: WorkspacePlan.PRO,
    clientUploads: WorkspacePlan.PRO,
    brandCustomization: WorkspacePlan.PRO,
    proposalTerms: WorkspacePlan.PRO,
    internalCost: WorkspacePlan.PRO,
    abQuotations: WorkspacePlan.PRO,
    clientPortalInvite: WorkspacePlan.PRO,
    serviceImages: WorkspacePlan.PRO,
    milestoneSplits: WorkspacePlan.PREMIUM,
    taxReporting: WorkspacePlan.PREMIUM,
  };

const NUMERIC_REQUIRED_PLAN: Partial<Record<keyof PlanLimits, WorkspacePlan>> =
  {
    activeDeals: WorkspacePlan.PRO,
    quotationOptions: WorkspacePlan.PRO,
    quotationItems: WorkspacePlan.PRO,
    briefTemplates: WorkspacePlan.PRO,
    pdfsPerMonth: WorkspacePlan.PRO,
    milestoneItems: WorkspacePlan.PRO,
    activeProjects: WorkspacePlan.PRO,
    collaboratorsPerProject: WorkspacePlan.PRO,
    projectBriefs: WorkspacePlan.PRO,
    clients: WorkspacePlan.PRO,
    services: WorkspacePlan.PRO,
    workspaceMembers: WorkspacePlan.PRO,
    currencies: WorkspacePlan.PRO,
    taxes: WorkspacePlan.PRO,
    connections: WorkspacePlan.PRO,
  };

@Injectable()
export class PlanLimitsService {
  /** Returns the numeric limit for a given plan and feature. */
  getLimit(plan: WorkspacePlan, feature: keyof PlanLimits): number {
    return PLAN_LIMITS[plan][feature] as number;
  }

  /** Returns whether a boolean feature is enabled for the given plan. */
  hasFeature(plan: WorkspacePlan, feature: keyof PlanLimits): boolean {
    return PLAN_LIMITS[plan][feature] as boolean;
  }

  /**
   * Throws ForbiddenException if `current` has already reached the plan limit.
   * Use BEFORE inserting: assertNumericLimit(plan, 'activeDeals', currentCount)
   */
  assertNumericLimit(
    plan: WorkspacePlan,
    feature: keyof PlanLimits,
    current: number,
  ): void {
    const limit = PLAN_LIMITS[plan][feature] as number;
    if (current >= limit) {
      const requiredPlan =
        NUMERIC_REQUIRED_PLAN[feature] ?? WorkspacePlan.PRO;
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        feature,
        current,
        limit,
        currentPlan: plan,
        requiredPlan,
        message: this.buildNumericMessage(feature, current, limit, requiredPlan),
      });
    }
  }

  /**
   * Throws ForbiddenException if the feature is not available on the current plan.
   */
  assertFeature(plan: WorkspacePlan, feature: keyof PlanLimits): void {
    const enabled = PLAN_LIMITS[plan][feature];
    if (!enabled) {
      const requiredPlan =
        FEATURE_REQUIRED_PLAN[feature] ?? WorkspacePlan.PRO;
      throw new ForbiddenException({
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        currentPlan: plan,
        requiredPlan,
        message: `Esta funcionalidad no está disponible en el plan ${plan}. ${UPGRADE_MESSAGE[requiredPlan]}`,
      });
    }
  }

  private buildNumericMessage(
    feature: keyof PlanLimits,
    current: number,
    limit: number,
    requiredPlan: WorkspacePlan,
  ): string {
    const labels: Partial<Record<keyof PlanLimits, string>> = {
      activeDeals: 'deals activos',
      quotationOptions: 'opciones de cotización',
      quotationItems: 'ítems por cotización',
      briefTemplates: 'brief templates',
      pdfsPerMonth: 'PDFs por mes',
      milestoneItems: 'milestones',
      activeProjects: 'proyectos activos',
      collaboratorsPerProject: 'colaboradores por proyecto',
      projectBriefs: 'briefs por proyecto',
      clients: 'clientes',
      services: 'servicios en catálogo',
      workspaceMembers: 'miembros del workspace',
      currencies: 'monedas',
      taxes: 'impuestos',
      connections: 'conexiones',
    };
    const label = labels[feature] ?? feature;
    return `Alcanzaste el límite de ${limit} ${label} en tu plan actual. ${UPGRADE_MESSAGE[requiredPlan]}`;
  }
}
