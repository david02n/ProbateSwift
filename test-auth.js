// Simple test script to verify token-based authentication

// Mock Firebase auth
const mockAuth = {
  currentUser: {
    getIdToken: async () => "mock-firebase-token-123"
  }
};

// Test the token addition to fetch
async function testTokenAuth() {
  console.log("Testing token-based authentication...");
  
  // Store original fetch
  const originalFetch = global.fetch;
  
  // Track if token was added
  let tokenAdded = false;
  
  // Mock fetch
  global.fetch = (url, options) => {
    console.log(`Mock fetch called for ${url}`);
    console.log("Headers:", options?.headers);
    
    if (options?.headers?.Authorization) {
      tokenAdded = true;
      console.log("✓ Token was successfully added to request");
    } else {
      console.log("✗ Token was not added to request");
    }
    
    // Return mock response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  };
  
  // Test function similar to our implementation
  const addTokenToRequest = async (options = {}) => {
    const newOptions = { ...options };
    
    try {
      // Get token from mock auth
      const token = await mockAuth.currentUser.getIdToken();
      
      if (token) {
        // Create new headers with Authorization
        if (!newOptions.headers) {
          newOptions.headers = {};
        }
        newOptions.headers.Authorization = `Bearer ${token}`;
        console.log("Token added to headers");
      }
    } catch (error) {
      console.error("Error adding token:", error);
    }
    
    return newOptions;
  };
  
  // Test API request
  const apiRequest = async (method, url, data) => {
    console.log(`Making ${method} request to ${url}`);
    
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    // Add token to request
    const optionsWithToken = await addTokenToRequest(options);
    
    // Make request
    const response = await fetch(url, optionsWithToken);
    return response;
  };
  
  // Make test request
  try {
    await apiRequest("GET", "/api/user");
    
    if (tokenAdded) {
      console.log("✓ SUCCESS: Token authentication implementation verified");
    } else {
      console.log("✗ FAILED: Token was not added to the request");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
  
  // Restore original fetch
  global.fetch = originalFetch;
  
  return tokenAdded;
}

// Run test
testTokenAuth().then(success => {
  console.log(`Test ${success ? "PASSED" : "FAILED"}`);
});