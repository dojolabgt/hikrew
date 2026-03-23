import { WorkspacePlan } from '../workspaces/workspace.entity';

export interface PlanLimits {
  // ── Numeric limits ─────────────────────────────────────────────────────────
  activeDeals: number;
  quotationOptions: number;
  quotationItems: number;
  briefTemplates: number;
  pdfsPerMonth: number;
  milestoneItems: number;
  activeProjects: number;
  collaboratorsPerProject: number;
  projectBriefs: number;
  clients: number;
  services: number;
  workspaceMembers: number;
  currencies: number;
  taxes: number;
  connections: number;
  // ── Feature flags ──────────────────────────────────────────────────────────
  canSendConnections: boolean;
  googleDrive: boolean;
  recurrente: boolean;
  clientUploads: boolean;
  brandCustomization: boolean;
  milestoneSplits: boolean;
  taxReporting: boolean;
  proposalTerms: boolean;
  internalCost: boolean;
  abQuotations: boolean;
  clientPortalInvite: boolean;
  serviceImages: boolean;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  [WorkspacePlan.FREE]: {
    activeDeals: 5,
    quotationOptions: 1,
    quotationItems: 15,
    briefTemplates: 2,
    pdfsPerMonth: 5,
    milestoneItems: 1,
    activeProjects: 3,
    collaboratorsPerProject: 2,
    projectBriefs: 2,
    clients: 15,
    services: 10,
    workspaceMembers: 1,
    currencies: 1,
    taxes: 1,
    connections: 5,
    // feature flags
    canSendConnections: false,
    googleDrive: false,
    recurrente: false,
    clientUploads: false,
    brandCustomization: false,
    milestoneSplits: false,
    taxReporting: false,
    proposalTerms: false,
    internalCost: false,
    abQuotations: false,
    clientPortalInvite: false,
    serviceImages: false,
  },

  [WorkspacePlan.PRO]: {
    activeDeals: 25,
    quotationOptions: 3,
    quotationItems: 100,
    briefTemplates: 15,
    pdfsPerMonth: 60,
    milestoneItems: 8,
    activeProjects: 15,
    collaboratorsPerProject: 8,
    projectBriefs: 10,
    clients: 200,
    services: 75,
    workspaceMembers: 4,
    currencies: 5,
    taxes: 8,
    connections: 30,
    // feature flags
    canSendConnections: true,
    googleDrive: true,
    recurrente: true,
    clientUploads: true,
    brandCustomization: true,
    milestoneSplits: false,
    taxReporting: false,
    proposalTerms: true,
    internalCost: true,
    abQuotations: true,
    clientPortalInvite: true,
    serviceImages: true,
  },

  [WorkspacePlan.PREMIUM]: {
    activeDeals: Infinity,
    quotationOptions: Infinity,
    quotationItems: Infinity,
    briefTemplates: Infinity,
    pdfsPerMonth: Infinity,
    milestoneItems: Infinity,
    activeProjects: Infinity,
    collaboratorsPerProject: Infinity,
    projectBriefs: Infinity,
    clients: Infinity,
    services: Infinity,
    workspaceMembers: Infinity,
    currencies: Infinity,
    taxes: Infinity,
    connections: Infinity,
    // feature flags
    canSendConnections: true,
    googleDrive: true,
    recurrente: true,
    clientUploads: true,
    brandCustomization: true,
    milestoneSplits: true,
    taxReporting: true,
    proposalTerms: true,
    internalCost: true,
    abQuotations: true,
    clientPortalInvite: true,
    serviceImages: true,
  },
};

/** Human-readable upgrade message by required plan */
export const UPGRADE_MESSAGE: Record<WorkspacePlan, string> = {
  [WorkspacePlan.FREE]: '',
  [WorkspacePlan.PRO]: 'Actualiza al plan Pro para desbloquear esta funcionalidad.',
  [WorkspacePlan.PREMIUM]: 'Actualiza al plan Premium para desbloquear esta funcionalidad.',
};
