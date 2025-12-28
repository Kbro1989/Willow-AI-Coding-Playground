# 🌌 Antigravity Engine

[![Status](https://img.shields.io/badge/Status-Gold_Master-cyan.svg)](https://github.com/your-repo)
[![Engine](https://img.shields.io/badge/Engine-React_18_+_Three.js-blue.svg)](https://reactjs.org)
[![AI](https://img.shields.io/badge/AI-Gemini_2.0_Flash-purple.svg)](https://deepmind.google/technologies/gemini/)

**The Antigravity Engine** is a next-generation "Operating System for Creation." It fuses a high-performance 3D spatial interface with an advanced AI agentic core, allowing developers and artists to build, dream, and deploy in a unified "Nexus" environment.

---

## 🚀 Key Features

### 🧠 The Nexus Core
- **Intent-Driven OS**: An AI architecture built on structured `AIIntent` objects. The system knows *where* an instruction came from and *what* the cognitive mode is for every turn.
- **Cognitive Sidebar**: A global right-sidebar chat aware of your entire workspace, selection context, and active files.
- **Context Awareness**: Real-time code selection tracking and active file injection into the AI system prompt.
- **Multi-Step Pipelines**: Chain atomic AI tasks (e.g., *Ideation -> Text -> Image -> 3D*) using the n8n-style visual workflow builder.

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

## 💡 How I Actually Use This (Solo Workflow)

1.  **Iterative Engineering**: Open the Editor, select a block of code, and check the **Cognitive Sidebar**. It immediately injects your selection into its "Brain Stem."
2.  **Intent Dispatching**: Press `Ctrl + K` to focus the OMNI-bar. Type a command (e.g., "Refactor this to use hooks") and watch the logic branch into a specialist pipeline.
3.  **Friction Removal**:
    - **Assist Mode**: Default state for questions and minor fixes.
    - **Refactor Mode**: When you need serious surgical changes.
    - **Lockdown Mode**: For security audits and final verification passes.
4.  **Visual Scaffolding**: Use the **Forge** to generate 3D assets or media chains, then link them directly into the Game Matrix via visual pipelines.

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

- **`universalOrchestrator`**: The executive entry point. Dispatches structured intents to specialists (Librarian, Forge Master, Oracle).
- **`contextService`**: Aggregates state from Editor, Graph, and Narrative.
- **`pipelineService`**: Orchestrates multi-step generative workflows.
- **`graphStateService`**: Manages persistence of node graphs in InstantDB.
- **`directorMemoryService`**: Tracks session history and long-term project memory.
- **`localBridgeService`**: WebSocket bridge for safe local file system operations.

---

## ⌨️ Keybindings

| Key Combo | Action |
| :--- | :--- |
| `Ctrl + Space` | Toggle OMNI-bar (Global Command Spine) |
| `Ctrl + B` | Toggle Cognitive Sidebar |
| `Ctrl + K` | Focus Global Intent Search |
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