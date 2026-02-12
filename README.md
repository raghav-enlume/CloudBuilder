# CloudBuilder - AWS Architecture Diagram Tool

**CloudBuilder** is a streamlined AWS infrastructure visualization tool that converts flat array JSON data into clean, professional React Flow diagrams with automatic ELK-based layout.

## 🚀 Features

- **Automatic Layout**: ELK.js-powered hierarchical layout for clean AWS architecture diagrams
- **Interactive Diagrams**: Drag-and-drop nodes, selection, and property panels
- **AWS Resource Support**: VPC, Subnet, EC2, RDS, ELB, NAT Gateway, and more
- **Data Import**: Import AWS resources from flat array JSON format
- **Modern UI**: Built with React, TypeScript, and shadcn/ui components
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Radix UI, Tailwind CSS
- **Diagram Engine**: React Flow, ELK.js
- **State Management**: Zustand
- **Icons**: Lucide React, AWS React Icons
- **Build Tool**: Vite

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Checking Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check git version
git --version
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CloudBuilder
```

### 2. Install Dependencies

```bash
npm install
```

This will install all the required dependencies including:
- React and React DOM
- TypeScript and related tools
- Vite for development and building
- UI libraries (Radix UI, shadcn/ui)
- Diagram libraries (React Flow, ELK.js)
- State management (Zustand)

### 3. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:8080/` (or the next available port).

### 4. Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 📁 Project Structure

```
CloudBuilder/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── diagram/          # Diagram-related components
│   │   │   ├── DiagramBuilder.tsx
│   │   │   ├── DiagramCanvas.tsx
│   │   │   ├── ResourceSidebar.tsx
│   │   │   └── ...
│   │   └── ui/               # Reusable UI components
│   ├── data/                 # Static data and configurations
│   │   ├── resources.ts      # AWS resource definitions
│   │   ├── data.json         # Sample AWS data
│   │   └── templates.ts      # Diagram templates
│   ├── lib/                  # Utility functions and business logic
│   │   ├── buildArchitectureGraph.ts
│   │   ├── flatArrayConverter.ts
│   │   ├── graphLayout.ts
│   │   └── ...
│   ├── store/                # State management
│   │   └── diagramStore.ts
│   ├── types/                # TypeScript type definitions
│   └── pages/                # Page components
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Usage

### Importing AWS Architecture Data

1. **Prepare your data**: Ensure your AWS resources are in the flat array JSON format
2. **Upload the file**: Use the toolbar to upload your JSON file
3. **View the diagram**: The application will automatically generate a hierarchical diagram
4. **Interact with nodes**: Click on nodes to view properties and select resources

### Supported AWS Resources

- VPC (Virtual Private Cloud)
- Subnet (Public/Private)
- EC2 Instances
- RDS Databases
- ELB/ALB Load Balancers
- NAT Gateway
- Target Groups
- S3 Buckets
- VPC Endpoints

### Data Format Example

```json
[
  {
    "region": "us-east-1",
    "total_resources": 14,
    "resources": [
      {
        "region": "us-east-1",
        "cloud_resource_id": "vpc-12345",
        "resource_name": "Production VPC",
        "resource_type": "VPC",
        "resource_property": {
          "VpcId": "vpc-12345",
          "CidrBlock": "10.0.0.0/16",
          "State": "available"
        }
      }
    ]
  }
]
```

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Code Quality

The project uses ESLint for code linting. Run the linter with:

```bash
npm run lint
```

### TypeScript

The project is fully typed with TypeScript. Type definitions are located in the `src/types/` directory.

## 🧪 Testing

Currently, the project doesn't have automated tests configured. Manual testing can be done by:

1. Importing sample data from `src/data/data.json`
2. Verifying diagram layout and interactions
3. Testing different AWS resource types
4. Checking responsive behavior

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploy to Static Hosting

The built application can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions for deployment
- **AWS S3 + CloudFront**: For scalable hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Port already in use**: If port 8082 is busy, Vite will automatically use the next available port.

**Build failures**: Ensure all dependencies are installed with `npm install`.

**TypeScript errors**: Run `npx tsc --noEmit` to check for type errors.

**ELK layout issues**: Check the `graphLayout.ts` configuration for layout parameters.

### Getting Help

- Check the existing documentation in the `docs/` folder
- Review the code comments for implementation details
- Open an issue on GitHub for bugs or feature requests

## 📚 Additional Resources

- [React Flow Documentation](https://reactflow.dev/)
- [ELK.js Documentation](https://eclipse.dev/elk/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)

---

**Happy diagramming! 🎨**
