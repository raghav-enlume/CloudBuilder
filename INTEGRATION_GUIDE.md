# CloudBuilder Integration Guide - Add as Page to Dia Frontend Application

## 📦 Overview

This guide shows how to integrate CloudBuilder as a complete page/section in your existing Dia frontend application. CloudBuilder is already structured as a React component, so integration is straightforward.

---

## 🏗️ Current Architecture

Your project structure:
```
src/
├── App.tsx                 # Root with routing
├── pages/
│   ├── Index.tsx          # Main page (currently CloudBuilder)
│   └── NotFound.tsx       # 404 page
└── components/
    └── diagram/           # CloudBuilder components
```

---

## 🎯 Integration Scenarios

Choose based on your use case:

### **Scenario A: CloudBuilder as Main Page (Current Setup)** ✓
- CloudBuilder is the only page
- Best for: Diagram-focused application
- Status: **Already implemented**

### **Scenario B: CloudBuilder as One Tab/Section** 
- CloudBuilder alongside other features
- Best for: Multi-feature SaaS platform
- Implementation: Add routing + navigation

### **Scenario C: CloudBuilder as Modal/Overlay**
- CloudBuilder opens in a modal/sidebar
- Best for: Existing complex dashboard
- Implementation: Modal wrapper + context

### **Scenario D: CloudBuilder as Embedded Component**
- CloudBuilder embedded within another page
- Best for: Dashboard with multiple widgets
- Implementation: Component wrapper

---

## 🔄 Scenario B: Add CloudBuilder as Page with Navigation

### Step 1: Create Navigation Layout Component

```tsx
// src/components/layout/MainLayout.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { name: 'Diagram Builder', href: '/diagram' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Projects', href: '/projects' },
  { name: 'Settings', href: '/settings' },
];

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-4 border-b">
          <h1 className={cn('font-bold', sidebarOpen ? 'text-xl' : 'text-sm')}>
            {sidebarOpen ? 'CloudBuilder' : 'CB'}
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span>{item.icon || '•'}</span>
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            {navItems.find(item => item.href === location.pathname)?.name}
          </h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### Step 2: Create CloudBuilder Page

```tsx
// src/pages/DiagramPage.tsx
import { DiagramBuilder } from '@/components/diagram/DiagramBuilder';
import { MainLayout } from '@/components/layout/MainLayout';

const DiagramPage = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <DiagramBuilder />
      </div>
    </MainLayout>
  );
};

export default DiagramPage;
```

### Step 3: Create Other Pages (Examples)

```tsx
// src/pages/DashboardPage.tsx
import { MainLayout } from '@/components/layout/MainLayout';

const DashboardPage = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <h3 className="text-lg font-semibold mb-4">Dashboard</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Total Diagrams</p>
            <p className="text-3xl font-bold">24</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Resources</p>
            <p className="text-3xl font-bold">458</p>
          </div>
          {/* More cards... */}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
```

### Step 4: Update App.tsx with Routes

```tsx
// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DiagramPage from "./pages/DiagramPage";
import DashboardPage from "./pages/DashboardPage";
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
          <Route path="/diagram" element={<DiagramPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Default route - redirect to diagram */}
          <Route path="/" element={<DiagramPage />} />
          
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

## 📱 Scenario C: CloudBuilder as Modal/Overlay

### Step 1: Create Modal Component

```tsx
// src/components/diagram/DiagramModal.tsx
import { useRef, useEffect } from 'react';
import { DiagramBuilder } from './DiagramBuilder';
import { X } from 'lucide-react';

interface DiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagramModal = ({ isOpen, onClose }: DiagramModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">AWS Diagram Builder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto">
          <DiagramBuilder />
        </div>
      </div>
    </div>
  );
};
```

### Step 2: Use Modal in Your Dashboard

```tsx
// src/pages/DashboardPage.tsx
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DiagramModal } from '@/components/diagram/DiagramModal';

const DashboardPage = () => {
  const [diagramModalOpen, setDiagramModalOpen] = useState(false);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">My Projects</h3>
          <button
            onClick={() => setDiagramModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Diagram
          </button>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* ... project cards ... */}
        </div>

        {/* Diagram Modal */}
        <DiagramModal
          isOpen={diagramModalOpen}
          onClose={() => setDiagramModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
```

---

## 🎨 Scenario D: CloudBuilder as Embedded Widget

### Step 1: Create Embedded Component Wrapper

```tsx
// src/components/diagram/DiagramWidget.tsx
import { useState } from 'react';
import { DiagramBuilder } from './DiagramBuilder';
import { ChevronDown } from 'lucide-react';

interface DiagramWidgetProps {
  title?: string;
  collapsible?: boolean;
  height?: string;
}

export const DiagramWidget = ({
  title = 'Architecture Diagram',
  collapsible = true,
  height = 'h-96',
}: DiagramWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {collapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronDown
              size={20}
              className={`transform transition-transform ${
                isExpanded ? 'rotate-0' : 'rotate-180'
              }`}
            />
          </button>
        )}
      </div>

      {/* Widget Content */}
      {isExpanded && (
        <div className={`${height} overflow-hidden`}>
          <DiagramBuilder />
        </div>
      )}
    </div>
  );
};
```

### Step 2: Use Widget in Dashboard

```tsx
// src/pages/DashboardPage.tsx
import { MainLayout } from '@/components/layout/MainLayout';
import { DiagramWidget } from '@/components/diagram/DiagramWidget';

const DashboardPage = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Metrics */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">Total Resources</p>
              <p className="text-3xl font-bold">458</p>
            </div>
            {/* More cards... */}
          </div>

          {/* Right Column - Diagram */}
          <div>
            <DiagramWidget
              title="Current Architecture"
              height="h-full"
              collapsible={true}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
```

---

## 🔗 Context-Based State Management

For complex integrations, use Context API to share diagram state:

```tsx
// src/context/DiagramContext.tsx
import { createContext, useState, ReactNode } from 'react';
import { Node, Edge } from 'reactflow';

interface DiagramContextType {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export const DiagramContext = createContext<DiagramContextType | undefined>(
  undefined
);

export const DiagramProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <DiagramContext.Provider
      value={{
        nodes,
        edges,
        setNodes,
        setEdges,
        selectedFile,
        setSelectedFile,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
};

// Hook to use context
export const useDiagram = () => {
  const context = window.__diagramContext as DiagramContextType;
  if (!context) {
    throw new Error('useDiagram must be used within DiagramProvider');
  }
  return context;
};
```

### Update App.tsx to use Provider

```tsx
// src/App.tsx
import { DiagramProvider } from './context/DiagramContext';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DiagramProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Routes... */}
        </BrowserRouter>
      </DiagramProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

---

## 📂 File Structure After Integration

```
src/
├── App.tsx                          # Updated routing
├── context/
│   └── DiagramContext.tsx           # Diagram state management
├── pages/
│   ├── Index.tsx                    # Redirects to /diagram
│   ├── DiagramPage.tsx              # ✨ NEW: CloudBuilder page
│   ├── DashboardPage.tsx            # ✨ NEW: Dashboard with widgets
│   ├── ProjectsPage.tsx             # ✨ NEW: Projects list
│   └── NotFound.tsx
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx           # ✨ NEW: Navigation layout
│   ├── diagram/
│   │   ├── DiagramBuilder.tsx       # (existing)
│   │   ├── DiagramModal.tsx         # ✨ NEW: Modal wrapper
│   │   ├── DiagramWidget.tsx        # ✨ NEW: Widget wrapper
│   │   ├── Toolbar.tsx              # (existing)
│   │   ├── DiagramCanvas.tsx        # (existing)
│   │   └── ... (other diagram components)
│   └── ui/                          # (existing)
└── lib/
    └── ... (existing parsers, utils)
```

---

## 🚀 Quick Start: Recommended Integration Path

### For Beginners
1. Start with **Scenario B** (add as page with navigation)
2. Create `MainLayout.tsx` component
3. Create `DiagramPage.tsx` wrapper
4. Update routing in `App.tsx`

### For Intermediate Users
1. Use **Scenario B** as base
2. Add **Scenario C** (modal) for advanced features
3. Create `DiagramModal.tsx`
4. Use on dashboard for "create new diagram"

### For Advanced Users
1. Combine all scenarios
2. Add `DiagramContext.tsx` for state management
3. Create `DiagramWidget.tsx` for embedding
4. Build full multi-page application

---

## 📋 Implementation Checklist

### Phase 1: Basic Integration
- [ ] Create `MainLayout.tsx` component
- [ ] Create `DiagramPage.tsx`
- [ ] Create `DashboardPage.tsx`
- [ ] Update `App.tsx` routing
- [ ] Test navigation between pages

### Phase 2: Enhanced Features
- [ ] Create `DiagramModal.tsx`
- [ ] Create `DiagramWidget.tsx`
- [ ] Add modal to dashboard
- [ ] Test modal open/close
- [ ] Add keyboard shortcuts (ESC to close)

### Phase 3: State Management
- [ ] Create `DiagramContext.tsx`
- [ ] Add `DiagramProvider` to `App.tsx`
- [ ] Pass state between pages
- [ ] Test state persistence

### Phase 4: Polish & Optimization
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Responsive design
- [ ] Mobile optimization
- [ ] Performance optimization

---

## 🎯 Environment Setup Commands

```bash
# Install dependencies (if needed)
npm install react-router-dom@latest lucide-react

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📖 Next Steps

1. **Choose your integration scenario** (B, C, or D)
2. **Copy relevant code snippets** from this guide
3. **Create new files** in your project structure
4. **Update routing** in `App.tsx`
5. **Test navigation** and interaction
6. **Deploy** to production

---

## 🤔 FAQ

**Q: Can I use CloudBuilder on multiple pages?**
A: Yes! Create separate pages and import `DiagramBuilder` in each.

**Q: How do I persist diagram state across pages?**
A: Use the `DiagramContext.tsx` example with React Context API or Zustand store.

**Q: Can I embed multiple diagrams on one page?**
A: Yes, but each needs unique state management to avoid conflicts.

**Q: What about authentication and permissions?**
A: Add route guards in `App.tsx` before rendering pages.

**Q: How do I handle large diagram data?**
A: Use lazy loading and virtualization in `layoutEngine.ts`.

