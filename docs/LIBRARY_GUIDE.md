# Antigravity Engine - Library Guide

This project relies on a modern stack of 3D, AI, and Utility libraries. This guide explains the purpose of each key dependency to help you navigate `node_modules`.

## Core Technologies

### 🌌 3D & Graphics
- **`three`**: The core 3D library. Handles the scene graph, WebGL rendering, and math.
- **`@react-three/fiber`**: A React reconciler for Three.js. Allows you to write 3D scenes using declarative React components components like `<Canvas>`.
- **`@react-three/drei`**: A growing collection of useful helpers and abstractions for Fiber (e.g., `OrbitControls`, `Sky`, `Html` overlays).
- **`@react-three/xr`**: Provides VR/AR support for the engine.

### 🧠 Artificial Intelligence
- **`@google/generative-ai`**: The official client for Google's Gemini models. Used in `geminiProvider.ts` to power the "Director" and code generation features.

### ⚡ Database & State
- **`@instantdb/react`**: A real-time, client-side database. Used for syncing workspace state and collaboration features.
- **`react` / `react-dom`**: Version 19. Core UI library.

### 🛠 Build & Tools
- **`vite`**: The build tool and dev server. Extremely fast.
- **`typescript`**: Adds static types to JavaScript for better developer experience and error catching.
- **`tailwindcss`**: Utility-first CSS framework for UI styling (Sidebar, Chat, Terminal).
- **`ws`** (in `/bridge`): WebSocket library for the Local Bridge server.

## Directory Structure Notes
- **`node_modules/`**: Contains the actual code for these libraries. **Do not edit files here**; they will be overwritten.
- **`bridge/`**: Contains the local Node.js server for filesystem access.
