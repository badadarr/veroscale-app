# 🔐 JWT Authentication Guide - VeroScale App

## Overview
Dokumentasi lengkap tentang implementasi JWT (JSON Web Token) authentication di aplikasi VeroScale, termasuk semua file yang terlibat dalam sistem autentikasi.

## 📁 File Structure & Components

### 🚀 Backend Server Routes
- **`server/routes/auth.route.ts`** - Main authentication routes (register, login, logout)
- **`server/middleware/auth.middleware.ts`** - JWT verification middleware

### 🔧 Next.js API Routes
- **`pages/api/auth/login.ts`** - Frontend login API endpoint
- **`pages/api/auth/register.ts`** - Frontend register API endpoint  
- **`pages/api/auth/logout.ts`** - Frontend logout API endpoint
- **`pages/api/users/index.ts`** - Protected user management API
- **`pages/api/users/[id].ts`** - Individual user API (protected)
- **`pages/api/deliveries/index.ts`** - Protected deliveries API
- **`pages/api/suppliers/index.ts`** - Protected suppliers API
- **`pages/api/reports/generate.ts`** - Protected reports API

### 🎯 Authentication Libraries
- **`lib/auth.ts`** - Core JWT functions (generateToken, verifyToken, getUserFromToken)
- **`lib/db-adapter.ts`** - Database query adapter
- **`lib/supabase.ts`** - Supabase client configuration
- **`lib/arcjet-middleware.ts`** - Rate limiting protection

### 🖥️ Frontend Components
- **`contexts/AuthContext.tsx`** - React Context for auth state management
- **`pages/login.tsx`** - Login page component
- **`pages/dashboard.tsx`** - Protected dashboard page
- **`pages/index.tsx`** - Landing page with auth check

---

## 🔄 JWT Authentication Flow

### 1. **Registration Process** 
*File: `server/routes/auth.route.ts` (lines 12-78)*

```typescript
// Hash password with bcrypt
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Generate JWT token
const token = jwt.sign(
  { id: insertId, email, role: 'user' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Create user session in database
await connection.execute(
  'INSERT INTO sessions (user_id, status) VALUES (?, ?)',
  [insertId, 'active']
);
```

### 2. **Login Process**
*File: `server/routes/auth.route.ts` (lines 80-140)*

```typescript
// Verify password
const isMatch = await bcrypt.compare(password, user.password);

// Generate JWT with user data
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Return token and user info
res.status(200).json({
  token,
  user: { id, name, email, role }
});
```

### 3. **Frontend Login Integration**
*File: `pages/api/auth/login.ts` (lines 1-96)*

```typescript
import { generateToken } from "../../../lib/auth";
import { executeQuery } from "../../../lib/db-adapter";

// Generate token using auth library
const token = generateToken({
  id: user.id,
  email: user.email,
  name: user.name,
  role: role.name,
});
```

---

## 🛡️ JWT Verification & Middleware

### 1. **Server Middleware**
*File: `server/middleware/auth.middleware.ts` (lines 1-45)*

```typescript
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = decoded;
    
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### 2. **Auth Utility Functions**
*File: `lib/auth.ts` (lines 1-157)*

```typescript
// Generate JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch (err) {
    return null;
  }
}

// Get user from JWT token with fresh DB data
export async function getUserFromToken(req: NextApiRequest): Promise<UserPayload | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  // Fetch fresh user data from Supabase
  const { data: userFromDb, error } = await supabase
    .from("users")
    .select("id, email, name, roles:role_id (name)")
    .eq("id", decoded.userId)
    .single();

  return userFromDb;
}
```

---

## 🎯 Frontend State Management

### **React Auth Context**
*File: `contexts/AuthContext.tsx` (lines 1-176)*

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (token) {
        // Set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Load user data from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const { data } = await axios.post("/api/auth/login", { email, password });

    if (data.token) {
      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Set axios header for subsequent requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      
      setUser(data.user);
    }
  };

  // Logout function
  const logout = async () => {
    // Call logout API
    await axios.post("/api/auth/logout");
    
    // Clear storage and state
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    
    setUser(null);
    router.push("/login");
  };
};
```

---

## 🔒 Protected API Routes Examples

### 1. **User Management API**
*File: `pages/api/users/index.ts` (lines 1-50)*

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user from JWT token
  const user = await getUserFromToken(req);

  // Check authorization
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // Process request if authorized
  switch (req.method) {
    case "GET":
      return getUsers(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}
```

### 2. **Individual User API**
*File: `pages/api/users/[id].ts`*

```typescript
// Requires admin or manager role
const user = await getUserFromToken(req);
if (!user || !isManagerOrAdmin(user)) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

### 3. **Deliveries API** 
*File: `pages/api/deliveries/index.ts`*

```typescript
// Requires authenticated user
const user = await getUserFromToken(req);
if (!user) {
  return res.status(401).json({ message: "Authentication required" });
}
```

---

## 🛡️ Role-Based Access Control (RBAC)

### **Role Functions**
*File: `lib/auth.ts` (lines 120-157)*

```typescript
// Admin access (full permissions)
export function isAdmin(user: UserPayload | null): boolean {
  return user?.role === "admin";
}

// Manager access  
export function isManager(user: UserPayload | null): boolean {
  return user?.role === "manager";
}

// Operator access (limited)
export function isOperator(user: UserPayload | null): boolean {
  return user?.role === "operator";
}

// Manager or Admin access
export function isManagerOrAdmin(user: UserPayload | null): boolean {
  return user?.role === "admin" || user?.role === "manager";
}

// Marketing role access
export function isMarketing(user: UserPayload | null): boolean {
  return user?.role === "marketing";
}

// Sample management permission
export function canManageSamples(user: UserPayload | null): boolean {
  return user?.role === "admin" || user?.role === "manager" || user?.role === "marketing";
}

// Full system access
export function hasFullAccess(user: UserPayload | null): boolean {
  return user?.role === "admin";
}
```

### **Role Usage in Pages**
*File: `pages/reports/index.tsx` (lines 70-85)*

```typescript
// Redirect if unauthorized
useEffect(() => {
  if (user && !["admin", "manager", "operator"].includes(user.role)) {
    toast.error("You do not have permission to access reports");
    router.push("/dashboard");
  }
}, [user, router]);

// Limit operator access
useEffect(() => {
  if (user && user.role === "operator" && 
      (activeTab === "templates" || activeTab === "configuration")) {
    setActiveTab("available");
    toast.error("Operators can only view available reports");
  }
}, [user, activeTab]);
```

---

## 🔐 Security Features

### 1. **Rate Limiting**
*File: `lib/arcjet-middleware.ts`*
- Protects auth endpoints with Arcjet
- 5 requests per 15 minutes for login attempts

### 2. **Password Security**
*File: `server/routes/auth.route.ts`*
```typescript
// Hash passwords with bcrypt
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verify passwords securely
const isMatch = await bcrypt.compare(password, user.password);
```

### 3. **Session Management**
*File: `server/routes/auth.route.ts` (lines 160-190)*
```typescript
// Create session on login
await connection.execute(
  'INSERT INTO sessions (user_id, status) VALUES (?, ?)',
  [user.id, 'active']
);

// End sessions on logout
await connection.execute(
  'UPDATE sessions SET status = ?, end_time = NOW() WHERE user_id = ? AND status = ?',
  ['ended', userId, 'active']
);
```

### 4. **Token Configuration**
- **Server JWT expiration**: 24 hours
- **Client JWT expiration**: 8 hours  
- **Secret key**: Environment variable `JWT_SECRET`

---

## 📱 Frontend Integration

### **Protected Page Example**
*File: `pages/dashboard.tsx`*

```typescript
export default function Dashboard() {
  const { user, loading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <DashboardLayout>...</DashboardLayout>;
}
```

### **Login Page Integration**
*File: `pages/login.tsx`*

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  try {
    await login(email, password);
    router.push("/dashboard");
  } catch (error) {
    toast.error("Login failed");
  }
};
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  department VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Roles Table**
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Default roles: admin, manager, operator, marketing
```

### **Sessions Table** 
```sql
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  status ENUM('active', 'ended') DEFAULT 'active',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🚨 Error Handling

### **Common JWT Errors**
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions  
- **Token Expired**: Auto-redirects to login page
- **Invalid Credentials**: Wrong email/password combination

### **Error Response Format**
```json
{
  "message": "Authentication token is required",
  "error": "UNAUTHORIZED"
}
```

---

## 🔧 Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-change-in-production

# Database Configuration  
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=admin1234
DB_NAME=public

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📋 Summary

### **Key Benefits:**
✅ **Stateless Authentication** - No server-side session storage  
✅ **Scalable** - Works across multiple server instances  
✅ **Secure** - bcrypt password hashing + JWT signing  
✅ **Role-Based** - Granular permission control  
✅ **Cross-Origin** - Supports API calls from different domains  
✅ **Auto-Refresh** - Seamless token renewal on app restart  

### **Security Measures:**
🔒 **Rate Limited** - Prevents brute force attacks  
🔒 **Token Expiration** - Automatic logout after 8 hours  
🔒 **Password Hashing** - bcrypt with salt rounds  
🔒 **Session Tracking** - Database-logged user sessions  
🔒 **Permission Checks** - Route-level authorization  

This JWT implementation provides a robust, secure, and scalable authentication system for the VeroScale application.
