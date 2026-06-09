# 🏢 Actitech Operating System Portal

A comprehensive internal operations platform for Acti-Tech Limited featuring employee management, department organization, and analytics dashboard.

## ✨ Features

### 🔐 Authentication
- Supabase-powered authentication (Email & Password)
- Role-based access control (Admin, Manager, Employee)
- Secure session management
- Sign in / Sign up functionality

### 👥 Employee Management
- **Employee Directory**: Browse all employees with search & filter
- **Department Management**: Organize employees into departments
- **User Profiles**: View employee details and status
- **Admin Controls**: Add, edit, delete users and manage roles

### 📊 Analytics Dashboard
- Real-time employee statistics
- Department distribution charts
- Active vs inactive employee tracking
- Engagement metrics

### 🏢 Department Features
- Department creation and management
- Assign Head of Department (HOD)
- Department-wide employee view
- Department descriptions

### 🛡️ Admin Panel
- User management (Create, Edit, Delete, Change Roles)
- Audit logging for all admin actions
- User status management (Active, Inactive, On Leave)
- Role assignment (Employee, Manager, Admin)

### 📋 Requisition System (Built-in)
- Submit store requisitions
- Track request status
- HOD approval workflow
- Request history

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

```bash
# 1. Clone/navigate to project
cd actitech-portal

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# 4. Set up Supabase database (see SETUP_GUIDE.md)
# Create tables: profiles, departments, audit_logs, employee_stats

# 5. Run development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── Login.jsx                 # Authentication page
│   ├── Dashboard.jsx             # Main dashboard & router
│   ├── EmployeeDirectory.jsx     # Browse employees
│   ├── DepartmentManagement.jsx  # Manage departments
│   ├── Analytics.jsx             # Statistics & charts
│   ├── AdminPanel.jsx            # Admin controls
│   └── Dashboards/               # Role-specific dashboards
├── components/
│   └── Sidebar.jsx               # Navigation sidebar
├── lib/
│   └── supabase.js              # Supabase client
├── App.jsx                       # Auth wrapper
├── main.jsx                      # Entry point
└── index.css                     # Global styles
```

---

## 🗄️ Database Schema

### profiles (Users)
- id (UUID, Primary Key)
- email (Unique)
- full_name
- avatar_url
- department_id (FK)
- role (employee | manager | admin)
- status (active | inactive | on_leave)

### departments
- id (UUID, Primary Key)
- name (Unique)
- description
- head_id (FK to profiles)

### audit_logs
- id (UUID, Primary Key)
- admin_id (FK to profiles)
- action (Text)
- target_user_id (FK to profiles)
- details (JSON)

### employee_stats
- id (UUID, Primary Key)
- employee_id (FK to profiles)
- login_count
- last_login
- department
- date_recorded

---

## 🎨 Design System

| Element | Color | Usage |
|---------|-------|-------|
| Primary | #1565D8 | Buttons, links, highlights |
| Light | #3AACEE | Accents, gradients |
| Background | #F2F5FB | Page background |
| Card | #FFFFFF | Panels, modals |
| Text | #18243A | Primary text |
| Muted | #7A8EAB | Secondary text, borders |
| Success | #15803D | Active status, approved |
| Warning | #B45309 | On leave, pending |
| Error | #B91C1C | Inactive, rejected |

---

## 📖 Key Components

### EmployeeDirectory
- Search by name/email
- Filter by department
- Employee detail modals
- Status badges

### DepartmentManagement
- Create/edit departments
- Assign HOD
- View department members
- Delete departments

### AdminPanel
- Two tabs: Users & Audit Logs
- Add new users with temp password
- Change roles & status
- View admin action history

### Analytics
- Live employee metrics
- Department distribution charts
- Active rate calculation
- Real-time data

---

## 🔧 Commands

```bash
# Development
npm run dev        # Start dev server (Vite HMR)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

---

## 🔒 Security Features

✅ Row Level Security (RLS) policies in Supabase
✅ Role-based access control (RBAC)
✅ Audit logging for admin actions
✅ Secure Supabase authentication
✅ Protected API routes

---

## 🛠️ Tech Stack

- **Frontend**: React 19.2.6
- **Build Tool**: Vite 8.0.12
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI Framework**: Tailwind CSS 3.4.3
- **Routing**: React Router 7.15.1
- **Icons**: Lucide React 1.16.0
- **Linting**: ESLint 10.3.0

---

## 📝 Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🐛 Troubleshooting

### Users can't log in
- Verify Supabase auth is configured
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Ensure profiles table exists

### Analytics page shows no data
- Verify employees have department_id set
- Check that profiles table has data

### Admin panel not accessible
- Ensure user has role='admin' in profiles table
- Verify RLS policies are set up correctly

### Department filter not working
- Check that employees have department_id foreign keys
- Verify departments table is populated

---

## 📚 Documentation

See `SETUP_GUIDE.md` for:
- Complete database schema SQL
- Detailed setup instructions
- RLS policy configuration
- Production deployment guide

---

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

---

## 📄 License

Internal Use Only - Acti-Tech Limited

---

## 👨‍💻 Support

For issues or questions, contact the development team.

---

**Version**: 1.0
**Last Updated**: June 2026
