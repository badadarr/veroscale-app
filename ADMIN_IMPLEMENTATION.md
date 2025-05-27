# Administrator Guide Implementation

This project implements the missing admin functionality as specified in the Administrator Guide, including:

- System configuration
- Material management
- Report configuration
- Department field in user management
- User deactivation feature
- Email notification configuration
- Data retention policies

## Database Changes

The implementation includes several database changes:

1. Added `department` and `status` fields to the `users` table
2. Created a new `report_configurations` table for report settings
3. Created/Updated the `system_settings` table for system configuration

## How to Apply Changes

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 2. Run Database Migrations

To apply all database changes, run:

```bash
npm run run-migrations
```

This will execute the SQL scripts in the proper order:
- `alter-users-table.sql`: Adds department and status fields to users table
- `create-report-tables.sql`: Creates report_configurations and system_settings tables

### 3. Manual SQL Execution (Alternative)

If you prefer to run the SQL scripts manually, you can find them in the `scripts` directory:

- `scripts/alter-users-table.sql`
- `scripts/create-report-tables.sql`

You can execute these scripts directly in your database management tool.

## API Endpoints

### System Configuration

- `GET /api/settings`: Get all system settings
- `PUT /api/settings`: Update system settings

### Material Management

- `GET /api/materials`: Get list of materials
- `POST /api/materials`: Create a new material
- `GET /api/materials/[id]`: Get material by ID
- `PUT /api/materials/[id]`: Update material
- `DELETE /api/materials/[id]`: Delete material

### User Management

- `GET /api/users`: Get list of users
- `GET /api/users/[id]`: Get user by ID
- `PUT /api/users/[id]`: Update user with new department and status fields
- `DELETE /api/users/[id]`: Delete user

### Report Configuration

- `GET /api/reports/configurations`: Get list of report configurations
- `POST /api/reports/configurations`: Create a new report configuration
- `GET /api/reports/configurations/[id]`: Get report configuration by ID
- `PUT /api/reports/configurations/[id]`: Update report configuration
- `DELETE /api/reports/configurations/[id]`: Delete report configuration
