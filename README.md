# 🌌 Antigravity Engine

[![Status](https://img.shields.io/badge/Status-Gold_Master-cyan.svg)](https://github.com/your-repo)
[![Engine](https://img.shields.io/badge/Engine-React_18_+_Three.js-blue.svg)](https://reactjs.org)
[![AI](https://img.shields.io/badge/AI-Gemini_2.0_Flash-purple.svg)](https://deepmind.google/technologies/gemini/)

**The Antigravity Engine** is a next-generation "Operating System for Creation." It fuses a high-performance 3D spatial interface with an advanced AI agentic core, allowing developers and artists to build, dream, and deploy in a unified "Nexus" environment.

---

## 🚀 Key Features

### 🧠 The Nexus Core
- **Agentic OS**: An AI-driven operating system that understands your project context.
- **Context Awareness**: The engine tracks your active files, node graphs, and narrative to provide relevant suggestions via the **Assistant Overlay**.
- **Multi-Step Pipelines**: Chain atomic AI tasks (e.g., *Ideation -> Text -> Image -> 3D*) using the `PipelineService`.

### 🕸️ The Matrix (Spatial Graph)
- **Visual Programming**: Drag-and-drop neural nodes to architect AI logic flows.
- **Persistence**: Save and load complex graph configurations to the cloud via **InstantDB**.
- **Real-time Visualization**: See data flow through your network in a 3D interface.

### ⚒️ The Forge (Media Studio)
- **Generative Asset Creation**: unified studio for AI media generation.
    - **Image**: Text-to-Image (Imagen 3).
    - **Audio**: Text-to-Speech & SFX.
    - **Video**: Generative Video (Veo Preview).
    - **3D**: Text-to-3D asset generation.
- **Lazy Optimization**: Heavy 3D viewports automatically suspend when off-screen to save performance.

### 🌍 The World Builder
- **Procedural Generation**: Sculpt terrains and biomes with AI assistance.
- **Physics Simulation**: Real-time interaction with the environment.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- A Google Gemini API Key (for AI features)

### Quick Start

1.  **Clone & Install**
    ```bash
    git clone https://github.com/your-username/antigravity-engine.git
    cd antigravity-engine
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_INSTANT_APP_ID=your_instantdb_app_id_here
    ```

3.  **Launch the Bridge (File System Access)**
    The engine requires a local bridge to read/write files to your disk.
    ```bash
    node bridge/server.js
    ```

4.  **Ignite the Engine**
    In a separate terminal:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` to enter the Nexus.

---

## 🏗️ Architecture

The engine is built on a modular Service-Oriented Architecture (SOA):

- **`contextService`**: Aggregates state from Editor, Graph, and Narrative.
- **`pipelineService`**: Orchestrates multi-step generative workflows.
- **`graphStateService`**: Manages persistence of node graphs in InstantDB.
- **`directorMemoryService`**: Tracks session history and long-term project memory.
- **`localBridgeService`**: WebSocket bridge for safe local file system operations.

---

## ⌨️ Keybindings

| Key Combo | Action |
| :--- | :--- |
| `Ctrl + Space` | Toggle AI Assistant / Omni-bar |
| `Ctrl + S` | Save Active File & Graph |
| `Ctrl + \`` | Toggle Integrated Terminal |
| `Alt + 1-4` | Switch Views (Director, Editor, Matrix, Forge) |

---

## 🤝 Contribution

We welcome Architects. Please fork the repository and submit PRs for:
- New `PipelineStep` types.
- Optimized 3D shaders.
- UI Themes.

---

*Built with ❤️ by The Antigravity Team.*