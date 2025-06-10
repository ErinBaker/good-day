This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Task Status

### Task 4: Create GraphQL API Schema
All subtasks for this task are complete and implemented to specification:
- Define GraphQL Schema Types (Memory, Person, MemoryInput, PersonInput)
- Implement Query Type Definitions
- Implement Mutation Type Definitions
- Implement Memory Query Resolvers
- Implement Person Query Resolvers
- Implement Memory Mutation Resolvers
- Implement Person Mutation Resolvers
- Implement Relationship Mutation Resolvers

See `src/graphql/typeDefs.js` and `src/graphql/resolvers.js` for details.

### Task 6: Implement Person Management System

**Status:** In Progress (feature/task-6-person-management-system branch)

#### Subtask 6.1: Create Person Data Model and GraphQL Schema
- The `Person` data model is defined in `prisma/schema.prisma`.
- GraphQL type definitions and CRUD operations for `Person` are present in `src/graphql/typeDefs.js`.
- Resolvers for creating, updating, deleting, and querying people are implemented in `src/graphql/resolvers.js`.
- **New:** Duplicate detection and validation logic have been added to prevent creating or updating a person with the same name (case-insensitive, trimmed) and to ensure the name field is required and non-empty.
- Next steps: Add or update tests for these features and continue with subsequent subtasks for the person management system.
