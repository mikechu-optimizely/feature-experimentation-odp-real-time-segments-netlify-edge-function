# RTS Function - Netlify Edge Function (Deno)


A Netlify Edge Function using Deno to test Optimizely SDK v6.0.0 Universal Bundle with Real Time Segments (RTS).

## Functions

### RTS Test Function (`/api/rts`)
Tests the Optimizely SDK v6.0.0 universal bundle with Real Time Segments functionality.


**Features:**
- Uses Optimizely SDK v6.0.0 universal bundle from **cdn.skypack.dev**
- Implements `fetchQualifiedSegments` for RTS
- Supports custom requestHandler for Deno environment
- Configurable eventBatchSize (set to 5)
- Optional flag evaluation testing



**Request Format:**
```json
{
  "userId": "a7f3c6e9-2b4d-4a8f-8c1e-6b9d3a7f2c5e",
  "attributes": {
    "location": "US",
    "device": "mobile"
  },
  "flagKey": "over_21_message"
}
```

> **Note:** The SDK key is **not accepted in the request body**. It must be set via the `OPTIMIZELY_SDK_KEY` environment variable or `.env` file.



**Response Format:**
```json
{
  "success": true,
  "qualifiedSegments": [
    "fun_water_over_21"
  ],
  "metadata": {
    "userId": "a7f3c6e9-2b4d-4a8f-8c1e-6b9d3a7f2c5e",
    "attributes": {
      "location": "US",
      "device": "mobile"
    },
    "timestamp": "2025-08-20T18:36:06.059Z",
    "flagKey": "over_21_message",
    "flagResult": {
      "variationKey": "on",
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


**Note**: Update the integration test cases in `integration.test.ts` with your actual flag key. The SDK key must be set in your environment or `.env` file; it is not read from the request body.

### Option 3: Manual HTTP Testing
Start the development server and test manually:
```bash
deno task dev
```
Then test the endpoint:
- RTS test function: `http://localhost:8000/api/rts`


### Option 4: Manual RTS Testing
Use curl to test the RTS function (SDK key must be set in the environment or `.env` file):
```bash
curl -X POST http://localhost:8000/api/rts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "attributes": {
      "country": "US",
      "age": 25
    }
  }'
```

## Available Deno Tasks

- `deno task test` - Run unit tests (recommended)
- `deno task test:integration` - Run integration tests (requires server)
- `deno task dev` - Start development server

See deno.json for more scripts.

## Key Benefits of Deno Edge Functions

- **Fast Cold Starts**: Edge Functions start faster than traditional serverless functions
- **Global Distribution**: Runs at Netlify's edge locations worldwide
- **TypeScript Native**: Built-in TypeScript support without compilation
- **Web Standards**: Uses standard Web APIs (Request/Response)
- **No Dependencies**: No need for node_modules or package installation
