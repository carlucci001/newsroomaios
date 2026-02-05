# Tests

## Getting Started

To add testing to this project:

1. Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @types/jest ts-jest
```

2. Add test script to package.json:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

3. Create jest.config.js in the root

## Folder Structure

```
tests/
  ├── unit/          # Unit tests for individual functions/components
  ├── integration/   # Integration tests for feature flows
  ├── e2e/          # End-to-end tests (optional)
  └── setup.ts      # Global test configuration
```

## Example Test

Create `tests/unit/example.test.ts`:
```typescript
describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```