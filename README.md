# Data Science Copilot

A CedarOS + Mastra-powered multi-agent system for automated data science workflows. Upload datasets and receive intelligent cleaning, analysis, visualization, and modeling through specialized AI agents.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd datahex
npm run install:all
```

2. **Start development servers:**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

3. **Setup Python sandbox:**
```bash
cd sandbox
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

## 🏗️ Architecture

### Frontend (React + CedarOS)
- **Location**: `frontend/`
- **Tech**: React 18, Vite, TypeScript, CedarOS
- **Features**: Chat panel, agent browser, canvas workspace, live stats

### Backend (Node.js + Mastra)
- **Location**: `backend/`
- **Tech**: Node.js, TypeScript, Express, Mastra
- **Features**: API routes, agent orchestration, streaming responses

### Sandbox (Python)
- **Location**: `sandbox/`
- **Tech**: Python, pandas, scikit-learn, plotly
- **Features**: Data science operations, model training, visualization

## 🤖 AI Agents

The system includes specialized agents for different data science tasks:

- **Cleaner**: Data cleaning and preprocessing
- **AnalystEngineer**: Feature engineering and transformations
- **Visualizer**: Chart and plot generation
- **CorrelationExpert**: Statistical analysis and relationships
- **Modeler**: Machine learning model training
- **Explainer**: Result interpretation and insights

## 📁 Project Structure

```
datahex/
├── frontend/          # React + CedarOS app
├── backend/           # Node.js + Mastra backend
├── sandbox/           # Python data science sandbox
├── infra/             # Docker and deployment configs
├── docs/              # API and design documentation
├── project.xml        # Complete project specification
├── frontend.xml       # UI/UX design specification
└── package.json       # Monorepo workspace configuration
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build only frontend
npm run build:backend    # Build only backend

# Utilities
npm run install:all      # Install all dependencies
npm run clean            # Clean all node_modules
```

### API Endpoints

- `GET /health` - Health check
- `POST /chat` - Chat with AI agents
- `POST /chat/stream` - Streaming chat responses

See `docs/api.md` for complete API documentation.

## 📚 Documentation

- [API Documentation](docs/api.md) - Complete API reference
- [Architecture](docs/architecture.md) - System architecture overview
- [Commit Plan](docs/commit_plan.md) - Development roadmap
- [Project Specification](project.xml) - Detailed project requirements
- [Frontend Design](frontend.xml) - UI/UX specifications

## 🎯 Vision

Transform hours of Jupyter notebook work into minutes of guided AI collaboration. The system emphasizes:

- **Explainability**: Users see what each agent did and why
- **Interactivity**: Real-time streaming and proposal system
- **Productivity**: Specialized agents handle complex tasks
- **Transparency**: All operations visible through CedarOS state

## 🚧 Current Status

**Phase 1 Complete** ✅
- Monorepo structure established
- Frontend with CedarOS integration
- Backend with Mastra stubs
- Python sandbox initialized
- Documentation framework

**Next Phase**: Real agent implementation and data upload functionality

## 🤝 Contributing

1. Follow the commit plan in `docs/commit_plan.md`
2. Use conventional commit messages
3. Ensure all components have proper TypeScript types
4. Test both frontend and backend integration

## 📄 License

ISC License - see individual package.json files for details.
