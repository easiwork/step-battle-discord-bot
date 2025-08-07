import { Server } from "bun";
import { StepBattleDatabase } from "../database/index.js";
import { WebhookPayload } from "../types/index.js";
import { isSubmissionWindowOpen, getNextSubmissionWindow } from "../utils/submissionWindow.js";

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

      // Check if submission window is open
      const windowStatus = isSubmissionWindowOpen();
      if (!windowStatus.isOpen) {
        const nextWindow = getNextSubmissionWindow();
        const nextWindowDate = new Date(nextWindow).toLocaleDateString();
        const nextWindowTime = new Date(nextWindow).toLocaleTimeString();
        
        return new Response(
          JSON.stringify({
            error: "Submission window is closed",
            message: `Step submissions are only allowed on odd-numbered Sundays from 10:00 PM to 11:55 PM. Next submission window: ${nextWindowDate} at ${nextWindowTime}`,
            nextWindow: nextWindow
          }),
          { 
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Process the step entry
      const result = await this.processStepEntry(payload, windowStatus.windowDate!);

      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
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

  private async processStepEntry(payload: WebhookPayload, windowDate: string): Promise<{ success: boolean; message: string }> {
    // Use Apple device name as the user ID
    const appleDeviceName = payload.user;

    // Check if user has already submitted this window
    const hasSubmitted = await this.db.hasSubmittedThisWindow(appleDeviceName, windowDate);
    if (hasSubmitted) {
      return {
        success: false,
        message: `You have already submitted steps for this week (${windowDate}). Only one submission is allowed per week.`
      };
    }

    // Ensure user exists in database
    await this.db.createUser(appleDeviceName, appleDeviceName);

    // Record the submission window
    await this.db.recordSubmissionWindow(appleDeviceName, windowDate);

    // Add step entry
    await this.db.addStepEntry(
      appleDeviceName,
      {
        date: windowDate,
        steps: payload.steps,
      },
      "webhook"
    );

    console.log(
      `✅ Webhook: Added ${payload.steps.toLocaleString()} steps for ${appleDeviceName} (window: ${windowDate})`
    );

    return {
      success: true,
      message: `Successfully submitted ${payload.steps.toLocaleString()} steps for this week.`
    };
  }

  stop(): void {
    this.server.stop();
  }
}
