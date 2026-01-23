# CloudBuilder Integration - Quick Implementation Templates

This file contains ready-to-use code templates for integrating CloudBuilder into your application.

---

## 🚀 Template 1: Multi-Page Application with Navigation

### Copy these files to your project:

#### `src/components/layout/MainLayout.tsx`

```tsx
import { ReactNode, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { name: 'Diagram', href: '/', icon: '📊' },
  { name: 'Dashboard', href: '/dashboard', icon: '📈' },
  { name: 'Projects', href: '/projects', icon: '📁' },
];

export const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className={sidebarOpen ? 'block' : 'hidden'}>
            <h1 className="text-xl font-bold">CloudBuilder</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-2xl font-bold flex-1 ml-4">
            {navItems.find((item) => item.href === location.pathname)?.name}
          </h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
```

#### `src/pages/DiagramPage.tsx`

```tsx
import { DiagramBuilder } from '@/components/diagram/DiagramBuilder';
import { MainLayout } from '@/components/layout/MainLayout';

export default function DiagramPage() {
  return (
    <MainLayout>
      <div className="w-full h-full">
        <DiagramBuilder />
      </div>
    </MainLayout>
  );
}
```

#### `src/pages/DashboardPage.tsx`

```tsx
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Diagrams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">458</div>
              <p className="text-xs text-muted-foreground">+45 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">AWS regions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">Today</div>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Diagrams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">Diagram {i}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.random() * 100 | 0} resources
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    View
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
```

#### `src/App.tsx` (Updated)

```tsx
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiagramPage from './pages/DiagramPage';
import DashboardPage from './pages/DashboardPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DiagramPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

---

## 🎯 Template 2: Modal Integration

#### `src/components/diagram/DiagramModal.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { DiagramBuilder } from './DiagramBuilder';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function DiagramModal({
  isOpen,
  onClose,
  title = 'AWS Diagram Builder',
}: DiagramModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-5/6 flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <DiagramBuilder />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### `src/pages/DashboardPage.tsx` (with Modal)

```tsx
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DiagramModal } from '@/components/diagram/DiagramModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [diagramModalOpen, setDiagramModalOpen] = useState(false);

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={() => setDiagramModalOpen(true)}
            size="lg"
            className="gap-2"
          >
            + New Diagram
          </Button>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Diagrams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
            </CardContent>
          </Card>
          {/* More cards... */}
        </div>

        {/* Diagram Modal */}
        <DiagramModal
          isOpen={diagramModalOpen}
          onClose={() => setDiagramModalOpen(false)}
          title="Create New Diagram"
        />
      </div>
    </MainLayout>
  );
}
```

---

## 🧩 Template 3: State Management with Context

#### `src/hooks/useDiagramContext.ts`

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Node, Edge } from 'reactflow';

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedFile: File | null;
  diagramName: string;
}

interface DiagramContextType {
  state: DiagramState;
  updateNodes: (nodes: Node[]) => void;
  updateEdges: (edges: Edge[]) => void;
  setSelectedFile: (file: File | null) => void;
  setDiagramName: (name: string) => void;
  reset: () => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

const initialState: DiagramState = {
  nodes: [],
  edges: [],
  selectedFile: null,
  diagramName: 'Untitled Diagram',
};

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagramState>(initialState);

  const updateNodes = (nodes: Node[]) => {
    setState((prev) => ({ ...prev, nodes }));
  };

  const updateEdges = (edges: Edge[]) => {
    setState((prev) => ({ ...prev, edges }));
  };

  const setSelectedFile = (file: File | null) => {
    setState((prev) => ({ ...prev, selectedFile: file }));
  };

  const setDiagramName = (name: string) => {
    setState((prev) => ({ ...prev, diagramName: name }));
  };

  const reset = () => {
    setState(initialState);
  };

  return (
    <DiagramContext.Provider
      value={{
        state,
        updateNodes,
        updateEdges,
        setSelectedFile,
        setDiagramName,
        reset,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}

export function useDiagramContext() {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error(
      'useDiagramContext must be used within DiagramProvider'
    );
  }
  return context;
}
```

#### `src/App.tsx` (with Provider)

```tsx
import { DiagramProvider } from './hooks/useDiagramContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// ... other imports

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DiagramProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Routes */}
          </Routes>
        </BrowserRouter>
      </DiagramProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

---

## 📱 Template 4: Responsive Layout

#### `src/components/layout/ResponsiveLayout.tsx`

```tsx
import { ReactNode, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';

export function ResponsiveLayout({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && (
        <aside
          className={`${
            isMobile
              ? 'fixed left-0 top-0 h-full w-64 z-50'
              : 'relative w-64'
          } bg-card border-r border-border`}
        >
          {/* Sidebar content */}
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-bold">CloudBuilder</h1>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

---

## 🎨 Template 5: Custom Styling with Tailwind

#### `tailwind.config.ts` (Enhanced)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-foreground': '#FFFFFF',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
      spacing: {
        diagram: '1px solid #E5E7EB',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## ✅ Deployment Checklist

- [ ] All pages created and tested
- [ ] Navigation working correctly
- [ ] Modal/Dialog components functioning
- [ ] State management implemented (if using Context)
- [ ] Responsive design tested on mobile
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Environment variables configured
- [ ] Build successful: `npm run build`
- [ ] Production preview: `npm run preview`

---

## 🚀 Run & Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Check types
npx tsc --noEmit

# Lint
npm run lint
```

---

## 📞 Support

For issues or questions:
1. Check `INTEGRATION_GUIDE.md` for detailed explanations
2. Review `PROJECT_ARCHITECTURE_GUIDE.md` for architecture details
3. Check React Router documentation: https://reactrouter.com
4. Check shadcn/ui documentation: https://ui.shadcn.com

