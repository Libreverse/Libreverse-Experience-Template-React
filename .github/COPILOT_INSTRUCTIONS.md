# Copilot Instruction Guide

This document outlines the workflow and guidelines for completing coding tasks in the Copilot project. Adherence to these instructions is critical to ensure high-quality, maintainable code and successful task completion.

## Package Management
- **Use `bun` exclusively** for all package management tasks:
  - Install dependencies: `bun install <package>`
  - Remove dependencies: `bun remove <package>`
  - Update dependencies: `bun update`
- **Do not use** `npm`, `yarn`, or any other package managers for these operations.

## Development Tools
- **Vite**: Use for running the development server (`bun run dev`) and building the project (`bun run build`).
- **Jest**: Use for running tests (`bun run test`) and updating test snapshots (`bun run test -u`).
- **Other Tools**: Utilize additional configured tools as specified in the project (e.g., ESLint, Prettier) for their respective purposes.

## Code Quality
- **Linting & Warnings**: Identify and resolve any lint warnings, errors, or code quality issues (e.g., via ESLint or Prettier) as part of your changes.
- **Best Practices**: Ensure code is maintainable, consistent with the existing codebase, and follows industry-standard best practices.

## Testing
- **Update Tests**: For every code change, update or create relevant tests to reflect the modifications.
- **Maintain Coverage**: Run tests with `bun run test` to verify functionality and ensure test coverage is maintained or improved.

## Workflow for Coding Tasks
1. **Analyze the Task**: Understand the requirements and scope of the USER’s coding task.
2. **Plan Changes**: Identify affected files, components, or modules, and determine necessary updates to code and tests.
3. **Manage Dependencies**: Use `bun` to install, remove, or update dependencies as needed.
4. **Implement Changes**:
   - Write or modify code using Vite for development feedback.
   - Ensure consistency with the project’s coding style and structure.
5. **Fix Linting Issues**: Run linters (e.g., `bun run lint`) and fix any reported issues.
6. **Update Tests**: Modify or add tests to cover new or changed functionality.
7. **Validate Changes**:
   - Run tests with `bun run test` to confirm all tests pass.
   - Build the project with `bun run build` to ensure no build errors.
8. **Review**: Double-check changes for correctness, completeness, and adherence to these guidelines, avoiding extraneous modifications.

## General Guidance
- **Precision**: Only make changes necessary to complete the task, avoiding unnecessary refactoring or additions.
- **Validation**: Always validate your work by running tests, builds, and linters to ensure functionality and quality.
- **Stakes**: Treat every task with utmost care, as delivering high-quality, correct code is critical to project success.

By following these instructions, you ensure the delivery of robust, maintainable, and high-quality code for the Copilot project.