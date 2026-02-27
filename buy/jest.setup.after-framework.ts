// ---------------------------------------------------------------------------
// Runs after the Jest test framework is installed — beforeEach/afterEach
// globals are available here.
// ---------------------------------------------------------------------------

// Silence console.error/warn during tests unless explicitly tested
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
