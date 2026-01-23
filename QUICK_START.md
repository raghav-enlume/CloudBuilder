# CloudBuilder Integration - Step-by-Step Implementation

## 🎯 Quick Start (5 Minutes)

Follow this step-by-step guide to integrate CloudBuilder into your Dia frontend application.

---

## ✅ Step 1: Create Layout Component (2 min)

Create file: `src/components/layout/MainLayout.tsx`

```tsx
import { ReactNode, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Diagram', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r transition-all duration-300`}
      >
        <div className="p-4">
          {sidebarOpen && <h1 className="font-bold">CloudBuilder</h1>}
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block px-4 py-2 rounded ${
                location.pathname === item.href
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              {sidebarOpen && item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-lg font-bold">CloudBuilder</h2>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
```

---

## ✅ Step 2: Update Index Page (1 min)

Update file: `src/pages/Index.tsx`

```tsx
import { DiagramBuilder } from '@/components/diagram/DiagramBuilder';
import MainLayout from '@/components/layout/MainLayout';

const Index = () => {
  return (
    <MainLayout>
      <div className="w-full h-full">
        <DiagramBuilder />
      </div>
    </MainLayout>
  );
};

export default Index;
```

---

## ✅ Step 3: Create Dashboard Page (1 min)

Create file: `src/pages/Dashboard.tsx`

```tsx
import MainLayout from '@/components/layout/MainLayout';

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Total Diagrams</p>
            <p className="text-3xl font-bold">24</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Total Resources</p>
            <p className="text-3xl font-bold">458</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Regions</p>
            <p className="text-3xl font-bold">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Last Updated</p>
            <p className="text-xl font-bold">Today</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
```

---

## ✅ Step 4: Update App.tsx (1 min)

Update file: `src/App.tsx`

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

---

## ✅ Step 5: Test the Integration (0 min - automatic)

```bash
# Start dev server
npm run dev

# The app should show:
# - http://localhost:5173/ → Diagram page with navigation
# - http://localhost:5173/dashboard → Dashboard page
```

---

## 🎉 Done! Your app now has:

✅ **Multi-page routing**
- `/` → CloudBuilder Diagram page
- `/dashboard` → Dashboard page

✅ **Navigation sidebar**
- Collapsible menu
- Active page indicator
- Clean UI

✅ **Dashboard page**
- Metrics cards
- Professional layout
- Ready for customization

✅ **Full CloudBuilder integration**
- All diagram features available
- File upload working
- Connections and edges visible

---

## 📊 Final File Structure

```
src/
├── App.tsx                    (UPDATED)
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx     (NEW)
│   └── diagram/
│       └── ... (existing files)
├── pages/
│   ├── Index.tsx              (UPDATED)
│   ├── Dashboard.tsx           (NEW)
│   └── NotFound.tsx
└── ... (other files)
```

---

## 🚀 Next Steps (Optional Enhancements)

### Add More Pages

```tsx
// src/pages/Projects.tsx
import MainLayout from '@/components/layout/MainLayout';

const Projects = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        {/* Add project list here */}
      </div>
    </MainLayout>
  );
};

export default Projects;
```

Then add route in `App.tsx`:
```tsx
<Route path="/projects" element={<Projects />} />
```

And update `MainLayout.tsx` nav:
```tsx
const navItems = [
  { name: 'Diagram', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Projects', href: '/projects' },  // NEW
];
```

---

## 🐛 Troubleshooting

### Issue: Navigation not working
**Solution**: Ensure `react-router-dom` is imported and BrowserRouter wraps Routes

### Issue: Diagram not loading
**Solution**: Check that `DiagramBuilder` component path is correct

### Issue: Styles not applying
**Solution**: Ensure Tailwind CSS is configured in `tailwind.config.ts`

### Issue: Sidebar overlapping on mobile
**Solution**: Add responsive breakpoints (see INTEGRATION_TEMPLATES.md)

---

## 📝 Configuration Files (No Changes Needed)

Your existing files should work as-is:
- ✅ `vite.config.ts`
- ✅ `tsconfig.json`
- ✅ `tailwind.config.ts`
- ✅ `package.json`

---

## 🎓 Learning Resources

1. **React Router**: https://reactrouter.com
2. **React Fundamentals**: https://react.dev
3. **Tailwind CSS**: https://tailwindcss.com
4. **CloudBuilder Architecture**: See `PROJECT_ARCHITECTURE_GUIDE.md`

---

## ✨ Pro Tips

1. **Keyboard Shortcuts**: Add ESC to close modals
2. **State Management**: Use Context API for sharing diagram state
3. **Error Boundaries**: Wrap pages with error boundaries
4. **Code Splitting**: Use React.lazy() for large pages
5. **Performance**: Optimize images with next/image equivalents

---

## 📊 Integration Complexity Levels

| Level | Time | Complexity | Features |
|-------|------|-----------|----------|
| Basic | 5 min | ⭐ | CloudBuilder page + navigation |
| Intermediate | 15 min | ⭐⭐ | Dashboard + state management |
| Advanced | 30 min | ⭐⭐⭐ | Modal, widgets, authentication |

**You completed: BASIC level! ✅**

---

## 🎯 Success Criteria

After completing these steps:

- [ ] App starts without errors (`npm run dev`)
- [ ] Navigation between pages works
- [ ] CloudBuilder loads on `/` page
- [ ] Dashboard loads on `/dashboard` page
- [ ] File upload works in diagram
- [ ] Diagram renders with all resources
- [ ] Connections visible between resources
- [ ] No console errors

---

## 🔗 Next Document to Read

- For advanced integrations: `INTEGRATION_GUIDE.md`
- For code examples: `INTEGRATION_TEMPLATES.md`
- For architecture details: `PROJECT_ARCHITECTURE_GUIDE.md`
- For data flow: `DIAGRAM_FLOW_VISUALIZATION.md`

---

## 💬 Questions?

If you have questions about:
- **Architecture**: See `PROJECT_ARCHITECTURE_GUIDE.md`
- **Data Flow**: See `DIAGRAM_FLOW_VISUALIZATION.md`
- **Integration Options**: See `INTEGRATION_GUIDE.md`
- **Code Examples**: See `INTEGRATION_TEMPLATES.md`

**Congratulations! You've successfully integrated CloudBuilder! 🎉**

