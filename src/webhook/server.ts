import { Server } from "bun";
import { StepBattleDatabase } from "../database/index.js";
import { WebhookPayload } from "../types/index.js";

export class WebhookServer {
  private server: Server;
  private db: StepBattleDatabase;
  private secret: string;

  constructor(
    port: number,
    db: StepBattleDatabase,
    secret: string
  ) {
    this.db = db;
    this.secret = secret;

    this.server = Bun.serve({
      port,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`🚀 Webhook server running on port ${port}`);
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Only allow POST requests for webhook
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
      const payload: WebhookPayload = await request.json();

      // Validate payload structure
      if (!this.validatePayload(payload)) {
        return new Response("Invalid payload format", { status: 400 });
      }

      // Process the step entry
      await this.processStepEntry(payload);

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
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

  private validatePayload(payload: any): payload is WebhookPayload {
    return (
      typeof payload === "object" &&
      typeof payload.user === "string" &&
      typeof payload.steps === "number" &&
      payload.steps >= 0 &&
      payload.steps <= 1000000 // Reasonable upper limit
    );
  }

  private async processStepEntry(payload: WebhookPayload): Promise<void> {
    // Use Apple device name as the user ID
    const appleDeviceName = payload.user;

    // Ensure user exists in database
    await this.db.createUser(appleDeviceName, appleDeviceName);

    // Add step entry
    await this.db.addStepEntry(
      appleDeviceName,
      {
        date: new Date().toISOString().split("T")[0],
        steps: payload.steps,
      },
      "webhook"
    );

    console.log(
      `✅ Webhook: Added ${payload.steps.toLocaleString()} steps for ${
        appleDeviceName
      }`
    );
  }

  stop(): void {
    this.server.stop();
  }
}
