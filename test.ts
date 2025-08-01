// Simple test script to verify our Edge Function works
import helloFunction from "./netlify/edge-functions/hello.ts";

// Create a mock request
const request = new Request("http://localhost:8000/api/hello", {
  method: "GET",
});

// Create a mock context (Netlify provides this in production)
const context = {};

// Call our function
const response = await helloFunction(request, context);

// Display the result
console.log("Status:", response.status);
console.log("Headers:", Object.fromEntries(response.headers.entries()));
console.log("Body:", await response.text());
