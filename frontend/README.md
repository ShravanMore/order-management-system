# Order Management System - Frontend

Modern Next.js 16 frontend for the Physiotherapy Equipment Order Management System.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Visit **http://localhost:3000**

---

## 📦 Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3
- **State Management**: @tanstack/react-query
- **Forms**: react-hook-form + zod
- **HTTP Client**: axios
- **Theme**: next-themes (dark mode)
- **UI Components**: shadcn/ui compatible
- **Icons**: lucide-react
- **Charts**: recharts
- **Notifications**: sonner

---

## 📁 Project Structure

```
frontend/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Homepage
│   ├── providers.tsx   # App-wide providers
│   └── globals.css     # Global styles & theme
│
├── lib/                # Core utilities
│   ├── api-client.ts  # Axios instance with interceptors
│   ├── auth.ts        # Authentication & authorization
│   └── utils.ts       # Helper functions
│
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types (mirrors backend)
│
├── components/        # React components (to be added)
│   ├── ui/           # Base UI components
│   └── features/     # Feature-specific components
│
└── hooks/            # Custom React hooks (to be added)
```

---

## 🔐 Authentication

### Cookie-Based Auth
Uses `js-cookie` for cookie management (middleware-readable):
- Access token: 30 minutes
- Refresh token: 7 days
- httpOnly-style cookies
- Secure in production

### Auto-Refresh
Axios interceptor automatically:
1. Attaches access token to requests
2. Detects 401 errors
3. Attempts token refresh
4. Retries original request
5. Redirects to /login if refresh fails

### Usage Example
```typescript
import { setTokens, getUser, isAdmin } from "@/lib/auth";

// After login
setTokens(accessToken, refreshToken);
setUser(userData);

// Check auth status
const user = getUser();
const admin = isAdmin();
```

---

## 🎨 Theming

### Dark Mode
Powered by `next-themes`:
```typescript
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();

// Switch theme
setTheme("light");  // or "dark" or "system"
```

### Colors
Neutral base with custom CSS variables:
- Background & Foreground
- Primary & Secondary
- Muted & Accent
- Destructive (errors)
- Border, Input, Ring
- Chart colors (5 variants)

---

## 📡 API Integration

### Base Configuration
```typescript
// lib/api-client.ts
baseURL: process.env.NEXT_PUBLIC_API_URL
```

### Usage Example
```typescript
import apiClient from "@/lib/api-client";

// GET request (auto-includes token)
const products = await apiClient.get("/products");

// POST request
const order = await apiClient.post("/orders", orderData);

// With React Query
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: () => apiClient.get("/products").then(res => res.data)
});
```

---

## 📝 Forms & Validation

### Stack
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Integration layer

### Example
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

---

## 🍞 Notifications

### Sonner Toasts
```typescript
import { toast } from "sonner";

toast.success("Success!");
toast.error("Error!");
toast.info("Info");
toast.warning("Warning");
```

### Configuration
- Position: top-right
- Rich colors enabled
- Dismissible with close button

---

## 📊 Data Fetching

### React Query
```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});

// Mutation
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    toast.success("Order created!");
  },
});
```

### Configuration
- Stale time: 1 minute
- No refetch on window focus
- Automatic retries with exponential backoff

---

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework:
```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">
  <h2 className="text-2xl font-bold">Hello</h2>
</div>
```

### Custom Utilities
```typescript
import { cn } from "@/lib/utils";

// Merge classes intelligently
className={cn("base-class", conditionalClass && "active")}
```

---

## 🧩 Components (To Be Built)

### Base UI Components
- Button
- Input
- Card
- Badge
- Dialog
- Dropdown
- Table
- Form fields

### Feature Components
- LoginForm
- DashboardStats
- ProductList
- OrderTable
- DealerCard

---

## 🔒 Protected Routes

### Middleware (To Be Added)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  if (!token) {
    return NextResponse.redirect("/login");
  }
}
```

### Role-Based Access
```typescript
import { isAdmin } from "@/lib/auth";

if (!isAdmin()) {
  // Redirect or show error
}
```

---

## 📱 Responsive Design

Built mobile-first with Tailwind breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🧪 Scripts

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Quality
npm run lint         # Run ESLint
npx tsc --noEmit    # Type checking
```

---

## 🌍 Environment Variables

### Required Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Optional Variables
```bash
# For production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## 🎯 Features to Build

### Phase 1: Authentication
- [ ] Login page
- [ ] Protected route middleware
- [ ] User profile dropdown
- [ ] Logout functionality

### Phase 2: Dashboard
- [ ] Admin dashboard with stats
- [ ] Order trend charts
- [ ] Low stock alerts
- [ ] Quick actions

### Phase 3: Product Management
- [ ] Product list with filters
- [ ] Product detail view
- [ ] Create/edit product form
- [ ] Stock adjustment

### Phase 4: Order Management
- [ ] Order list with filters
- [ ] Order detail with items
- [ ] Create order flow
- [ ] Status update
- [ ] Order history

### Phase 5: Dealer Management
- [ ] Dealer list
- [ ] Dealer detail
- [ ] Create/edit dealer

### Phase 6: Employee Management
- [ ] Employee list (admin only)
- [ ] Create employee
- [ ] Workload view

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Conflict
```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit

# Generate types
npm run build
```

---

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Guide](https://tanstack.com/query/latest/docs/react/overview)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Zod Documentation](https://zod.dev/)

---

## 🤝 Development Workflow

1. **Start backend**: `cd backend && uvicorn app.main:app --reload`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Make changes**: Edit files, see hot reload
4. **Type check**: `npx tsc --noEmit`
5. **Build test**: `npm run build`
6. **Deploy**: Build and deploy to Vercel/Netlify

---

## 📝 Code Style

### TypeScript
- Use strict mode
- Define types explicitly
- Avoid `any` type
- Use interfaces for objects

### Components
- Functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Extract reusable logic to hooks

### Naming
- Components: PascalCase
- Files: kebab-case
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Set `NEXT_PUBLIC_API_URL` in Vercel dashboard

### Build Command
```bash
npm run build
```

### Output Directory
```bash
.next
```

---

**Built with ❤️ using Next.js 16**
