# GitHub Actions Workflow

This directory contains a GitHub Actions workflow for running tests in the Budget Project.

## Test Workflow (`test.yml`)

Runs the test suite whenever code is pushed to main or develop branches, or when pull requests are opened against these branches.

### Trigger
- Push to main/develop branches
- Pull request to main/develop branches

### Steps
1. Checkout code
2. Set up Node.js environment (version 20.x)
3. Install dependencies
4. Create test environment file
5. Run tests with Jest

## Setting Up

The test workflow automatically creates the necessary environment variables for testing. No additional setup is required for most tests.

If you need to run tests locally:

```bash
# Install dependencies
npm install

# Run tests
npm test
``` 