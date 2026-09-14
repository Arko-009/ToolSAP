# ToolSAP

**Learn SAP. Build Faster. Solve Problems.**

ToolSAP is a modern developer-first platform for SAP developers. Learn SAP technologies through structured, practical lessons, and use free browser-based developer tools built for SAP development workflows.

## Tech Stack

- **Frontend:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router v7
- **Backend:** Express.js · TypeScript · Mongoose · MongoDB
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/toolsap.git
cd toolsap

# Install all dependencies (client + server)
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB URI
```

### Development

```bash
# Start both client and server
npm run dev

# Start only the frontend
npm run dev:client

# Start only the backend
npm run dev:server
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.

### Build

```bash
# Build the frontend
npm run build
```

## Project Structure

```
ToolSAP/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Express backend (TypeScript + Mongoose)
├── package.json     # Root workspace configuration
└── .env.example     # Environment variable template
```

## License

Proprietary. All rights reserved.
