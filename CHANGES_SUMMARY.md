# Changes Made to the Project

Based on the requirements, the following changes have been implemented:

## Removed
- Scan entry functionality has been removed

## Changed
1. **Terminology**
   - "Report Issues" renamed to "Issues" throughout the application
   - "Report Issue" buttons changed to "Notify Issue"

2. **Weight Units**
   - All weight units are now standardized to kilograms (kg) only
   - Weight selection options in settings have been disabled to only allow kg
   - Weight displays in all UI components now consistently show "kg"

3. **Multiple Material Entry**
   - Updated to always use kg as weight unit
   - Updated API to enforce kg as the only unit

4. **Dashboard**
   - Weight category diagram now shows per day data
   - Total weight records now displayed per month
   - Total weight calculation for per month analysis

5. **Issue Management**
   - When an issue is resolved, the resolved button disappears
   - When an issue is approved, the reject button disappears
   - Now tracks who resolved an issue and when
   - Notification bell now links directly to the Issues page

## Added
1. **Notification System**
   - Notification bell component added in the top right next to profile
   - Shows count of pending issues
   - Clicking takes user to issues page
   - Available for all user roles

2. **Functional Issue Management**
   - Converted dummy issue reporting to actual functional API calls
   - Added resolver tracking
   - Integrated with the notification system

## Fixed Issues
1. **Role-based Functionality**
   - Operators can now notify issues from their record view
   - Managers and admins can approve/reject issues
   - Issue status changes properly reflect in UI
   - Improved notification system to work with all roles

2. **Database Implementation**
   - Fixed mismatch between Supabase implementation in db.ts and MySQL references in API endpoints
   - Updated API endpoints to use Supabase instead of MySQL
   - Created fixed versions of multi-material.ts and issues API endpoints
   - Added DATABASE_FIX_GUIDE.md with implementation steps
   - Created apply-db-fixes.js script to automatically apply the fixes

To use these changes:
1. Issues can be reported through the "Notify Issue" buttons in records
2. Issues can be viewed and managed in the Issues page
3. Notifications will appear in the top right when there are pending issues
4. All weights are standardized to kg for consistency
