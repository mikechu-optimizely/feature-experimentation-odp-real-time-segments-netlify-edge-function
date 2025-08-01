// Simple HTTP server to test our Edge Function
import helloFunction from "./netlify/edge-functions/hello.ts";

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
  
  return new Response("Not Found", { status: 404 });
};

console.log(`Server running on http://localhost:${port}`);
console.log(`Test your function at: http://localhost:${port}/api/hello`);

Deno.serve({ port }, handler);
