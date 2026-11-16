export type Nationality = "eu" | "non-eu";
export type Purpose = "study" | "internship" | "work";
export type Phase = "before" | "arrival" | "settle" | "return";
export type TaskStatus = "completed" | "in_progress" | "pending";

/** "verified": the official page was opened and checked on `lastVerified`.
 *  "todo": the source or requirement could not be verified yet (TODO: verify). */
export type VerificationStatus = "verified" | "todo";

export interface Task {
  id: string;
  title: string;
  /** Official local name, kept in the original language. */
  localName?: string;
  category: "Insurance" | "Bank" | "Registration" | "Accommodation" | "Documents" | "Visa" | "Tax ID" | "Phone" | "Social security" | "Transport" | "Leisure" | "Travel";
  phase: Phase;
  description: string;
  order: number;
  dependsOn: string[];
  documentsNeeded: string[];
  steps: string[];
  officialSourceName: string;
  officialSourceUrl: string | null;
  lastVerified: string | null;
  verificationStatus: VerificationStatus;
  extraSources?: { name: string; url: string; lastVerified: string }[];
  /** Free text note on what still has to be verified. */
  todo?: string;
  estimatedTime: string;
  cost: string;
  deadline?: string;
  /** Lets the app estimate a calendar date from the arrival / move-in date. */
  deadlineRule?: { days: number; workingDays: boolean };
  appliesTo: { nationality: Nationality | "any"; purpose: Purpose[] };
  doneForYouAvailable: boolean;
  critical?: boolean;
  warning?: string;
  /** Estimated hours a student saves by having the step pre-researched (hypothesis, for pilot metrics). */
  hoursSavedEstimate?: number;
}

export interface Place {
  id: string;
  name: string;
  type: "Housing" | "Transport" | "Leisure" | "Food" | "University";
  lat: number;
  lng: number;
  note: string;
  transit?: string;
  rating?: number;
  url?: string | null;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  flag: string;
  eu: boolean;
  center: [number, number];
  tagline: string;
  institutions: string[];
  tasks: Task[];
  places: Place[];
  housingAlert: string[];
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  nationalityLabel: string;
  nationality: Nationality;
  passport: string;
  phone: string;
  email: string;
  destinationId: string;
  purpose: Purpose;
  institution: string;
  arrivalDate: string;
  duration: string;
  neighbourhood: string;
  accommodation: string;
  note: string;
  initialStatus: Record<string, TaskStatus>;
  completedOn?: Record<string, string>;
}

export interface UserProfile {
  personaId?: string;
  name: string;
  nationality: Nationality;
  nationalityLabel: string;
  passport: string;
  phone: string;
  email: string;
  destinationId: string;
  purpose: Purpose;
  institution: string;
  arrivalDate: string;
  duration: string;
  neighbourhood: string;
  accommodation: string;
  age?: number;
}
