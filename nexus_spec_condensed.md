# ANTIGRAVITY NEXUS - CONDENSED SPEC
[TRUTH: Every input is validated, classified, routed, sandboxed, processed, persisted, rendered, logged.]

## TOPOLOGY
UI -> VALIDATION -> TASK CLASSIFIER (CODE/MEDIA/3D/GAME/VISION) -> NEXUS ROUTER -> EXECUTION (vibeRun/Bridge/Remote) -> PROCESSING -> PERSISTENCE -> RENDERING -> LOGGING.

## HARD RULES
1. Strict Routing: All tasks pass through routeToModel.ts.
2. Zero-Direct-AI: UI must never call AI providers; use routeNexus() instead.
3. Sandboxed: Browser code execution isolated in vibeRun.ts (vm2 pattern).

## CORE PIPELINES
- CODE: vibeRun sandbox -> processCode (quality/detect) -> CodeLibrary.
- MEDIA: Remote AI -> processMedia (optimize/meta) -> MediaLibrary.
- 3D: rsmvService -> process3D (vertex/colorify) -> ModelStudio.
- GAME: Input -> taskClassifier -> Godot Player.gd/WorldRoot update.

## BACKEND SERVICES
- routeToModel: Decider for local vs remote.
- taskClassifier: Intent detector.
- vibeRun: Logic sandbox.
- process[X]: Output structurizers.
- saveOutput: Transactional store (InstantDB/KV).
- loggingService: Central metrics.

## RECOVERY
Any Failure -> Error Classification -> Recoverable (Retry) or Fatal (UI Notify + Log).
BUILD: dist/ (Worker + Static Site + Game Assets).
