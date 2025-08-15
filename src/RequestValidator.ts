import { RTSTestRequest } from "./types.ts";

export class RequestValidator {
  static async parseAndValidate(request: Request): Promise<RTSTestRequest> {
    let body: RTSTestRequest;

    try {
      body = await request.json();
      console.debug(
        "📝 Request body parsed successfully:",
        JSON.stringify(body, null, 2),
      );
    } catch (parseError) {
      throw new Error(
        `Failed to parse request body: ${
          parseError instanceof Error ? parseError.message : "Invalid JSON"
        }`,
      );
    }

    // Validate required fields
    if (!body.userId) {
      throw new Error("userId is required");
    }

    return body;
  }

  static validateSdkKey(): string {
    const sdkKey = Deno.env.get("OPTIMIZELY_SDK_KEY");
    console.debug(
      "🔑 SDK Key check - exists:",
      !!sdkKey,
      "length:",
      sdkKey?.length || 0,
    );

    if (!sdkKey) {
      console.error("🚫 OPTIMIZELY_SDK_KEY not found in environment variables");
      throw new Error(
        "SDK key is required (set OPTIMIZELY_SDK_KEY env var or include in request body)",
      );
    }

    return sdkKey;
  }
}
