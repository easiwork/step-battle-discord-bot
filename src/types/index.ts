export interface User {
  id: string;
  name: string;
  steps: number;
  history: StepEntry[];
}

export interface StepEntry {
  date: string;
  steps?: number; // For webhook entries
  entryType: "webhook";
}

export interface WebhookPayload {
  user: string;
  steps: number;
  guildId: string;
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
    steps: number | null;
    entry_type: "webhook";
    created_at: string;
  };
}
