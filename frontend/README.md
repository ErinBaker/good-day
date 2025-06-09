# Good Day Project

This project uses a monorepo structure with separate frontend and backend applications.

## Structure

- `frontend/` - React application (Material-UI)
- `backend/` - Node.js + Express + Apollo GraphQL API

## Setup

1. Install dependencies for both apps:
   - `cd frontend && npm install`
   - `cd ../backend && npm install`
2. See each directory's README for more details.

## Development

- Run frontend and backend separately in their respective directories.
- Use the root `.gitignore` to exclude node_modules, build, dist, and .env files.

## Usage

To use taskmaster-ai, you can run commands like:

```bash
npx task-master-ai <command>
```

For more information about available commands and features, visit the [taskmaster-ai documentation](https://github.com/taskmaster-ai/taskmaster-ai). 