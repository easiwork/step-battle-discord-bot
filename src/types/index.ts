export interface User {
  id: string;
  name: string;
  steps: number;
  history: StepEntry[];
}

export interface StepEntry {
  date: string;
  week1?: number; // For manual entries
  week2?: number; // For manual entries
  steps?: number; // For webhook entries
  entryType: "manual" | "webhook";
}

export interface WebhookPayload {
  user: string;
  steps: number;
}

export interface LeaderboardEntry {
  name: string;
  position: number;
  isAhead: boolean;
}

export interface BotConfig {
  token: string;
  clientId: string;
  webhookSecret: string;
  authorizedUsers: string[];
  databasePath: string;
}

export interface DatabaseSchema {
  users: {
    id: string;
    name: string;
    steps: number;
    created_at: string;
    updated_at: string;
  };
  step_entries: {
    id: string;
    user_id: string;
    date: string;
    week1: number | null;
    week2: number | null;
    steps: number | null;
    entry_type: "manual" | "webhook";
    created_at: string;
  };
}
