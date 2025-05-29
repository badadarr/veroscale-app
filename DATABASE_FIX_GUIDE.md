# Database Implementation Fix Guide

## Issue Overview

There is a mismatch between the database implementation methods in the project. The `db.ts` file uses Supabase, while many of the API endpoints are still using MySQL references with imports like `RowDataPacket` and `ResultSetHeader` from `mysql2/promise`.

## Fix Solution

1. Replace MySQL-based API endpoints with Supabase-compatible versions using the `executeQuery` function from `@/lib/db.ts`.
2. Remove MySQL-specific imports like `RowDataPacket` and `ResultSetHeader`.
3. Update database operations to use Supabase's syntax and conventions.

## Fixed Files

I've created fixed versions of several key API endpoints:

1. `fixed-multi-material.ts` - Fixed version of the multi-material weights API
2. `fixed-[id].ts` - Fixed version of the single issue API endpoint
3. `fixed-index.ts` - Fixed version of the issues list API endpoint

## Implementation Steps

### 1. Replace Multi-Material API

Replace the content of `pages/api/weights/multi-material.ts` with the content from `fixed-multi-material.ts`. This removes MySQL references and uses Supabase instead.

### 2. Replace Issues API Endpoints

Replace the content of these files:
- `pages/api/issues/[id].ts` with content from `fixed-[id].ts`
- `pages/api/issues/index.ts` with content from `fixed-index.ts`

### 3. Update Any Other API Endpoints

Follow the same pattern to update any other API endpoints in the project that use MySQL references. Key changes to make:

- Import `executeQuery` from `@/lib/db` instead of `getConnection`
- Remove MySQL-specific imports (`RowDataPacket`, `ResultSetHeader`)
- Replace raw SQL queries with Supabase query objects
- Update transaction handling to match Supabase's approach
- Use proper error handling for Supabase responses

### 4. Testing

After implementing these changes, test the API endpoints to ensure they work correctly. Pay special attention to:

- Creating issues and weight entries
- Updating issue status
- Retrieving lists of issues
- Deleting issues

## Important Notes

1. Supabase queries work differently from raw SQL queries:
   - They use object-based filters instead of WHERE clauses
   - They have different methods for joins and complex queries

2. The executeQuery function in db.ts handles the translation between the old format and Supabase format, but it might need extensions for more complex queries.

3. If you need to use any raw SQL capabilities that aren't supported by the current db.ts implementation, consider using Supabase's rpc calls or extending the executeQuery function.
