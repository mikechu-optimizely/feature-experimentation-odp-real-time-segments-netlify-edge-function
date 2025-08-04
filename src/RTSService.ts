import { RTSTestRequest, RTSTestResponse, RTSTestMetadata } from "./types.ts";

export class RTSService {
  static async processUserSegments(
    userContext: any, 
    body: RTSTestRequest
  ): Promise<{ qualifiedSegments: string[], metadata: RTSTestMetadata }> {
    // Test fetchQualifiedSegments
    let qualifiedSegments = [];
    try {
      qualifiedSegments = await userContext.fetchQualifiedSegments();
      console.info(`🏷️ Qualified segments fetched successfully: ${qualifiedSegments?.length || 0}`);
    } catch (segmentsError) {
      console.warn('⚠️ Failed to fetch qualified segments:', segmentsError);
      // Don't throw here, just log the error and continue with empty segments
      qualifiedSegments = [];
    }

    const metadata: RTSTestMetadata = {
      userId: body.userId,
      attributes: body.attributes || {},
      timestamp: new Date().toISOString()
    };

    // If a flag key is provided, also test flag evaluation
    if (body.flagKey) {
      try {
        const flagResult = userContext.decide(body.flagKey);
        metadata.flagKey = body.flagKey;
        metadata.flagResult = {
          variationKey: flagResult.variationKey || 'null',
          enabled: flagResult.enabled || false,
          reasons: flagResult.reasons || []
        };
      } catch (flagError) {
        console.warn('🚩 Flag evaluation failed:', flagError);
      }
    }

    return { qualifiedSegments: qualifiedSegments || [], metadata };
  }
}
