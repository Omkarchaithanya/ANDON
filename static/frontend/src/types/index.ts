// ─────────────────────────────────────────────────────────────
// ANDON Frontend — Shared Type Definitions
// These mirror the backend resolver contracts exactly.
// ─────────────────────────────────────────────────────────────

/* ── Navigation ─────────────────────────────────────────────── */

/** The three primary screens in the ANDON workflow. */
export enum Screen {
  CHANGE_LENS = 'CHANGE_LENS',
  EVIDENCE_REDLINE = 'EVIDENCE_REDLINE',
  REVIEW_PACKAGE = 'REVIEW_PACKAGE',
  DECISION_HISTORY = 'DECISION_HISTORY',
  SITE_REGISTRY = 'SITE_REGISTRY',
  ADMINISTRATION = 'ADMINISTRATION',
}

/* ── Status enums ───────────────────────────────────────────── */

/** Status of a discovered change-intent candidate. */
export enum CandidateStatus {
  CANDIDATE = 'CANDIDATE',
  CONFIRMED = 'CONFIRMED',
  DISMISSED = 'DISMISSED',
  STALE = 'STALE',
}

/** Outcome of a coverage evaluation. */
export enum CoverageStatus {
  GAP = 'GAP',
  COVERED = 'COVERED',
  UNKNOWN = 'UNKNOWN',
}

/** Status of a review decision. */
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FOLLOW_UP_CREATED = 'FOLLOW_UP_CREATED',
}

/* ── Domain entities ────────────────────────────────────────── */

/**
 * The top-level context returned when the panel loads,
 * describing the Jira issue that ANDON is inspecting.
 */
export interface DiscoveryContext {
  /** Jira issue key, e.g. "MAINT-1234". */
  issueKey: string;
  /** Human-readable summary of the planned work. */
  plannedWorkSummary: string;
  /** Extracted location reference (zone, aisle, etc.). */
  location: string;
  /** Effective date / timing of the planned work. */
  effectiveDate: string;
  /** ISO timestamp of the last discovery run. */
  lastChecked: string | null;
  /** Discovered change-intent candidates. */
  changeIntents: ChangeIntent[];
}

/**
 * A single candidate relationship discovered between the
 * planned facilities work and a commissioning record.
 */
export interface ChangeIntent {
  /** Unique identifier for this candidate. */
  id: string;
  /** Current processing status. */
  status: CandidateStatus;
  /** Human-readable label, e.g. "Surface finish change". */
  label: string;
  /** The deployment affected, e.g. "AMR-12". */
  deployment: string;
  /** The physical zone, e.g. "Aisle 7". */
  zone: string;
  /** The attribute being changed, e.g. "surface_finish". */
  changedAttribute: string;
  /** Current value of the attribute. */
  currentValue: string;
  /** Proposed new value of the attribute. */
  proposedValue: string;
  /** Source document reference. */
  sourceReference: string;
  /** Span extraction verification state (0 or 1). */
  confidence: number;
  /** ISO timestamp when the candidate was discovered. */
  discoveredAt: string;
  /** Dismissal reason, if dismissed. */
  dismissalReason?: string;
}

/**
 * Data for a single source quote displayed in the Evidence Redline.
 */
export interface SourceQuoteData {
  /** The quoted text. */
  text: string;
  /** Source document name / reference. */
  sourceRef: string;
  /** Version number of the source. */
  version: number;
  /** ISO timestamp of last check. */
  lastChecked: string;
  /** Whether the source has been updated since the quote was captured. */
  isStale: boolean;
  /** Optional highlighted character ranges within the text. */
  highlights?: Array<{ start: number; end: number }>;
}

/**
 * Graph / provenance context linking the change to its commissioning record.
 */
export interface GraphContextData {
  /** Ordered path of nodes from site registry → commissioning record. */
  path: Array<{ label: string; type: string }>;
  /** Owner of the commissioning record. */
  ownerName: string;
  /** Owner e-mail. */
  ownerEmail: string;
}

/**
 * The full evidence redline payload returned when loading
 * the Evidence Redline screen for a specific change intent.
 */
export interface EvidenceRedline {
  /** The change-intent being reviewed. */
  changeIntent: ChangeIntent;
  /** The proposed-change source quote (left panel). */
  proposedSource: SourceQuoteData;
  /** The commissioned-condition source quote (right panel). */
  commissionedSource: SourceQuoteData;
  /** Graph provenance context. */
  graphContext: GraphContextData;
}

/**
 * A single coverage condition within a coverage evaluation.
 */
export interface CoverageDetail {
  /** Name of the condition being evaluated. */
  conditionName: string;
  /** Whether this condition is covered by existing evidence. */
  isCovered: boolean;
  /** The expected / required value. */
  expectedValue: string;
  /** The actual value found in evidence. */
  actualValue: string | null;
  /** Optional description of alternative evidence. */
  alternativeEvidence?: string;
}

/**
 * The review package payload for the Review Package screen.
 */
export interface ReviewPackage {
  /** Unique identifier for this review decision. */
  id: string;
  /** Current review status. */
  status: ReviewStatus;
  /** Coverage evaluation result. */
  coverageStatus: CoverageStatus;
  /** Human-readable explanation of the coverage gap. */
  gapExplanation: string;
  /** Evidence source reference. */
  evidenceSourceRef: string;
  /** Detailed coverage conditions. */
  coverageDetails: CoverageDetail[];
  /** Reviewer information. */
  reviewer: ReviewerData;
  /** Applicable procedures. */
  procedures: string[];
  /** Pre-filled follow-up issue data. */
  followUp: FollowUpData;
  /** The linked change intent id. */
  changeIntentId: string;
  /** If a follow-up was created, the Jira issue key. */
  createdIssueKey?: string;
}

/**
 * Information about the responsible reviewer.
 */
export interface ReviewerData {
  /** Reviewer display name. */
  name: string;
  /** Reviewer role / title. */
  role: string;
  /** Deployment the reviewer owns. */
  deployment: string;
  /** Zone the reviewer is responsible for. */
  zone: string;
  /** Avatar URL (optional). */
  avatarUrl?: string;
}

/**
 * Pre-filled data for the Jira follow-up issue.
 */
export interface FollowUpData {
  /** Target Jira project key. */
  projectKey: string;
  /** Pre-filled issue summary. */
  summary: string;
  /** Pre-filled issue description. */
  description: string;
}

/* ── Resolver response wrappers ─────────────────────────────── */

/** Standard resolver success envelope. */
export interface ResolverSuccess<T> {
  success: true;
  data: T;
}

/** Standard resolver error envelope. */
export interface ResolverError {
  success: false;
  error: string;
}

/** Union resolver response. */
export type ResolverResponse<T> = ResolverSuccess<T> | ResolverError;
