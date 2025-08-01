# RTS Function - Netlify Edge Function (Deno)

A simple Netlify Edge Function using Deno that returns "hello world".

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

### Option 1: Quick Test
Test the function directly:
```bash
deno task test
```

### Option 2: HTTP Server
Run a local server that mimics Netlify:
```bash
deno task dev
```
Then visit: `http://localhost:8000/api/hello`

### Option 3: Netlify Dev (requires Netlify CLI)
If you have Netlify CLI installed:
```bash
netlify dev
```
Function available at: `http://localhost:8888/api/hello`

## Available Deno Tasks

- `deno task test` - Quick function test
- `deno task dev` - Start development server
- `deno task start` - Same as dev (alias)

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
`https://your-site-name.netlify.app/api/hello`

## Key Benefits of Deno Edge Functions

- **Fast Cold Starts**: Edge Functions start faster than traditional serverless functions
- **Global Distribution**: Runs at Netlify's edge locations worldwide
- **TypeScript Native**: Built-in TypeScript support without compilation
- **Web Standards**: Uses standard Web APIs (Request/Response)
- **No Dependencies**: No need for node_modules or package installation

## Response

The function returns a JSON response:
```json
{
  "message": "hello world"
}
```
