# Antigravity Engine v4.2 PRO

An AI-powered code editor and game development environment with advanced features including multi-model AI integration, 3D game development tools, and real-time collaboration capabilities.

## 🚀 Features

### Core Components
- **API Key Manager**: Hot-swap AI API keys when rate limits hit
- **Behavior Tree Editor**: Visual AI logic editor with real-time debugging
- **Antigravity Director**: Advanced chat interface with multi-turn AI orchestration
- **Code Editor**: AI-powered code completion with real-time auditing and refactoring
- **Game Dashboard**: 3D viewport with VR/AR support for game development
- **The Forge**: Multi-model AI interface for text, code, images, audio, and video generation
- **Pipeline Builder**: Visual workflow editor (n8n-style) for creating AI pipelines
- **Extension Registry**: Manage and install extensions

### Creative Suite 🎨
- **Image Studio**: AI background removal, upscaling, & generation (SDXL/Flux)
- **Audio Workshop**: Speech-to-Text & Text-to-Speech synthesis (Whisper/MeloTTS)
- **Video Studio**: Cinematic text-to-video generation (Stable Video Diffusion)
- **Model Studio**: Code-to-3D asset generation
- **Code Library**: Reusable snippet management with injection API

### AI Integration
- **Multi-Provider Support**: Gemini, Cloudflare AI, Local Ollama models
- **Smart Routing**: Automatic provider selection based on availability and task type
- **Rate Limiting**: Built-in rate limiting and API key management
- **Reflective Agent**: Self-correcting AI that verifies code changes and fixes diagnostics automatically
- **Live Director**: Real-time voice and video AI interactions

### 3D Game Development
- **WebGL/Three.js**: High-performance 3D rendering
- **VR/AR Support**: WebXR integration for immersive experiences
- **Real-time Physics**: Configurable physics simulation
- **Asset Pipeline**: Import and manage 3D models, textures, and materials
- **Terrain Generation**: Procedural world generation with sculpting tools

### Development Tools
- **Real-time Collaboration**: WebSocket-based live editing
- **Version Control**: Built-in project versioning and build system
- **Diagnostics**: Real-time system monitoring and performance metrics
- **Code Intelligence**: AI-powered code completion, auditing, and refactoring

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Three.js** for 3D rendering
- **@react-three/fiber** for React Three.js integration
- **Tailwind CSS** for styling
- **WebXR** for VR/AR support

### AI Services
- **Google Gemini** for text and image generation
- **Cloudflare Workers AI** for model hosting
- **Local Ollama** for offline AI capabilities
- **Live Director** for real-time AI interactions

### Build Tools
- **Create React App** with TypeScript template
- **Vite** for fast development and building
- **ESLint** and **Prettier** for code quality

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd antigravity-engine

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_CLOUDFLARE_API_KEY=your_cloudflare_api_key_here
REACT_APP_ENVIRONMENT=development
```

### API Keys
Use the built-in API Key Manager to configure:
- Google Gemini API keys
- Cloudflare Workers AI credentials
- Custom AI provider endpoints

## 🎮 Usage

### Getting Started
1. **Launch the Application**: Start the development server and open in browser
2. **Configure AI Keys**: Use the API Key Manager to set up your AI providers
3. **Create a Project**: Start with the code editor or game dashboard
4. **Explore Features**: Try different tabs - Editor, Director, Matrix, Forge

### Code Development
1. **Editor Tab**: Write code with AI-assisted completions
2. **Director Tab**: Chat with AI to generate code, assets, or get help
3. **Real-time Feedback**: See diagnostics and suggestions as you type

### Game Development
1. **Matrix Tab**: Open the 3D game development environment
2. **Import Assets**: Load 3D models, textures, and materials
3. **Scene Building**: Add objects, configure physics, and set up lighting
4. **Testing**: Run and test your game in real-time

### AI Workflows
1. **Forge Tab**: Access multi-model AI capabilities
2. **Pipeline Tab**: Create visual AI workflows
3. **Behavior Tab**: Design AI behaviors with visual trees

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ApiKeyManager.tsx
│   ├── BehaviorTreeEditor.tsx
│   ├── Chat.tsx
│   ├── Editor.tsx
│   ├── Forge.tsx
│   ├── GameDashboard.tsx
│   └── PipelineBuilder.tsx
├── services/           # AI and utility services
│   ├── modelRouter.ts
│   ├── geminiService.ts
│   └── cloudflareService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Three.js Community** for the excellent 3D library
- **React Team** for the amazing React framework
- **Google AI** for Gemini API
- **Cloudflare** for Workers AI platform
- **Ollama** for local AI capabilities

## 🔗 Links

- [Google Gemini API](https://ai.google.dev/)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Documentation](https://react.dev/)

---

**Antigravity Engine v4.2 PRO** - Empowering developers with AI-assisted creation tools.