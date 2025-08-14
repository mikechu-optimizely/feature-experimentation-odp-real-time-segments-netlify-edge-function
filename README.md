# RTS Function - Netlify Edge Function (Deno)

A Netlify Edge Function using Deno to test Optimizely SDK v6.0.0 Universal Bundle with Real Time Segments (RTS).

## Functions

### RTS Test Function (`/api/rts`)
Tests the Optimizely SDK v6.0.0 universal bundle with Real Time Segments functionality.

**Features:**
- Uses Optimizely SDK v6.0.0 universal bundle from esm.sh
- Implements `fetchQualifiedSegments` for RTS
- Supports custom requestHandler for Deno environment
- Configurable eventBatchSize (set to 1 for RTS)
- Optional flag evaluation testing

**Request Format:**
```json
{
  "userId": "user-123",
  "attributes": {
    "country": "US",
    "age": 25,
    "plan": "premium"
  },
  "sdkKey": "your-optimizely-sdk-key", // Optional if OPTIMIZELY_SDK_KEY env var is set
  "flagKey": "your-flag-key"           // Optional, for flag evaluation testing
}
```

**Response Format:**
```json
{
  "success": true,
  "qualifiedSegments": ["segment1", "segment2"],
  "metadata": {
    "userId": "user-123",
    "attributes": { "country": "US", "age": 25 },
    "timestamp": "2025-08-01T...",
    "sdkVersion": "6.0.0",
    "flagKey": "your-flag-key",        // If flag testing was requested
    "flagResult": {                    // If flag testing was requested
      "variationKey": "treatment",
      "enabled": true,
      "reasons": []
    }
  }
}
```

## Prerequisites

**Deno**: Make sure Deno is installed
```bash
# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Or using Scoop
scoop install deno
```

**Netlify CLI**: Only needed for deployment and Option 3 below
```bash
npm install -g netlify-cli
```

## Local Development & Testing

### Environment Setup
Set your Optimizely SDK key as an environment variable:
```bash
# Windows Command Prompt
set OPTIMIZELY_SDK_KEY=your-sdk-key-here

# Windows PowerShell
$env:OPTIMIZELY_SDK_KEY="your-sdk-key-here"

# Or create a .env file (not recommended for production)
echo OPTIMIZELY_SDK_KEY=your-sdk-key-here > .env
```

### Option 1: Unit Tests
Run unit tests (no server required):
```bash
deno test
# or specifically
deno task test
```

### Option 2: Integration Tests
Run integration tests (requires running server):
```bash
# Start the server in one terminal
deno task dev

# Run integration tests in another terminal
deno task test:integration
```

**Note**: Update the integration test cases in `integration.test.ts` with your actual SDK key and flag keys.

### Option 3: Manual HTTP Testing
Start the development server and test manually:
```bash
deno task dev
```
Then test the endpoint:
- RTS test function: `http://localhost:8000/api/rts`

### Option 4: Manual RTS Testing
Use curl to test the RTS function:
```bash
curl -X POST http://localhost:8000/api/rts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "attributes": {
      "country": "US",
      "age": 25
    },
    "sdkKey": "your-sdk-key-here"
  }'
```

### Option 5: Netlify Dev (requires Netlify CLI)
If you have Netlify CLI installed:
```bash
netlify dev
```
Function available at:
- `http://localhost:8888/api/rts`

## Available Deno Tasks

- `deno task test` - Run unit tests (recommended)
- `deno task test:unit` - Run unit tests explicitly  
- `deno task test:integration` - Run integration tests (requires server)
- `deno task dev` - Start development server
- `deno task start` - Same as dev (alias)

## Testing Notes

### RTS Testing Checklist
- [ ] Unit tests pass (`deno test`)
- [ ] Integration tests pass with real SDK key (`deno task test:integration`)
- [ ] Function successfully imports SDK v6.0.0 universal bundle from esm.sh
- [ ] `fetchQualifiedSegments` returns results (not `false`)
- [ ] Custom requestHandler works in Deno environment
- [ ] EventBatchSize configuration is respected
- [ ] Function handles various user attributes correctly
- [ ] Error handling works for invalid requests

### Test Types
1. **Unit Tests** (`*.test.ts`): Test function logic without external dependencies
2. **Integration Tests** (`integration.test.ts`): Test with real HTTP server and network calls

### Known Issues & Troubleshooting
- **Import errors**: The universal bundle should work with esm.sh, but TypeScript may show warnings
- **RTS returns false**: Ensure SDK key is valid and user exists in your Optimizely project
- **Network timeouts**: RTS requires network access to Optimizely's servers
- **Missing segments**: Verify that your user qualifies for segments in your Optimizely project

### SDK Bundle Comparison
This project tests the **universal bundle** (`index.universal.es.min.js`) instead of the **lite bundle** (`optimizely.lite.min.js`) because:
- Lite bundle has reduced functionality for constrained environments
- Universal bundle includes full RTS support
- Customer reported RTS not working with lite bundle in v5.3.5

## Deployment

**Requires Netlify CLI**: `npm install -g netlify-cli`

1. Login to Netlify:
   ```bash
   netlify login
   ```

2. Initialize the project (first time only):
   ```bash
   netlify init
   ```

3. Deploy to preview:
   ```bash
   netlify deploy
   ```

4. Deploy to production:
   ```bash
   netlify deploy --prod
   ```

## Function Endpoint

Once deployed, your Edge Function will be available at:
`https://your-site-name.netlify.app/api/rts`

## Key Benefits of Deno Edge Functions

- **Fast Cold Starts**: Edge Functions start faster than traditional serverless functions
- **Global Distribution**: Runs at Netlify's edge locations worldwide
- **TypeScript Native**: Built-in TypeScript support without compilation
- **Web Standards**: Uses standard Web APIs (Request/Response)
- **No Dependencies**: No need for node_modules or package installation
