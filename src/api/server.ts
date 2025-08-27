import { Server } from "bun";
import { StepBattleDatabase } from "../database/index.js";
import { ApiPayload } from "../types/index.js";

export class ApiServer {
  private server: Server;
  private db: StepBattleDatabase;
  private secret: string;

  constructor(port: number, db: StepBattleDatabase, secret: string) {
    this.db = db;
    this.secret = secret;

    this.server = Bun.serve({
      port,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`🚀 API server running on port ${port}`);
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Only allow POST requests for API
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Validate authentication
    const authHeader = request.headers.get("authorization");

    if (!this.validateAuth(authHeader)) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      // Parse JSON payload
      const payload: ApiPayload = await request.json();

      // Validate payload structure
      if (!this.validatePayload(payload)) {
        return new Response("Invalid payload format", { status: 400 });
      }

      // Process the step entry
      const result = await this.processStepEntry(payload);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("API error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }

  private validateAuth(authHeader: string | null): boolean {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return token === this.secret;
    }
    return false;
  }

  private validatePayload(payload: any): payload is ApiPayload {
    return (
      typeof payload === "object" &&
      typeof payload.user === "string" &&
      typeof payload.steps === "number" &&
      payload.steps >= 0 &&
      payload.steps <= 1000000 // Reasonable upper limit
    );
  }

  private async processStepEntry(
    payload: ApiPayload
  ): Promise<{ success: boolean; message: string }> {
    // Use Apple device name as the user ID
    const appleDeviceName = payload.user;
    const windowDate = this.getCurrentWindowDate();

    // Ensure user exists in database
    await this.db.createUser(appleDeviceName, appleDeviceName);

    // Check if user has already submitted for this window
    const existingEntry = await this.db.getLatestStepEntryForWindow(
      appleDeviceName,
      windowDate
    );

    if (existingEntry) {
      // Update the existing entry with the new step count
      await this.db.updateStepEntry(existingEntry.id, payload.steps);

      console.log(
        `✅ API: Updated ${appleDeviceName}'s steps from ${existingEntry.steps?.toLocaleString()} to ${payload.steps.toLocaleString()} (window: ${windowDate})`
      );

      return {
        success: true,
        message: `Updated your step submission from ${existingEntry.steps?.toLocaleString()} to ${payload.steps.toLocaleString()} steps for this week.`,
      };
    } else {
      // Add new step entry
      await this.db.addStepEntry(appleDeviceName, payload.steps, "api");

      console.log(
        `✅ API: Added ${payload.steps.toLocaleString()} steps for ${appleDeviceName} (window: ${windowDate})`
      );

      return {
        success: true,
        message: `Successfully submitted ${payload.steps.toLocaleString()} steps for this week.`,
      };
    }
  }

  private getCurrentWindowDate(): string {
    // Get current date in YYYY-MM-DD format
    // For the API, we use the current date as the window date
    // The deduplication logic ensures only the latest submission counts
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  stop(): void {
    this.server.stop();
  }
}
