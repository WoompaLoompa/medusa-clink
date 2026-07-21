# Contributing to bitcoin-lightning-payment-module-for-medusajs-via-clink

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/WoompaLoompa/medusa-clink/issues) to avoid duplicates
2. Create a new issue using the **Bug Report** template
3. Include:
   - Medusa version
   - Plugin version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs (if applicable)

### Suggesting Features

1. Check [existing discussions](https://github.com/WoompaLoompa/medusa-clink/discussions)
2. Create a new issue using the **Feature Request** template
3. Describe the use case and expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Build the project: `npm run build`
7. Commit with clear message: `git commit -m "feat: add amazing feature"`
8. Push to your fork: `git push origin feature/amazing-feature`
9. Create a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/WoompaLoompa/medusa-clink.git

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Watch mode
npm run dev
```

## Code Style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Follow existing patterns in the codebase

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `currency-service.ts`)
- **Classes**: `PascalCase` (e.g., `CurrencyService`)
- **Functions**: `camelCase` (e.g., `fiatToSats`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `SATSH_PER_BTC`)
- **Interfaces**: `PascalCase` with `I` prefix optional (e.g., `ClinkOptions`)

### Comments

- Use JSDoc for public APIs
- Avoid unnecessary comments
- Comment complex logic only

## Testing

### Writing Tests

- Place tests in `src/__tests__/`
- Name test files as `*.test.ts`
- Use Jest
- Aim for 80%+ coverage

### Test Structure

```typescript
describe("Feature", () => {
  describe("method", () => {
    it("should do something", async () => {
      // Arrange
      const input = { /* ... */ }

      // Act
      const result = await service.method(input)

      // Assert
      expect(result).toEqual(expected)
    })
  })
})
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm test -- service.test.ts
```

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md
- Add JSDoc for new public methods
- Update Wiki pages if needed

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance

Examples:
```
feat: add Kraken currency support
fix: handle expired invoice gracefully
docs: update merchant guide
test: add currency service tests
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release branch: `git checkout -b release/v1.1.0`
4. Create a PR for review
5. After merge, create a GitHub release
6. Publish to npm: `npm publish`

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Questions?

- Open a [Discussion](https://github.com/WoompaLoompa/medusa-clink/discussions)
- Check the [Wiki](https://github.com/WoompaLoompa/medusa-clink/wiki)
- Read the [CLINK Protocol](https://clinkme.dev) docs
