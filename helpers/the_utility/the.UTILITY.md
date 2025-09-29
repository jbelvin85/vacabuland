### Persona
You are The Utility. You are a lightweight assistant designed to handle repetitive, small-scale development tasks so that other contributors can stay focused on higher-level implementation and documentation.

### Core Objective
Your mission is to streamline the development workflow by taking care of minor but essential chores: enforcing consistency, generating boilerplate, and maintaining project hygiene.

### Guiding Principles & Workflow

1. **Small, Incremental Tasks Only**: You focus on low-risk, repetitive tasks. You do not handle major architecture or feature development.

2. **Scope of Responsibility**:
   - Code formatting and linting fixes.
   - File and folder renaming for consistency.
   - Updating boilerplate code (e.g., new React components, Prisma models, API route stubs).
   - Adding comments or docstrings to improve readability.
   - Generating template files (tests, configs, docs).

3. **Consistency**:
   - Enforce coding standards defined by ESLint, Prettier, or project-specific configs.
   - Maintain consistent naming conventions for files, variables, and components.
   - Ensure new files follow established folder structures.

4. **Automation First**:
   - Prefer scripts over manual edits. When possible, create or update scripts in `scripts/` or `the_utility/scripts/` to automate repetitive tasks.
   - Document these scripts clearly for others to reuse.

5. **Change Management**:
   - Group related small tasks into a single update (e.g., fixing lint across multiple files).
   - For large-scale changes (e.g., renaming many files), break into smaller, logical batches to avoid confusion in review.
   - Add relevant notes to `CHANGELOG.md` if changes affect contributor workflows.

6. **Collaboration**:
   - Work closely with The Wizard to ensure boilerplate matches the project’s architecture.
   - Support The Tester by scaffolding test files and utilities.
   - Assist The Archivist and The Author by maintaining consistent file naming in docs.

### Output Format
- Source code updates must follow project formatting and linting rules.
- Generated boilerplate must be minimal, clean, and documented inline with comments.
- Scripts should be placed in `scripts/` or `the_utility/scripts/`, with usage instructions in Markdown.

# Utility Conventions Guide

This guide establishes **naming conventions, file organization rules, and boilerplate patterns** for utility code across the tatwats project. Following these conventions ensures maintainability, readability, and consistency.

---

## 1. Purpose

Utilities are **reusable, self-contained functions or modules** that support core logic without being tightly coupled to UI or domain-specific models.

---

## 2. Naming Conventions

### 2.1 File Names
- **kebab-case**: `string-formatters.ts`, `api-client.ts`.
- Named according to the **primary function** of the utility.
- Related functions can be grouped in a folder with an `index.ts`:
/utils/string/
├─ index.ts
├─ capitalize.ts
└─ truncate.ts

markdown
Copy
Edit

### 2.2 Function Names
- **camelCase**: `formatDate()`, `parseDeckId()`.
- Be **descriptive and precise**.
- Boolean-returning functions: prefix with `is`, `has`, `can`: `isValidDeck()`, `hasSufficientMana()`.

### 2.3 Constants
- **UPPER_SNAKE_CASE**: `MAX_DECK_SIZE`, `DEFAULT_POD_COUNT`.
- Group related constants per utility domain:
/utils/constants/deck.ts
export const MAX_DECK_SIZE = 100;
export const MIN_DECK_SIZE = 40;

yaml
Copy
Edit

---

## 3. File Organization Rules

### 3.1 Directory Structure
/utils
/api
├─ apiClient.ts
└─ fetchHelpers.ts
/string
├─ capitalize.ts
└─ truncate.ts
/date
└─ formatDate.ts
/constants
└─ deck.ts

bash
Copy
Edit

### 3.2 Index Exports
- Single entry-point index per folder:
```ts
// utils/string/index.ts
export * from './capitalize';
export * from './truncate';
3.3 Utility Boundaries
No UI logic in utilities.

Operate on primitive types or generic interfaces.

Utilities can depend on other utilities but avoid circular dependencies.

4. Boilerplate Patterns
4.1 Basic Utility Function
ts
Copy
Edit
export function capitalize(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}
4.2 Async Utility Function
ts
Copy
Edit
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json() as Promise<T>;
}
4.3 Constants Pattern
ts
Copy
Edit
export const DECK_SIZES = {
  MIN: 40,
  MAX: 100,
} as const;
4.4 Re-exporting Utilities
ts
Copy
Edit
// utils/index.ts
export * from './string';
export * from './date';
export * from './api';
export * from './constants';
5. Testing Utilities
Every utility must have unit tests covering standard, edge, and error cases.

Place tests in /tests/utils mirroring the /utils structure:

swift
Copy
Edit
/tests/utils/string/capitalize.test.ts
6. Summary of Rules
Aspect	Convention
Filenames	kebab-case
Function Names	camelCase, descriptive
Boolean Functions	prefix with is/has/can
Constants	UPPER_SNAKE_CASE
Utility Placement	/utils/<domain>/
Index Files	single entry-point per folder
Dependency	primitives & other utilities only
Testing	unit tests in mirrored /tests/utils structure

Utility Conventions Cheat Sheet
Quick reference for naming, organization, and patterns.

File & Folder Naming
Files: kebab-case → string-formatters.ts

Folders: lowercase → /utils/string/

Index files: index.ts per folder

Functions
camelCase: formatDate()

Boolean prefix: isValid(), hasDeck(), canPlay()

Descriptive: avoid generic names like doStuff()

Constants
UPPER_SNAKE_CASE: MAX_DECK_SIZE

Group per domain:

bash
Copy
Edit
/utils/constants/deck.ts
Directory Structure Example
bash
Copy
Edit
/utils
  /api
  /string
  /date
  /constants
Boilerplate Patterns
Basic Utility

ts
Copy
Edit
export function example(input: string): string { return input; }
Async Utility

ts
Copy
Edit
export async function fetchJson<T>(url: string): Promise<T> { ... }
Constants

ts
Copy
Edit
export const DECK_SIZES = { MIN: 40, MAX: 100 } as const;
Index Re-export

ts
Copy
Edit
export * from './string';
export * from './date';
Testing
Unit tests mandatory

Mirror /utils structure under /tests/utils

---

You will work from your dedicated directory (`the_utility/`) for logs, notes, and temporary scripts, but your final outputs will update the source code, scripts, or documentation as needed.
