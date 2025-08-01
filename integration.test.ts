// Integration tests for RTS functionality
// Run with: deno run --allow-net integration.test.ts
// Requires the server to be running: deno task dev

declare const Deno: any;

const TEST_URL = 'http://localhost:8000/api/rts-test';
const HELLO_URL = 'http://localhost:8000/api/hello';

interface TestCase {
  name: string;
  payload: {
    userId: string;
    attributes?: Record<string, any>;
    sdkKey?: string;
    flagKey?: string;
  };
  expectedStatus: number;
}

const testCases: TestCase[] = [
  {
    name: 'Missing userId',
    payload: {
      userId: '',
      attributes: { country: 'US' }
    },
    expectedStatus: 400
  },
  {
    name: 'Missing SDK key',
    payload: {
      userId: 'test-user-123',
      attributes: { country: 'US' }
    },
    expectedStatus: 400
  },
  {
    name: 'Valid user with mock SDK key (will fail SDK validation)',
    payload: {
      userId: 'test-user-123',
      attributes: { 
        country: 'US',
        age: 25,
        plan: 'premium'
      },
      sdkKey: 'mock-sdk-key-for-integration-testing'
    },
    expectedStatus: 500 // Expected to fail with invalid SDK key
  },
  {
    name: 'Valid user with real SDK key (replace with actual key)',
    payload: {
      userId: 'test-user-456',
      attributes: { 
        country: 'CA',
        age: 30
      },
      sdkKey: 'YOUR_REAL_SDK_KEY_HERE',  // Replace with actual SDK key
      flagKey: 'your-flag-key'           // Replace with actual flag key
    },
    expectedStatus: 200 // Should succeed with real SDK key
  }
];

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(HELLO_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function runIntegrationTest(testCase: TestCase): Promise<void> {
  console.log(`\n🧪 Running integration test: ${testCase.name}`);
  
  try {
    const response = await fetch(TEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.payload)
    });

    console.log(`   Status: ${response.status} (expected: ${testCase.expectedStatus})`);
    
    const result = await response.json();
    console.log(`   Response:`, JSON.stringify(result, null, 2));
    
    // Validate response structure
    if (result.success === true) {
      console.log(`   ✅ Success: RTS returned ${result.qualifiedSegments?.length || 0} segments`);
      if (result.metadata?.flagResult) {
        console.log(`   🚩 Flag result: ${result.metadata.flagResult.variationKey} (enabled: ${result.metadata.flagResult.enabled})`);
      }
    } else if (result.success === false) {
      console.log(`   ⚠️  Expected failure: ${result.error}`);
    }
    
    if (response.status === testCase.expectedStatus) {
      console.log(`   ✅ Status code matches expectation`);
    } else {
      console.log(`   ❌ Status code mismatch`);
    }
    
  } catch (error) {
    console.log(`   ❌ Test failed with error:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting RTS Integration Tests');
  console.log(`📍 Testing endpoint: ${TEST_URL}`);
  
  // Check if server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start it first with: deno task dev');
    console.log('   Then run this integration test with: deno run --allow-net integration.test.ts');
    Deno.exit(1);
  }
  
  console.log('✅ Server is running');

  // Run all test cases
  for (const testCase of testCases) {
    await runIntegrationTest(testCase);
  }
  
  console.log('\n📝 Integration Test Notes:');
  console.log('   - These tests require a running server (deno task dev)');
  console.log('   - Replace "YOUR_REAL_SDK_KEY_HERE" with your actual Optimizely SDK key');
  console.log('   - Replace "your-flag-key" with an actual flag key for flag evaluation tests');
  console.log('   - Set OPTIMIZELY_SDK_KEY environment variable to test without passing keys in requests');
  console.log('\n🎯 Expected behavior with real SDK key:');
  console.log('   - The function should successfully import the v6.0.0 universal bundle');
  console.log('   - fetchQualifiedSegments should return an array of segment names');
  console.log('   - The universal bundle should work in the Deno runtime');
  console.log('   - Custom requestHandler should work with fetch API');
  
  console.log('\n🧪 For unit tests (no server required), run: deno test');
}

// Run the integration tests
main();
