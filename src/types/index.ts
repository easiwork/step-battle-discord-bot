export interface User {
  id: string;
  name: string;
  steps: number;
  history: StepEntry[];
}

export interface StepEntry {
  timestamp: string; // Full timestamp from created_at
  steps?: number; // For API entries
  entryType: "api" | "manual";
}

export interface ApiPayload {
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
  apiSecret: string;
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
    steps: number | null;
    entry_type: "api" | "manual";
    created_at: string;
  };
}
