# Weight Management System - Development Prompt

## Project Overview
Buatkan aplikasi **Weight Management System** yang komprehensif untuk mengelola data penimbangan material dengan sistem authentication berbasis role.

## Tech Stack Requirements

### Frontend & Backend
- **Next.js 14** dengan TypeScript
- **Tailwind CSS** untuk styling dan responsive design
- **React Hook Form** untuk form handling dan validation
- **Zod** untuk schema validation
- **Lucide React** untuk icons

### Database & Authentication
- **Supabase** sebagai database (PostgreSQL)
- **JWT** untuk authentication dan session management
- **bcryptjs** untuk password hashing

### Data Visualization & Export
- **Chart.js** atau **Recharts** untuk dashboard charts
- **jsPDF** untuk export PDF reports
- **React Hot Toast** untuk notifications

## Core Features

### 1. Authentication System
- Login/logout dengan JWT tokens
- Role-based access control (Admin, Manager, Operator)
- Protected routes berdasarkan user role
- Session management dengan 8 jam expiry
- Password hashing dengan bcrypt

### 2. User Management
- CRUD operations untuk users
- Role assignment dan management
- User profile management
- User activity tracking

### 3. Material & Weight Management
- Input data timbangan material
- Tracking berat material masuk/keluar
- Kategori dan klasifikasi material
- History lengkap penimbangan
- Real-time weight updates

### 4. Dashboard & Analytics
- Interactive charts untuk visualisasi data
- Summary statistics dan KPI
- Filter data berdasarkan tanggal/kategori
- Export reports ke PDF/Excel
- Real-time dashboard updates

### 5. Reporting System
- Generate laporan harian/bulanan
- Export data dalam berbagai format
- Custom report templates
- Automated report scheduling

## Database Schema

### Core Tables
```sql
-- Roles table
roles (
  id: serial primary key,
  name: varchar(50) unique not null
)

-- Users table  
users (
  id: serial primary key,
  email: varchar(255) unique not null,
  name: varchar(255) not null,
  password: varchar(255) not null,
  role_id: integer references roles(id),
  created_at: timestamp default now(),
  updated_at: timestamp default now()
)

-- Materials table
materials (
  id: serial primary key,
  name: varchar(255) not null,
  category: varchar(100),
  description: text,
  unit: varchar(20) default 'kg',
  created_at: timestamp default now()
)

-- Weighings table
weighings (
  id: serial primary key,
  material_id: integer references materials(id),
  weight: decimal(10,2) not null,
  type: varchar(20) check (type in ('in', 'out')),
  date: timestamp default now(),
  user_id: integer references users(id),
  notes: text,
  created_at: timestamp default now()
)
```

## Project Structure

```
veroscale-app/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── charts/          # Chart components
│   └── layout/          # Layout components
├── pages/
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard pages
│   ├── users/           # User management
│   ├── materials/       # Material management
│   └── reports/         # Reports pages
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── supabase.ts      # Database connection
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── scripts/             # Database migration scripts
```

## Key Requirements

### Security & Performance
- Implement proper input validation dan sanitization
- Rate limiting untuk API endpoints
- Secure password policies
- Optimized database queries
- Image optimization untuk charts

### User Experience
- Responsive design untuk mobile dan desktop
- Loading states dan error handling
- Toast notifications untuk user feedback
- Intuitive navigation dan UI/UX
- Keyboard shortcuts untuk power users

### Code Quality
- Clean code architecture dengan proper separation of concerns
- Comprehensive TypeScript types
- Reusable components dan utilities
- Proper error boundaries
- Unit tests untuk critical functions

## Deployment Requirements

### Environment Setup
- Environment variables untuk production/development
- Supabase connection configuration
- JWT secret management
- CORS configuration

### Vercel Deployment
- Optimized build configuration
- Static file optimization
- API routes optimization
- Environment variables setup

## Additional Features (Nice to Have)

### Advanced Analytics
- Predictive analytics untuk material usage
- Trend analysis dan forecasting
- Custom dashboard widgets
- Data export automation

### Integration Capabilities
- REST API untuk third-party integrations
- Webhook support
- CSV/Excel import functionality
- Backup dan restore features

## Success Criteria
1. Aplikasi dapat handle multiple users dengan different roles
2. Real-time data updates tanpa page refresh
3. Responsive design yang bekerja di semua device sizes
4. Fast loading times (< 3 seconds)
5. Secure authentication dan data protection
6. Intuitive user interface yang mudah digunakan
7. Comprehensive error handling dan user feedback
8. Scalable architecture untuk future enhancements

## Development Timeline Estimate
- **Week 1-2**: Setup project, authentication, basic CRUD
- **Week 3-4**: Dashboard, charts, dan reporting features
- **Week 5-6**: Advanced features, testing, dan deployment optimization

Buatkan aplikasi ini dengan fokus pada code quality, security, dan user experience yang excellent.