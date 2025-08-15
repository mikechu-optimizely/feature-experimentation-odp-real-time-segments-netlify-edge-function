import {
  OptimizelyUserContext,
  RTSTestMetadata,
  RTSTestRequest,
} from "./types.ts";

// Optimizely Segment Options (matching the SDK enum)
export enum OptimizelySegmentOption {
  IGNORE_CACHE = "IGNORE_CACHE",
  RESET_CACHE = "RESET_CACHE",
}

export class RTSService {
  static async processUserSegments(
    userContext: OptimizelyUserContext,
    body: RTSTestRequest,
  ): Promise<{ qualifiedSegments: string[]; metadata: RTSTestMetadata }> {
    // Test fetchQualifiedSegments with IGNORE_CACHE option
    let qualifiedSegments: string[] = [];
    try {
      const fetchedSuccessfully = await userContext.fetchQualifiedSegments([
        OptimizelySegmentOption.IGNORE_CACHE,
      ]);

      if (fetchedSuccessfully) {
        qualifiedSegments = userContext.qualifiedSegments;
        console.info(
          `🏷️ Qualified segments fetched successfully: ${
            qualifiedSegments?.length || 0
          }`,
        );
      } else {
        console.warn("⚠️ No qualified segments fetched.");
      }
    } catch (segmentsError) {
      console.warn(
        "⚠️ Error while fetching qualified segments:",
        segmentsError,
      );
    }

    const metadata: RTSTestMetadata = {
      userId: body.userId,
      attributes: body.attributes || {},
      timestamp: new Date().toISOString(),
    };

    // If a flag key is provided, also test flag evaluation
    if (body.flagKey) {
      try {
        const flagResult = userContext.decide(body.flagKey);
        metadata.flagKey = body.flagKey;
        metadata.flagResult = {
          variationKey: flagResult.variationKey || "null",
          enabled: flagResult.enabled || false,
          reasons: flagResult.reasons || [],
        };
      } catch (flagError) {
        console.warn("🚩 Flag evaluation failed:", flagError);
      }
    }

    const result = { qualifiedSegments, metadata };
    return result;
  }
}
