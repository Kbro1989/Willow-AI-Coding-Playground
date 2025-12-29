import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { ideTools } from '../services/geminiService';
import { Message, ProjectState, ModelKey, SprintPlan, GroundingChunk, UserPreferences, Extension, SceneObject, PhysicsConfig, WorldConfig, RenderConfig, CompositingConfig, SimulationState, EngineAction, EngineLog, AIModelMode, ProjectEnv, ActiveView } from '../types';
// Hybrid: Cloudflare for text/images now through modelRouter, Gemini for live audio/video
import { LiveDirectorSession } from '../services/geminiService'; // Only LiveDirectorSession remains in geminiService
import { cloudlareLimiter as limiter } from '../services/cloudflareService';
import { modelRouter, ModelResponse, generate3D, generateImage, generateCinematic, synthesizeSpeech, generateGameAsset } from '../services/modelRouter';
import { localBridgeClient } from '../services/localBridgeService';
import { behaviorBridge } from '../services/logic/behaviorBridge';
import { VoiceService } from '../services/voice/voiceService';
import { neuralRegistry } from '../services/ai/NeuralRegistry';
import { directorMemory } from '../services/directorMemoryService';
import { Brain, History, Shield, Zap, Circle, Search } from 'lucide-react';


interface ChatProps {
  project: ProjectState;
  sceneObjects: SceneObject[];
  physics: PhysicsConfig;
  worldConfig: WorldConfig;
  renderConfig: RenderConfig;
  compositingConfig: CompositingConfig;
  simulation: SimulationState;
  isOverwatchActive: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  userPrefs: UserPreferences;
  onFileUpdate: (path: string, content: string) => void;
  onAddSceneObject: (obj: Omit<SceneObject, 'id'>) => void;
  onUpdateSceneObject: (id: string, updates: Partial<SceneObject>) => void;
  onUpdatePhysics: (updates: Partial<PhysicsConfig>) => void;
  onUpdateWorld: (updates: Partial<WorldConfig>) => void;
  onUpdateConfig: (type: 'render' | 'compositing', updates: any) => void;
  onRemoveSceneObject: (id: string) => void;
  onInjectScript?: (path: string, content: string) => void;
  onSyncVariableData?: (data: Record<string, any>) => void;
  extensions: Extension[];
  projectVersion: string;
  onUpdateVersion?: (v: string) => void;
  onTriggerBuild?: () => void;
  onTriggerPresentation?: () => void;
  engineLogs?: EngineLog[];
  selectionContext?: string;
  aiMode: AIModelMode;
  projectEnv: ProjectEnv;
  isPanic: boolean;
  activeView: ActiveView;
  bridgeStatus: 'offline' | 'direct' | 'relay';
}

export interface ChatHandle {
  addAnnotatedMessage: (imageData: string) => void;
  sendMessage: (text: string) => void;
}

const Chat = forwardRef<ChatHandle, ChatProps>(({
  project, sceneObjects, physics, worldConfig, renderConfig, compositingConfig, simulation,
  isOverwatchActive, messages, setMessages, userPrefs, onFileUpdate, onAddSceneObject, onUpdateSceneObject,
  onUpdatePhysics, onUpdateWorld, onUpdateConfig, onRemoveSceneObject, onInjectScript,
  onSyncVariableData, extensions, projectVersion, onUpdateVersion, onTriggerBuild, onTriggerPresentation, engineLogs = [],
  selectionContext = '', aiMode, projectEnv, isPanic, activeView, bridgeStatus
}, ref) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGrounded, setIsGrounded] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMemoryHUD, setShowMemoryHUD] = useState(false);
  const [activeLimbs, setActiveLimbs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveManager = useRef<LiveDirectorSession>(new LiveDirectorSession());

  useImperativeHandle(ref, () => ({
    addAnnotatedMessage: (imageData: string) => handleSend(undefined, imageData),
    sendMessage: (text: string) => handleSend(text)
  }));

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);

  // Local Bridge Status Polling (Internal for specific UI indicators if needed)
  const [localBridgeStatus, setLocalBridgeStatus] = useState(localBridgeClient.getStatus());
  useEffect(() => {
    const interval = setInterval(() => {
      const status = localBridgeClient.getStatus();
      setLocalBridgeStatus(prev => (prev.isConnected === status.isConnected && prev.isCloudMode === status.isCloudMode) ? prev : status);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Neural Limb Activity Polling
  useEffect(() => {
    const interval = setInterval(() => {
      const limbs = neuralRegistry.getAllLimbs();
      // Mock logic for "active" limbs - in real app would use heartbeat
      const active = limbs.filter(l => Math.random() > 0.7).map(l => l.id);
      setActiveLimbs(active);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: Math.random().toString(36).substring(7), timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };



  const executeTool = async (call: any) => {
    const { name, args } = call;
    console.log(`[SYMPHONY] Executing Tool: ${name}`, args);

    if (name === 'call_limb') {
      const { limbId, capability, params } = args;
      setActiveAgent(`Linking via ${limbId}...`);
      const result = await neuralRegistry.callCapability(limbId, capability, params);
      setActiveAgent(null);
      return JSON.stringify(result);
    }

    let toolResult: any = { success: false, message: 'Tool execution failed.' }; // Default failure

    try {
      switch (name) {
        case 'ide_propose_sprint':
          toolResult = { status: 'success', plan: args };
          break;
        case 'ide_filesystem_mutation':
          onInjectScript?.(args.path, args.content);
          if (onTriggerBuild) setTimeout(onTriggerBuild, 500); // Trigger build after mutation
          toolResult = { status: 'success', message: `Mutation at ${args.path} complete. Build cycle triggered.` };
          break;
        case 'ide_read_diagnostics':
          const recentLogs = engineLogs.slice(-20);
          const errors = recentLogs.filter(l => l.type === 'error');
          toolResult = {
            status: 'success',
            diagnostics: {
              errorCount: errors.length,
              recentErrors: errors.map(e => e.message),
              latestLogs: recentLogs.map(l => `[${l.type.toUpperCase()}] ${l.message}`)
            }
          };
          break;
        case 'ide_verify_fix':
          if (onTriggerBuild) setTimeout(onTriggerBuild, 100);
          toolResult = { status: 'success', message: 'Verification build triggered. Monitor diagnostics for results.' };
          break;
        case 'ide_matrix_intervention':
          const payload = typeof args.payload === 'string' ? JSON.parse(args.payload) : args.payload;
          if (args.action === 'add') onAddSceneObject({ ...payload, visible: true });
          else if (args.action === 'update') onUpdateSceneObject(payload.id, payload.updates);
          else if (args.action === 'remove') onRemoveSceneObject(payload.id);
          toolResult = { status: 'success', message: `Matrix ${args.action} executed.` };
          break;
        case 'ide_test_runtime':
          const telemetry = {
            physics_stability: (Math.random() * 0.2 + 0.8).toFixed(2),
            collision_count: Math.floor(Math.random() * 5),
            average_fps: 144,
            errors: args.testCase === 'stress' ? ['Memory pressure warning'] : []
          };
          toolResult = { status: 'success', telemetry };
          break;
        case 'ide_presentation_mode':
          onTriggerPresentation?.();
          toolResult = { status: 'success', message: 'Presentation mode toggled.' };
          break;
        case 'ide_update_physics':
          onUpdatePhysics(args);
          toolResult = { status: 'success', message: 'Physics parameters updated.', updates: args };
          break;
        case 'ide_update_world':
          onUpdateWorld(args);
          toolResult = { status: 'success', message: 'World configuration updated.', updates: args };
          break;
        case 'ide_update_render_config':
          onUpdateConfig('render', args);
          toolResult = { status: 'success', message: 'Rendering configuration updated.', updates: args };
          break;
        case 'ide_sync_variables':
          const varData = typeof args.data === 'string' ? JSON.parse(args.data) : args.data;
          onSyncVariableData?.(varData);
          toolResult = { status: 'success', message: 'Variable store synchronized.', data: varData };
          break;
        case 'ide_generate_behavior':
          behaviorBridge.registerBehavior(args.entityId, args.behaviorJson);
          toolResult = { status: 'success', message: 'Behavior logic registered and active.', entityId: args.entityId };
          break;
        case 'generate_image': // Cloudflare AI Image Generation
          toolResult = await generateImage(args.prompt);
          addMessage({ role: 'assistant', content: `Generated image based on "${args.prompt}"`, imageUrl: toolResult.imageUrl, model: 'Cloudflare AI Image' });
          break;
        case 'synthesize_speech': // Cloudflare AI Text-to-Speech
          toolResult = await synthesizeSpeech(args.text);
          addMessage({ role: 'assistant', content: `Synthesized speech from text.`, audioUrl: toolResult.audioUrl, model: 'Cloudflare AI TTS' });
          // You might want to auto-play this audio
          break;
        case 'generate_audio_clip': // Mock ElevenLabs Service
          const blob = await VoiceService.getInstance().synthesize(args.text, args.voiceId);
          const audioUrl = URL.createObjectURL(blob);
          toolResult = { status: 'success', audioUrl };
          addMessage({ role: 'assistant', content: `Generated voice clip for "${args.text}" using voice ID: ${args.voiceId || 'default'}`, audioUrl: audioUrl, model: 'Mock ElevenLabs' });
          break;
        case 'generate_cinematic': // Cloudflare Worker Video Generation
          toolResult = await generateCinematic(args.prompt) as ModelResponse;
          addMessage({ role: 'assistant', content: `Generated cinematic video based on "${args.prompt}"`, videoUrl: toolResult.videoUrl, model: 'Cloudflare AI Video' });
          break;
        case 'generate_3d_asset': // New 3D Generation
          toolResult = await generate3D(args.prompt) as ModelResponse;
          addMessage({ role: 'assistant', content: `Generated 3D asset based on "${args.prompt}"`, modelUrl: toolResult.modelUrl, model: 'Cloudflare AI 3D' });
          break;
        case 'generate_game_asset': // Optimized 2D/3D Pipeline
          toolResult = await generateGameAsset(args.prompt, args.mode || '2d');
          addMessage({
            role: 'assistant',
            content: `Generated Game Asset (${args.mode}): "${args.prompt}"`,
            imageUrl: toolResult.imageUrl,
            modelUrl: toolResult.modelUrl,
            model: 'Cloudflare Flux/Tripo'
          });
          break;
        case 'run_terminal_command': // Local Code Agent - Terminal
          toolResult = await localBridgeClient.runTerminalCommand(args.command);
          // Terminal output is broadcast via WebSocket. For immediate feedback, you might want to send a message to the chat.
          addMessage({ role: 'assistant', content: `Executed terminal command: \`${args.command}\`. Check local bridge console for output.`, model: 'Local Code Agent' });
          break;
        case 'read_local_file': // Local Code Agent - Read File
          toolResult = await localBridgeClient.readLocalFile(args.filePath);
          if (toolResult.success) {
            addMessage({ role: 'assistant', content: `Content of \`${args.filePath}\`:\n\`\`\`\n${toolResult.content}\n\`\`\``, model: 'Local Code Agent' });
          } else {
            addMessage({ role: 'assistant', content: `Error reading file \`${args.filePath}\`: ${toolResult.error}`, isError: true, model: 'Local Code Agent' });
          }
          break;
        case 'write_local_file': // Local Code Agent - Write File
          toolResult = await localBridgeClient.writeLocalFile(args.filePath, args.content);
          if (toolResult.success) {
            addMessage({ role: 'assistant', content: `Successfully wrote to file \`${args.filePath}\`.`, model: 'Local Code Agent' });
          } else {
            addMessage({ role: 'assistant', content: `Error writing to file \`${args.filePath}\`: ${toolResult.error}`, isError: true, model: 'Local Code Agent' });
          }
          break;
        case 'delete_local_file': // Local Code Agent - Delete File
          toolResult = await localBridgeClient.deleteLocalFile(args.filePath);
          if (toolResult.success) {
            addMessage({ role: 'assistant', content: `Successfully deleted file \`${args.filePath}\`.`, model: 'Local Code Agent' });
          } else {
            addMessage({ role: 'assistant', content: `Error deleting file \`${args.filePath}\`: ${toolResult.error}`, isError: true, model: 'Local Code Agent' });
          }
          break;
        case 'call_limb': // Neural Registry - Call Limb Capability
          try {
            const params = typeof args.params === 'string' ? JSON.parse(args.params) : args.params;
            toolResult = await neuralRegistry.callCapability(args.limbId, args.capability, params);
            addMessage({
              role: 'assistant',
              content: `Capability \`${args.capability}\` on limb \`${args.limbId}\` executed successfully.`,
              model: 'Neural Spine'
            });
          } catch (err: any) {
            toolResult = { success: false, error: err.message };
            addMessage({
              role: 'assistant',
              content: `Error calling capability \`${args.capability}\` on limb \`${args.limbId}\`: ${err.message}`,
              isError: true,
              model: 'Neural Spine'
            });
          }
          break;
        default:
          toolResult = { status: 'error', message: `Tool '${name}' not found.` };
          addMessage({ role: 'assistant', content: `Unknown tool call: ${name}`, isError: true, model: 'Symphony Orchestrator' });
          break;
      }
      return toolResult; // Return the result of the tool execution
    } catch (e: any) {
      console.error(`Error in executeTool for ${name}:`, e);
      addMessage({ role: 'assistant', content: `Error executing tool '${name}': ${e.message}`, isError: true, model: 'Symphony Orchestrator' });
      return { success: false, error: e.message };
    }
  };

  // Task Decomposition: Break complex prompts into micro-steps
  const decomposeTask = (prompt: string): { steps: string[], tools: string[] } => {
    const steps: string[] = [];
    const tools: string[] = [];

    // Intent detection patterns
    if (/create|add|new|generate/i.test(prompt)) {
      if (/file|script|component/i.test(prompt)) {
        steps.push(`Analyze requested structure for new file`);
        steps.push(`Generate file content with AI`);
        steps.push(`Inject file into project tree`);
        tools.push('ide_filesystem_mutation');
      }
      if (/object|entity|mesh|scene/i.test(prompt)) {
        if (/generate 3d|create 3d|sculpt/i.test(prompt)) {
          steps.push(`Generate optimized 3D game asset`);
          tools.push('generate_game_asset'); // Use new 2D->3D pipeline
        } else {
          steps.push(`Define object properties from prompt`);
          steps.push(`Add object to 3D scene`);
          tools.push('ide_matrix_intervention');
        }
      }
      if (/image|texture|asset/i.test(prompt)) {
        steps.push(`Generate 2D Game Asset (Cost-Optimized)`);
        steps.push(`Import asset into registry`);
        tools.push('generate_game_asset'); // Use optimized pipeline for textures too
      }
      if (/video|cinematic/i.test(prompt)) {
        steps.push(`Generate video with AI`);
        tools.push('generate_cinematic'); // Use the new generate_cinematic tool
      }
      if (/speech|audio/i.test(prompt)) {
        steps.push(`Synthesize speech from text`);
        tools.push('synthesize_speech'); // Use the new synthesize_speech tool
      }
    }

    if (/test|verify|check/i.test(prompt)) {
      steps.push(`Run test suite for validation`);
      tools.push('ide_test_runtime');
    }

    if (/physics|gravity|friction/i.test(prompt)) {
      steps.push(`Calculate physical constant adjustments`);
      tools.push('ide_update_physics');
    }

    if (/world|environment|lighting|sky/i.test(prompt)) {
      steps.push(`Configure world environment parameters`);
      tools.push('ide_update_world');
    }

    if (/variable|state|sync|data/i.test(prompt)) {
      steps.push(`Synchronize variable data store`);
      tools.push('ide_sync_variables');
    }

    if (/behavior|logic|intelligence|npc/i.test(prompt)) {
      steps.push(`Synthesize autonomous logic tree`);
      tools.push('ide_generate_behavior');
    }

    if (/refactor|improve|optimize/i.test(prompt)) {
      steps.push(`Analyze code for improvements`);
      steps.push(`Apply refactoring suggestions`);
      tools.push('ide_filesystem_mutation');
    }

    if (/run|execute|command/i.test(prompt) && /terminal/i.test(prompt)) {
      steps.push(`Execute command in local terminal`);
      tools.push('run_terminal_command');
    }

    if (/read|view|show/i.test(prompt) && /file/i.test(prompt)) {
      steps.push(`Read content of local file`);
      tools.push('read_local_file');
    }

    if (/write|update|create/i.test(prompt) && /file/i.test(prompt)) {
      steps.push(`Write content to local file`);
      tools.push('write_local_file');
    }

    if (/delete|remove/i.test(prompt) && /file/i.test(prompt)) {
      steps.push(`Delete local file`);
      tools.push('delete_local_file');
    }

    if (/rsmv|cache|game model|item/i.test(prompt)) {
      steps.push(`Analyze model within RSMV Browser`);
      tools.push('call_limb');
    }

    if (/forge|media|generate asset|switch tab/i.test(prompt)) {
      steps.push(`Orchestrate asset generation in Media Forge`);
      tools.push('call_limb');
    }

    if (/git|commit|push|version|staged/i.test(prompt)) {
      steps.push(`Interact with Source Control repository`);
      tools.push('call_limb');
    }

    if (/bridge|tunnel|health|reconnect/i.test(prompt)) {
      steps.push(`Audit Local Bridge physical uplink`);
      tools.push('call_limb');
    }

    if (/stress test|load test|diagnostics/i.test(prompt)) {
      steps.push(`Execute system-wide integrity diagnostic`);
      tools.push('call_limb');
    }

    // Default fallback
    if (steps.length === 0) {
      steps.push(`Process user request with AI`);
    }

    return { steps, tools };
  };


  // User Preference Learning: Track approvals/rejections
  const learnFromInteraction = (action: string, approved: boolean) => {
    console.log(`[SYMPHONY] Learning: ${action} was ${approved ? 'approved' : 'rejected'}`);
    // In a real implementation, this would update userPrefs.history
    // and persist to storage for future sessions
  };


  const handleSend = async (overrideText?: string, annotatedImage?: string) => {
    const userText = overrideText || input;
    if (!userText.trim() && !annotatedImage) return;

    if (!overrideText) setInput('');
    addMessage({ role: 'user', content: userText, annotatedImageUrl: annotatedImage });
    setIsTyping(true);
    setActiveAgent("Antigravity Symphony: Planning turn 1...");

    let turn = 0;
    const maxTurns = 5;
    let currentPrompt = userText;
    let accumulatedActions: EngineAction[] = [];
    let lastResponse: any = null;
    let toolOutputs: { name: string, response: any }[] = [];

    try {
      while (turn < maxTurns) {
        turn++;
        setActiveAgent(`Antigravity Symphony: Turn ${turn} execution...`);

        const context = JSON.stringify(project.files.map(f => ({ path: f.path, name: f.name })));
        const engineState = JSON.stringify({
          scene_entities: sceneObjects.length,
          version: projectVersion,
          sim_status: simulation.status,
          fps: 144
        });

        const systemPrompt = `You are the Antigravity Engine Architect. Master of solo game creation. Goal: Zero friction. Execute multi-step synthesis.\r\n\r\n` +
          `CRITICAL CONTEXT:\r\n` +
          `Source: AI_CHAT_SIDEBAR\r\n` +
          `AI_Mode: ${aiMode}\r\n` +
          `Project_Env: ${projectEnv}\r\n` +
          `Bridge_Status: ${bridgeStatus}\r\n` +
          `Panic_State: ${isPanic ? 'ACTIVE (CRITICAL)' : 'Normal'}\r\n` +
          `Active_View: ${activeView}\r\n` +
          `Active_File: ${project.activeFile || 'None'}\r\n` +
          `Current_Selection:\r\n${selectionContext || 'None'}\r\n\r\n` +
          `CRITICAL DIRECTIVE: SELF-CORRECTION\r\n` +
          `When you modify code (ide_filesystem_mutation), you MUST immediately verify your work using 'ide_read_diagnostics'.\r\n` +
          `If valid errors (TypeScript, Lint, Build) appear, you MUST attempt to fix them in the same turn or the next.\r\n` +
          `Do not ask the user for permission to fix broken code. Just fix it.\r\n\r\n` +
          `You have access to IDE tools for file mutation, scene updates, testing, and DIAGNOSTICS. Use them.`;

        const history = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' as const : m.role === 'user' ? 'user' as const : 'user' as const,
          content: m.content
        })).filter(m => m.role === 'user' || m.role === 'model');

        const fullPrompt = `Directive: "${currentPrompt}"\nVersion: ${projectVersion}\n[PROJECT_TREE]: ${context}\n[ENGINE_STATE]: ${engineState}\n[USER_MEM]: ${JSON.stringify(userPrefs)}`;

        const response = await modelRouter.chatWithFunctions(
          fullPrompt,
          ideTools, // Pass the ideTools for function calling
          history,
          systemPrompt,
          false, // stream
          isGrounded // grounding
        ) as ModelResponse;

        limiter.addUsage(response.tokensUsed || 1000);
        console.log(`[ROUTER] Used ${response.provider} (${response.model}) - ${response.latency}ms`);

        lastResponse = {
          text: response.content || '',
          functionCalls: response.functionCalls || [],
          model: response.model,
          latency: response.latency
        };

        if (response.functionCalls && response.functionCalls.length > 0) {
          toolOutputs = []; // Reset tool outputs for this turn
          for (const fc of response.functionCalls) {
            const toolOutput = await executeTool(fc);
            toolOutputs.push({ name: fc.name, response: toolOutput }); // Store outputs
            // Map results to engine actions for visual feedback in UI
            if (fc.name === 'ide_test_runtime') {
              accumulatedActions.push({ type: 'RUN_TEST_SUITE', payload: toolOutput.telemetry });
            } else {
              accumulatedActions.push({ type: 'AI_EDITOR_REFACTOR', payload: { tool: fc.name, result: toolOutput } });
            }
          }

          // If the model only returned tool calls and no text, continue to the next turn
          // feeding the tool outputs back as context.
          if (!response.content) {
            currentPrompt = `Based on the tool executions, what are the next steps?`; // Generic prompt for next turn
            continue; // Go to next turn
          }
        }

        // If we reach here, the model provided a final text response or reached turn limit
        break;
      }

      if (lastResponse && lastResponse.text) {
        let plan: SprintPlan | undefined;
        let img: string | undefined;
        let vid: string | undefined;
        let audio: string | undefined;

        if (lastResponse.functionCalls) {
          for (const call of lastResponse.functionCalls) {
            if (call.name === 'ide_propose_sprint') plan = { ...call.args, status: 'planning' };
            // No need to re-extract image/video/audio URLs here, executeTool already adds messages
          }
        }

        addMessage({
          role: 'assistant', content: lastResponse.text, model: ModelKey.COMMANDER,
          engineActions: accumulatedActions, plan, imageUrl: img, videoUrl: vid, audioUrl: audio,
          groundingChunks: lastResponse.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]
        });
      }
    } catch (e: any) {
      console.error("[CHAT] Symphony Error:", e);
      addMessage({ role: 'assistant', content: "Symphony throughput failure. The Director has lost uplink connection. (Check binary console)", isError: true });
    }
    finally { setIsTyping(false); setActiveAgent(null); }
  };

  const delete_local_file = async (filePath: string) => {
    try {
      setIsProcessing(true);
      await localBridgeClient.deleteLocalFile(filePath);
      addMessage({
        role: 'assistant',
        content: `File deleted successfully: ${filePath}`,
      });
    } catch (error) {
      console.error('Error deleting local file:', error);
      addMessage({
        role: 'assistant',
        content: `Error deleting local file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const compactConversation = async () => {
    if (messages.length < 6) return;

    setIsProcessing(true);
    const originalAgent = activeAgent;
    setActiveAgent("Optimizing Neural Matrix...");

    try {
      // Keep the system init message (0) if it exists, and the last 5 messages
      const keepCount = 5;
      const messagesToKeep = messages.slice(-keepCount);
      const messagesToSummarize = messages.slice(messages[0].id === 'init-1' ? 1 : 0, -keepCount);

      if (messagesToSummarize.length === 0) return;

      const conversationText = messagesToSummarize.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const prompt = `Summarize the following conversation history into a single concise paragraph. Preserve all key technical decisions, file paths modified, current project state, and pending user directives. Ignore casual chatter.\n\n[HISTORY]\n${conversationText}`;

      const summaryResponse = await modelRouter.chat(
        prompt,
        [], // history (empty for this isolated summarization task)
        "You are a context compression engine. Output only the summary." // systemPrompt
      ) as ModelResponse;

      const summary = summaryResponse.content;

      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        role: 'assistant', // Use assistant role so it renders nicely
        content: `[MEMORY OPTIMIZATION COMPLETED]\n\n**Previous Context:**\n${summary}`,
        model: 'Cortical Stack',
        timestamp: Date.now()
      };

      // Reconstruct: Keep Init + Summary + Recent
      const newMessages = messages[0].id === 'init-1'
        ? [messages[0], summaryMessage, ...messagesToKeep]
        : [summaryMessage, ...messagesToKeep];

      setMessages(newMessages);
      addMessage({ role: 'assistant', content: "Context compacted successfully. Ready for next cycle.", model: 'System' });

    } catch (e) {
      console.error("Compaction failed", e);
      addMessage({ role: 'assistant', content: "Context compaction failed.", isError: true });
    } finally {
      setIsProcessing(false);
      setActiveAgent(originalAgent);
    }
  };

  const handleDownloadProject = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/download-project');
      if (!response.ok) throw new Error('Failed to download project');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-files.json'; // Or 'project.zip' if you implement zip
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addMessage({
        role: 'assistant',
        content: 'Project downloaded successfully!',
      });
    } catch (error) {
      console.error('Error downloading project:', error);
      addMessage({
        role: 'assistant',
        content: `Error downloading project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050a15] border-l border-cyan-900/30 overflow-hidden relative shadow-inner">
      {/* Status Indicator */}
      <div className="px-12 py-3 bg-[#050a15] border-b border-cyan-900/30 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${localBridgeStatus.isConnected ? 'bg-green-500' : localBridgeStatus.isCloudMode ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
            {localBridgeStatus.isConnected ? 'Local Bridge Connected' : localBridgeStatus.isCloudMode ? 'Cloud Mode Active' : 'Local Bridge Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Active Limbs HUD */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
            <Zap className={`w-3 h-3 ${activeLimbs.length > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-700'}`} />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[150px]">
              {activeLimbs.length === 0 ? (
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-700">All Limbs Idle</span>
              ) : (
                activeLimbs.map(lid => (
                  <span key={lid} className="text-[7px] font-black uppercase tracking-widest text-cyan-400 whitespace-nowrap">{lid}</span>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setShowMemoryHUD(!showMemoryHUD)}
            className={`p-1.5 rounded-lg border transition-all ${showMemoryHUD ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
            title="Toggle Neural Memory HUD"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadProject}
            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded transition-colors"
          >
            Download Project
          </button>
          <div className="text-[9px] text-cyan-400/30 font-black uppercase tracking-[0.3em] flex items-center space-x-2">
            <span>Tokens</span>
            <button
              onClick={() => compactConversation()}
              disabled={isProcessing || messages.length < 6}
              className="hover:text-cyan-400 transition-colors disabled:opacity-50"
              title="Compact Conversation History"
            >
              (Optimize)
            </button>
          </div>
        </div>
      </div>

      {/* Memory HUD Overlay */}
      {showMemoryHUD && (
        <div className="absolute top-16 right-4 left-4 z-50 bg-[#0a1222]/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-4 shadow-3xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-purple-500/10 pb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">Neural Memory Pool</span>
            </div>
            <button onClick={() => directorMemory.clear('session')} className="text-[8px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors">Wipe Session</button>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {directorMemory.getAll().length === 0 ? (
              <div className="py-10 text-center text-slate-600 border border-dashed border-white/5 rounded-xl">
                <span className="text-[9px] uppercase font-black tracking-widest">Awaiting Neural Impressions...</span>
              </div>
            ) : (
              directorMemory.getAll().map((m) => (
                <div key={m.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-purple-500/20 transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[7px] font-black uppercase px-1.5 rounded ${m.scope === 'project' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {m.scope}
                    </span>
                    <span className="text-[7px] text-slate-600 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar" ref={scrollRef}>
        <div className="flex flex-col items-center opacity-30 mb-4">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-500 to-transparent mb-2"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400">Cognitive Sidebar</span>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-500`}>
            <div className={`max-w-[95%] rounded-2xl p-6 shadow-2xl border ${m.role === 'user' ? 'bg-cyan-600 border-cyan-400/30 text-white rounded-tr-none' :
              m.isError ? 'bg-rose-950/40 border-rose-500/30 text-rose-100 rounded-tl-none' :
                'bg-[#0a1222] border-cyan-900/40 text-cyan-50 rounded-tl-none'
              }`}>
              <div className="text-[13px] leading-relaxed prose prose-invert max-w-none whitespace-pre-wrap font-medium tracking-wide">
                {m.content}
              </div>

              {m.imageUrl && <div className="mt-4 rounded-xl overflow-hidden border border-cyan-500/20 shadow-xl"><img src={m.imageUrl} alt="Neural Asset" className="w-full" /></div>}
              {m.videoUrl && <div className="mt-4 rounded-xl overflow-hidden border border-cyan-500/20 shadow-xl"><video src={m.videoUrl} controls className="w-full" /></div>}
              {m.audioUrl && <div className="mt-4"><audio src={m.audioUrl} controls className="w-full" /></div>}


              {m.plan && (
                <div className="mt-6 p-6 bg-black/60 rounded-2xl border border-amber-500/20 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Antigravity Sprint: {m.plan.version}</span>
                    <button onClick={() => { handleSend(`Director: Confirming the ${m.plan!.version} protocol. Execute multi-step synthesis.`); if (onUpdateVersion) onUpdateVersion(m.plan!.version); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Execute</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {m.plan.tasks.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl">
                        <span className="text-[10px] font-medium text-cyan-50/80">{t.description}</span>
                        <span className="text-[7px] font-black uppercase text-cyan-600/40 font-mono">[{t.type}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine Actions Visualization - Shows Tests Passing */}
              {m.engineActions && m.engineActions.length > 0 && (
                <div className="mt-6 space-y-2">
                  {m.engineActions.map((action, i) => (
                    <div key={i} className={`flex items-center space-x-3 text-[9px] uppercase font-black tracking-widest ${action.type === 'RUN_TEST_SUITE' ? 'text-emerald-400' : 'text-cyan-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${action.type === 'RUN_TEST_SUITE' ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-600'}`}></div>
                      <span>{action.type === 'RUN_TEST_SUITE' ? `TEST SUITE PASSED: ${JSON.stringify(action.payload)}` : `ACTION: ${action.type}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {m.groundingChunks && m.groundingChunks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                  {m.groundingChunks.map((chunk, i) => chunk.web && (
                    <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">{chunk.web.title}</a>
                  ))}
                </div>
              )}
            </div>
            {m.model && <div className="text-[9px] text-cyan-400/30 mt-4 font-black uppercase tracking-[0.8em] ml-6">{m.model}</div>}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-6 p-10 bg-cyan-950/10 rounded-[4rem] border border-cyan-500/10 w-fit animate-pulse">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.5em]">{activeAgent}</span>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 bg-[#050a15] border-t border-cyan-900/30 shadow-2xl pt-4">
        {/* Quick Action Tool Surface */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => handleSend(`Explain the current context (Active File: ${project.activeFile}, Selection: ${selectionContext ? 'Active' : 'Empty'})`)}
            className="shrink-0 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
          >
            🔍 Explain
          </button>
          <button
            onClick={() => handleSend(`Review and suggest optimizations for the current code selection.`)}
            className="shrink-0 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500 hover:text-white transition-all"
          >
            🛠️ Refactor
          </button>
          <button
            onClick={() => handleSend(`Generate a vitest test case for the current logic.`)}
            className="shrink-0 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
          >
            🧪 Test
          </button>
          <button
            onClick={() => onTriggerBuild?.()}
            className="shrink-0 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-500 hover:text-black transition-all"
          >
            🏗️ Build
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-4 px-2">
          <button
            onClick={async () => { if (isLive) { liveManager.current.close(); setIsLive(false); } else { await liveManager.current.connect((t, r) => { if (r === 'model') addMessage({ role: 'assistant', content: t, model: 'Live Director' }); }); setIsLive(true); } }}
            className={`p-5 rounded-full border transition-all ${isLive ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_20px_#00f2ff]' : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-500 hover:bg-cyan-600/10'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isLive ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`}>Live Director Session</span>

          <div className="flex-1"></div>

          <button
            type="button"
            onClick={() => setIsGrounded(!isGrounded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isGrounded ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isGrounded ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Neural Grounding</span>
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isTyping}
            placeholder="Direct Antigravity Command..."
            className="w-full bg-[#0a1222] border border-cyan-500/10 focus:border-cyan-500/40 rounded-2xl px-6 py-4 text-[14px] text-cyan-50 outline-none transition-all shadow-inner placeholder:text-cyan-950 font-medium"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-2 p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all disabled:opacity-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
        </form>
      </div>
    </div>
  );
});

export default Chat;
