## 5.3.3 Detail the test procedures that are carried out according to the design.
The test procedures created for VeroScale Weight Management System were taken from functional design specified in system documentation and support system diagrams. All procedures were taken from a systematic scenario that was aligned with cleared use cases, thereby ensuring user input, system output, and security requirements were tested according to real-life scenarios.

The following section describes the test process embraced for each of the key functions:

### 5.3.3.1 Login and Authentication Process Testing
• Prerequisites: The test user account must be stored in the database with the proper credentials.
• Steps:
  a. Go to the login page.
  b. Enter email and password.
  c. Submit and await system response.
  d. Confirm JWT token is created and session is activated.
  e. Attempt again with invalid credentials to see the rejection message.
• Expected Outcomes:
  o Verify user login with appropriate user credentials.
  o Rejection with error message for unregistered or invalid accounts.
  o Stored JWT securely and expires on session timeout.

### 5.3.3.2 Weight Entry Procedure
• Preconditions: The user is logged in as operator and has delivery records available.
• Steps:
  a. Navigate to weight entry page.
  b. Select a delivery from available deliveries.
  c. Enter actual weight measurement.
  d. Submit the weight record.
  e. System updates delivery status and creates weight record.
• Expected Outcomes:
  o Weight record is saved with correct delivery association.
  o Delivery status updates automatically.
  o Weight validation prevents invalid values.

### 5.3.3.3 IoT Integration Testing
• Preconditions: IoT devices are configured and connected.
• Steps:
  a. Access IoT Weight Display component.
  b. Verify real-time weight readings.
  c. Test automatic weight capture functionality.
  d. Validate device connectivity status.
• Expected Results:
  o Real-time weight data displays correctly.
  o IoT device status shows connection state accurately.
  o System handles device disconnection gracefully.

### 5.3.3.4 User Management Procedure (Admin Only)
• Prerequisites: Admin user is logged in.
• Steps:
  a. Navigate to user management page.
  b. Create a new user with specific role.
  c. Edit existing user roles.
  d. Test role-based access restrictions.
• Expected Results:
  o New users are created with correct roles.
  o Role changes take effect immediately.
  o Non-admin users cannot access this function.

### 5.3.3.5 Reporting and Analytics Testing
• Preconditions: User has manager or marketing role.
• Steps:
  a. Access reports section.
  b. Generate daily and weekly reports.
  c. Test report export functionality.
  d. Configure report templates.
• Expected Results:
  o Reports generate with accurate data.
  o Export functions produce properly formatted files.
  o Operators cannot access report configuration.

### 5.3.3.6 Activity Logging and Security Auditing Procedures
• Preconditions: System is running.
• Steps:
  a. Carry out any user activity (weight entry, user management, approvals, etc.).
  b. Dashboard is checked by administrator for activity logs.
  c. Filter and search logs based on time stamp, action, or user.
  d. Export logs in CSV.
• Expected Outcomes:
  o All user activity is logged in real-time.
  o User activity can be seen by Admin.
  o Logs cannot be removed or edited.

### 5.3.4 Procedures for the demo are created and verified
To ensure that the entire core functionality of the VeroScale Weight Management System was appropriately presented and understood by the stakeholders, the development team designed a formal demo process. The demo was structured in a way that was both real-world process like and focused on highlighting the system's major strengths.

The demo processes were documented and tested prior to client presentation to ensure that they were correct and functional. The following procedures were followed during demonstration:

**Demo Scenario Overview**
The demo addressed four user roles:
• Admin (user management and system administration),
• Manager (approval workflows and reporting),
• Marketing (data analysis and report generation),
• Operator (weight entry and delivery processing).

**Demo Steps**

### 5.3.4.1 Login Authentication (All Users)
• Open login page and provide credentials.
• System authenticates the credentials using JWT and redirects the user to their respective dashboard.
• Purpose: To showcase role-based redirection and secure authentication.

### 5.3.4.2 Weight Entry Process (Operator Role)
• Access the "Weight Entry" page.
• Select a delivery and enter actual weight measurement.
• System validates weight, updates delivery status, and confirms successful entry.
• Objective: To illustrate weight measurement workflow and delivery tracking.

### 5.3.4.3 IoT Integration Demo (Operator Role)
• Show real-time weight readings from IoT scales.
• Demonstrate automatic weight capture and device connectivity.
• Purpose: To showcase automated weight capture and IoT integration.

### 5.3.4.4 User Management (Admin Only)
• Navigate to user management page.
• Create new users and modify existing user roles.
• Verify role-based access control instantly.
• Purpose: To show administrative control and role management.

### 5.3.4.5 Reporting and Analytics (Manager/Marketing Role)
• Access reports section and generate weight summaries.
• Export reports in PDF, Excel formats.
• Objective: To demonstrate business intelligence and compliance reporting.

### 5.3.4.6 Approval Workflow (Manager Role)
• Review pending weight entries with discrepancy alerts.
• Approve or reject records with comments.
• Purpose: To demonstrate quality control and approval processes.

### 5.3.4.7 Data Integrity Verification (Simulated Test)
• Upload a weight record, attempt unauthorized modification.
• System detects integrity issues and prevents unauthorized changes.
• Purpose: To test data integrity protection and audit capabilities.

### 5.3.4.8 Verification
• Each demo step was rehearsed prior to the client session.
• A checklist was used to verify that every function was in working order during presentation.
• A live demo was shown to the client.
• Feedback confirmed that the demo effectively demonstrated system features.

The demo steps were successfully executed and confirmed system readiness. Stakeholder feedback acknowledged all key features were well showcased and executed as expected, confirming the reliability and usability of VeroScale Weight Management System.