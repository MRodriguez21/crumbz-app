/** View model for the place profile. Phase 4 maps Supabase rows into this shape. */

export type ProofStatus =
  /** Backed by real visits. */
  | 'confirmed'
  /** Only the place's own profile says so. */
  | 'unconfirmed'
  /** Nobody has reported it yet. */
  | 'unknown';

/** How visits back a claim; drives the proof wording so a computed value never reads as "confirmed". */
export type ProofBasis =
  /** Computed from visits (e.g. spend per person). */
  | 'average'
  /** Visitors confirmed a yes/no fact (e.g. has a generator). */
  | 'confirmed'
  /** Visitors reported a list (e.g. payment methods). */
  | 'reported';

export interface Evidence {
  id: string;
  author: string;
  /** e.g. "hace 2 días" */
  when: string;
  /** What that visit reported, e.g. "$15". */
  value?: string;
}

export interface ProofFact {
  id: string;
  claim: string;
  detail?: string;
  status: ProofStatus;
  basis?: ProofBasis;
  /** Number of visits that back the claim (when confirmed). */
  visits?: number;
  /** Most recent visits backing the claim. Real photo URLs in phase 4. */
  evidence?: Evidence[];
}

export interface PlaceProfile {
  slug: string;
  name: string;
  category: string;
  area: string;
  distance: string;
  rank: { position: number; tag: string; city: string };
  score: {
    value: number;
    raters: number;
    /** Raters per bucket, highest first. */
    distribution: { label: string; count: number }[];
  };
  photos: { id: string; author: string }[];
  facts: ProofFact[];
  whatsapp: string;
}
