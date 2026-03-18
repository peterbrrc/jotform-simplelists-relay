# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run test` | Run all tests with Vitest |
| `npx vitest run --reporter=verbose` | Run tests with verbose output |
| `npx vitest run test/index.spec.js` | Run a single test file |
| `npx vitest run -t "test name"` | Run a single test by name |
| `npx wrangler types` | Generate TypeScript types |
| `npx prettier --write .` | Format all files |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## Code Style

### Formatting
- **Indentation**: Use tabs (configured in .editorconfig and .prettierrc)
- **Line endings**: LF (Unix-style)
- **Charset**: UTF-8
- **Print width**: 140 characters
- **Quotes**: Single quotes preferred
- **Semicolons**: Required
- **Trailing whitespace**: Trimmed automatically

### Imports
- Group imports: external packages first, then internal modules
- Use ES modules (`import`/`export`), not CommonJS
- No extension needed for .js imports in ESM

### Naming Conventions
- **Files**: Use kebab-case or descriptive lowercase (e.g., `index.spec.js`)
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Exported objects**: PascalCase for default exports if they are class-like

### Error Handling
- Return Response objects with appropriate HTTP status codes
- Use try/catch for async operations that may fail
- Provide descriptive error messages in responses
- Validate inputs before processing

### Testing
- Tests live in `test/` directory with `.spec.js` suffix
- Use `cloudflare:test` utilities: `env`, `createExecutionContext`, `waitOnExecutionContext`, `SELF`
- Use Vitest assertions: `expect`, `describe`, `it`
- Write both unit-style (direct worker.fetch calls) and integration-style (SELF.fetch) tests
- Use `it()` blocks, not `test()`

### Environment Variables
- Access via `env` object passed to fetch handler
- Never hardcode secrets; use Wrangler secrets for sensitive data
- Reference secrets in code via `env.SECRET_NAME`

### API Patterns
- Export default object with `async fetch(request, env, executionCtx)` method
- Validate request method early (e.g., `if (request.method !== 'POST')`)
- Check authorization headers before processing
- Parse JSON inside try/catch blocks
- Return fetch responses directly when proxying

## File Structure

```
src/index.js          # Main worker entry point
test/*.spec.js        # Test files
wrangler.jsonc        # Wrangler configuration
vitest.config.js      # Vitest configuration
```
