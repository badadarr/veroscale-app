# 🚀 POWERFUL PROMPT: Weight Management System

## 📋 System Overview
Create a comprehensive **Weight Management System** for industrial operations with multi-role access, real-time IoT integration, and supplier coordination.

## 🎯 Core Requirements

### **Tech Stack**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Hot Toast
- **Backend**: Next.js API Routes, PostgreSQL/Supabase
- **Authentication**: JWT-based with role-based access control
- **UI Components**: Custom component library with consistent design
- **Real-time**: IoT weight scale integration, RFID scanning

### **Database Schema**
```sql
-- Core Tables
users (id, name, email, password, role_id, department, status, created_at)
roles (id, name) -- admin, manager, operator, marketing
samples_item (id, category, item, sample_weight, created_at)
weight_records (record_id, user_id, item_id, total_weight, timestamp, status, approved_by)
suppliers (id, name, contact_person, email, phone, address, status)
supplier_deliveries (id, supplier_id, marketing_user_id, item_name, expected_quantity, expected_weight, scheduled_date, delivery_status, notes)
sessions (session_id, user_id, start_time, end_time, status)
```

### **User Roles & Permissions**

#### **🔑 Admin**
- Full system access
- User management (CRUD)
- System configuration
- All data access and reports

#### **👔 Manager** 
- Monitor all operations
- Approve/reject weight records
- View reports and analytics
- Manage samples and suppliers

#### **⚙️ Operator**
- Weight entry and measurement
- Sample management
- IoT scale integration
- RFID scanning for materials

#### **📈 Marketing**
- Supplier management (CRUD)
- Delivery scheduling
- Coordinate with external suppliers
- Track delivery status

## 🏗️ System Architecture

### **Frontend Structure**
```
pages/
├── dashboard.tsx           # Main dashboard with analytics
├── login.tsx              # Multi-role login with quick buttons
├── users/index.tsx         # User management (Admin only)
├── samples/index.tsx       # Material samples (All roles)
├── suppliers/index.tsx     # Supplier management (Admin/Marketing)
├── deliveries/index.tsx    # Delivery scheduling (Admin/Marketing)
├── operations/
│   ├── weight-entry.tsx    # Delivery-based weighing
│   ├── scan-entry.tsx      # RFID scanning
│   └── my-records.tsx      # Personal records
└── weights/index.tsx       # Weight records with approval

components/
├── layouts/DashboardLayout.tsx  # Role-based navigation
├── ui/                          # Reusable components
│   ├── Modal.tsx               # Popup forms
│   ├── Table.tsx               # Data tables with pagination
│   ├── IoTWeightDisplay.tsx    # Real-time weight display
│   └── RFIDUserDisplay.tsx     # RFID integration
```

### **API Structure**
```
pages/api/
├── auth/
│   ├── login.ts           # JWT authentication
│   ├── register.ts        # User registration
│   └── logout.ts          # Session cleanup
├── users/
│   ├── index.ts           # CRUD with pagination & search
│   └── [id].ts            # Individual user operations
├── samples/
│   └── index.ts           # Material samples CRUD
├── suppliers/
│   └── index.ts           # Supplier management
├── deliveries/
│   ├── index.ts           # Delivery CRUD with pagination
│   └── [id].ts            # Status updates
├── weights/
│   ├── index.ts           # Weight records with filtering
│   └── batch.ts           # Batch operations
└── iot/
    ├── current-weight.ts  # Real-time weight data
    ├── status.ts          # IoT device status
    └── webhook.ts         # IoT callbacks
```

## 🔄 Business Workflow

### **Delivery-to-Weight Process**
1. **Marketing** schedules delivery from supplier
2. **System** validates delivery date (no early processing)
3. **Manager** monitors delivery status
4. **Marketing** marks as "shipped" when goods depart
5. **Operator** weighs delivery (only on/after scheduled date)
6. **System** auto-completes delivery and creates weight record

### **Sample Management**
- All roles can add new material samples
- IoT integration for automatic weight capture
- Category-based organization
- Reference weights for variance calculation

### **Approval Workflow**
- Weight records start as "pending"
- Managers approve/reject records
- Audit trail with timestamps
- Status-based filtering and reporting

## 🎨 UI/UX Requirements

### **Design System**
- **Colors**: Primary (blue), Secondary (gray), Success (green), Warning (yellow), Error (red)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Consistent button styles, form inputs, tables
- **Responsive**: Mobile-first design with desktop optimization

### **Key Features**
- **Quick Login**: Role-based login buttons (Admin, Marketing, Manager, Operator)
- **Real-time Updates**: Live weight data from IoT scales
- **Smart Forms**: Auto-populate from IoT, validation, error handling
- **Data Tables**: Pagination, search, filtering, sorting
- **Status Indicators**: Color-coded status badges
- **Toast Notifications**: Success/error feedback
- **Date Validation**: Prevent premature actions

### **Dashboard Analytics**
- Total samples, weight records, pending approvals
- Weight by category charts
- Top users by activity
- Materials overview with usage stats
- Recent activity feed

## 🔧 Technical Implementation

### **Authentication & Security**
```typescript
// JWT-based auth with role checking
const getUserFromToken = (req: NextApiRequest) => {
  // Extract and verify JWT token
  // Return user object with role information
}

const isAdmin = (user: User) => user.role === 'admin'
const isManagerOrAdmin = (user: User) => ['admin', 'manager'].includes(user.role)
```

### **Database Integration**
```typescript
// Flexible database adapter (MySQL/Supabase)
const executeQuery = async <T>({
  table,
  action,
  columns,
  filters,
  data
}: QueryParams): Promise<T> => {
  // Handle both SQL and Supabase queries
  // Return consistent data format
}
```

### **IoT Integration**
```typescript
// Real-time weight capture
const IoTWeightDisplay = ({ onWeightSelect }) => {
  // Connect to IoT scale
  // Display live weight data
  // Allow weight selection for forms
}
```

### **Pagination & Search**
```typescript
// Consistent pagination across all tables
interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// URL-based pagination: ?page=1&limit=10&search=query
```

## 🚀 Advanced Features

### **Real-time Capabilities**
- Live IoT weight data streaming
- RFID material identification
- Automatic sample weight capture
- Real-time status updates

### **Business Logic**
- Date-based delivery validation
- Automatic status transitions
- Variance calculation against samples
- Batch processing capabilities

### **Reporting & Analytics**
- Weight trends over time
- Supplier performance metrics
- User activity reports
- Material usage analytics

## 📱 Responsive Design
- Mobile-optimized forms and tables
- Touch-friendly interface
- Collapsible navigation
- Adaptive layouts

## 🔒 Security Features
- Role-based access control
- JWT token authentication
- Input validation and sanitization
- Audit logging
- Session management

## 🎯 Success Criteria
- ✅ Multi-role authentication system
- ✅ Complete CRUD operations for all entities
- ✅ Real-time IoT integration
- ✅ Delivery-to-weight workflow
- ✅ Responsive, professional UI
- ✅ Comprehensive pagination and search
- ✅ Date validation and business rules
- ✅ Dashboard with analytics
- ✅ Error handling and user feedback

---

**🎯 PROMPT INSTRUCTION**: Build this complete Weight Management System following the exact specifications above. Focus on clean, production-ready code with proper TypeScript types, error handling, and user experience. Implement all features systematically, ensuring each component works seamlessly with others.