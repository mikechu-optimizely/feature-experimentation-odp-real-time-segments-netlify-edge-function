// Simple HTTP server to test our Edge Function
import helloFunction from "./netlify/edge-functions/hello.ts";
import rtsTestFunction from "./netlify/edge-functions/rts.ts";

declare const Deno: any;

const port = 8000;

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  
  if (url.pathname === "/api/hello") {
    // Mock Netlify context
    const context = {
      site: { id: "test-site" },
      deploy: { id: "test-deploy" }
    };
    
    return await helloFunction(request, context);
  }
  
  if (url.pathname === "/api/rts-test") {
    // Mock Netlify context for RTS test
    const context = {
      site: { id: "test-site" },
      deploy: { id: "test-deploy" }
    };
    
    return await rtsTestFunction(request, context);
  }
  
  return new Response("Not Found", { status: 404 });
};

console.log(`Server running on http://localhost:${port}`);
console.log(`Test your hello function at: http://localhost:${port}/api/hello`);
console.log(`Test your RTS function at: http://localhost:${port}/api/rts-test`);

Deno.serve({ port }, handler);
