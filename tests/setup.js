// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset any global state if needed
  if (global.console) {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterEach(() => {
  // Restore console methods
  if (console.error.mockRestore) {
    console.error.mockRestore();
  }
  if (console.warn.mockRestore) {
    console.warn.mockRestore();
  }
});