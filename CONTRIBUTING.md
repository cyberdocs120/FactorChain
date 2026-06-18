# Contributing to FactorChain

Thank you for your interest in contributing to FactorChain! We welcome contributions from Rust developers, TypeScript engineers, security researchers, and domain experts in trade finance.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style Guide](#code-style-guide)
- [Testing Conventions](#testing-conventions)
- [Security](#security)

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/factorchain.git`
3. Follow the [DEVELOPMENT.md](./DEVELOPMENT.md) guide to set up your local environment
4. Create a feature branch: `git checkout -b feat/your-feature-name`

## Development Workflow

1. **Pick an issue** — Look for open issues labeled `good-first-issue` or `help-wanted`
2. **Discuss** — Comment on the issue to let others know you're working on it
3. **Develop** — Write code, following the style and testing conventions below
4. **Test** — Run the full test suite before submitting
5. **Document** — Update documentation if you change any public API or add features
6. **Submit** — Open a pull request with a clear description of changes

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) with the following prefixes:

| Prefix     | Usage                                      |
|------------|--------------------------------------------|
| `feat:`    | A new feature                              |
| `fix:`     | A bug fix                                  |
| `chore:`   | Build process, tooling, or dependency changes |
| `docs:`    | Documentation only changes                 |
| `style:`   | Code style changes (formatting, etc.)      |
| `refactor:`| Code changes that neither fix nor add features |
| `test:`    | Adding or updating tests                   |
| `perf:`    | Performance improvements                   |
| `ci:`      | CI/CD configuration changes                |
| `sec:`     | Security fixes                             |

**Examples:**
```
feat(liquidity-pool): add auto-fund with risk gating
fix(marketplace): reject bids below reserve price
docs: update API endpoint descriptions
test(invoice-registry): add double-financing rejection test
```

## Pull Request Process

1. **Title** must follow the commit message format
2. **Description** should explain:
   - What changed and why
   - How to test the changes
   - Any breaking changes or migrations needed
3. **Linked issues** — Reference related issues with `Closes #123` or `Related to #456`
4. **Checklist** before requesting review:
   - [ ] Code compiles without errors (`cargo build`, `npm run build`)
   - [ ] All tests pass (`cargo test`, `npm test`)
   - [ ] Linter passes (`cargo fmt --check`, `npm run lint`)
   - [ ] No new warnings introduced
   - [ ] Documentation updated (if applicable)
   - [ ] Changes are covered by tests
5. **Reviews** require at least one maintainer approval

## Code Style Guide

### Rust (Smart Contracts)

- Use `#![no_std]` for all contracts
- Import from `soroban_sdk` only; no std library
- Use `snake_case` for function names and variables
- Use `CamelCase` for types and enum variants
- Panic messages should be informative:
  - `panic!("invoice not found")` instead of `panic!("err")`
- Use checked math (Soroban's `+`, `-`, `*` operators use checked arithmetic by default)
- All public functions must have doc comments
- Events must be published for every state-changing operation
- Tests must be in a separate `test.rs` module

### TypeScript (Backend)

- Use NestJS conventions: modules, controllers, services
- Use `camelCase` for variables and functions
- Use `PascalCase` for classes, interfaces, and types
- Use Zod for all input validation
- Use Prisma for all database access
- Decorate controllers with Swagger decorators for API docs
- Use `@Public()` decorator for non-authenticated endpoints
- Error handling: throw `HttpException` with appropriate status codes

### TypeScript (Frontend)

- Use functional components with hooks
- Use `camelCase` for variables and functions
- Use `PascalCase` for components
- Store files in `src/features/` by domain (seller, investor, buyer, admin)
- Shared components go in `src/components/ui/`
- Use Zustand for client state, TanStack Query for server state
- Use Tailwind CSS for styling (utility classes, no custom CSS files)

## Testing Conventions

### Contract Tests

- Every contract must have unit tests in a `test.rs` module
- Cross-contract integration tests go in the marketplace contract
- Tests must cover:
  - Happy path (full lifecycle)
  - Error cases (each `panic!` branch)
  - Authorization checks (unauthorized callers)
  - Edge cases (zero amounts, expired deadlines, etc.)
  - Event emission verification
- Use `#[test]` with `soroban_sdk::testutils`

### Backend Tests

- Unit tests: `*.spec.ts` files co-located with source
- Integration tests: `test/` directory with `jest-e2e` configuration
- Test database operations with real Prisma client (use test containers or in-memory)
- Mock external services (Stellar RPC, Pinata, Resend)

### Frontend Tests

- Unit tests use Vitest
- E2E tests use Playwright
- Test hook behavior, component rendering, and API integration

## Security

- Never commit private keys, secrets, or API tokens
- Run `cargo audit` before submitting contract changes
- Report security vulnerabilities privately to the maintainers
- All contract changes affecting fund custody must be reviewed by at least 2 maintainers

## Questions?

Open a [Discussion](https://github.com/factorchain/discussions) or join our community channels listed in the README.
