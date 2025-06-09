```# Good Day Project

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

- To run both frontend and backend concurrently from the project root:
  ```bash
  npm run dev
  ```
  This will start the React frontend and the Node.js backend together.

- The frontend is configured to proxy API requests to the backend at http://localhost:4000.
- Apollo Client is set up in the frontend to connect to the GraphQL API. You can set the API URL with the `REACT_APP_GRAPHQL_API_URL` environment variable if needed.

- You can still run frontend and backend separately in their respective directories if desired.
- Use the root `.gitignore` to exclude node_modules, build, dist, and .env files.

## Usage

To use taskmaster-ai, you can run commands like:

```bash
npx task-master-ai <command>
```

For more information about available commands and features, visit the [taskmaster-ai documentation](https://github.com/taskmaster-ai/taskmaster-ai). 