# Design Decisions and Change Log

This document records the major architectural decisions for SketchRush and explains why each choice was made in the context of a real-time multiplayer drawing game.

## 1. Why the app is split into a client and a server

The project intentionally uses a two-part architecture:

- The client is responsible for rendering the UI, collecting user input, and representing local state.
- The server is responsible for maintaining room truth, team membership, and active game state.

This separation matters because a drawing game is multiplayer and stateful. If each client only kept its own local copy, different players would have divergent state. The server must be the single source of truth so that every connected user sees the same room snapshot, same turn order, and same canvas events.

The current server-side state is kept in memory using JavaScript Maps, which is a good fit for a small prototype or local multiplayer game. It is simple, fast, and easy to reason about without database setup. This matches the project goals: a lightweight social game rather than a production-grade backend with persistence.

## 2. Why Socket.IO was used instead of polling or REST-only updates

Real-time interaction is the core of SketchRush. Drawing strokes, room updates, group changes, and game-turn transitions all need to flow live to everyone in the room.

Socket.IO is a natural fit because:

- It offers bi-directional real-time communication.
- It handles reconnects and event-based updates cleanly.
- It works well for room-based broadcasting, such as emitting canvas actions to everyone in a room.

REST would be insufficient for the experience because the app needs instant synchronization without page reloads. Polling would create unnecessary network traffic and higher latency. The event-driven approach keeps the code simpler while matching the game loop.

## 3. Why room state is managed centrally in the server

Room data is managed through server-controlled structures such as:

- `rooms` for room membership and per-player state
- `roomGames` for the live turn state and current word
- `roomTimers` for scheduled turn transitions

This was chosen because a shared drawing game cannot tolerate each client authoritatively deciding what the current turn is. The server decides:

- which team is drawing
- which word is active
- when the turn ends
- how guesses are evaluated
- which players are connected

The server also personalizes snapshots so that the current word is only visible to the active drawer, while the rest of the room sees the game state without exposing the solution.

This is a critical design decision because it prevents cheating, mismatch, and race conditions among multiple connected players.

## 4. Why sessions and reconnect logic were added

The client keeps a stable `sessionId` in `localStorage` and uses it in `SocketContext`. This is intentional. Users should reconnect as the same identity instead of being treated as new strangers when the socket reconnects or the browser refreshes.

The logic is built around a resume flow:

- user has a stored `sessionId`
- socket reconnects
- client emits `session:resume`
- server finds the player by session and restores room context

This was chosen because games are social and continuity matters. If a user reconnects after a brief loss, they should re-enter the same room and keep the same identity. It also makes room membership stable without requiring a database-backed auth system.

## 5. Why team/group selection is represented as room state rather than as a local UI-only state

Team assignment is not just cosmetic. It affects:

- the drawing/guessing role
- turn rotation
- score tracking
- visible assignment in room snapshots

Because of that, the server updates players with `groupName` and `teamIndex` and syncs them into the shared room model. The UI reads from the centralized snapshot rather than duplicating assignment logic in multiple pages.

This is important because the same user can rejoin later and still be placed in the right team. If team state lived only in the browser, team identity would vanish after a refresh or reconnect.

## 6. Why the app uses React contexts for socket and game state

The code uses multiple contexts:

- `SocketContext` to store stable session, username, room code, and room group data
- `GroupContext` to manage game-turn state and start-turn actions
- `RoomSettingContext` to keep difficulty and word choices

This is a deliberate compromise between simplicity and structure.

The app is small enough that a global store is not required, but shared state is used across multiple components. Context keeps the state accessible without prop drilling. It also centralizes reconnect logic and game start logic in reusable, testable units.

This choice fits the project size well. A larger app might justify Redux or Zustand, but for this codebase, context + socket events is simpler and easier to follow.

## 7. Why room snapshots are used instead of emitting raw room objects everywhere

The server emits `room:snapshot` to players. This is a key design choice because the client does not need to know all server internals. The snapshot includes:

- room code
- team list with scores and users
- the current player viewing the room
- the current game state
- a protected current word for the current drawer only

This hides the internal representation and gives each player a safe, role-aware view. It also makes the client UI easier to build because all room information is shaped in a consistent data model.

The `buildRoomSnapshot` function is a strong example of this design: it derives a UI-friendly structure from the server room state and strips the word from non-drawers.

## 8. Why the current word and turn timing are server-driven

The active word and turn timer are generated on the server. The client may request a game start, but the actual turn lifecycle is controlled by the server.

This is intentional because:

- timing must be consistent for all users
- a single player should not be able to manipulate turn timing locally
- scoring logic must happen once and be shared

The server holds `turnMs`, `turnsEndAt`, and `currentTeamIndex`, then emits the public version to clients. This keeps the game fair and avoids client-side desync.

## 9. Why the canvas interaction is broadcast per room

Canvas actions are emitted as:

- `canvas:draw-start`
- `canvas:draw-line`
- `canvas:draw-end`
- `canvas:clear`

These events are sent to everyone in the room using `socket.to(roomCode).emit(...)` so all listeners can update the shared drawing surface.

This was chosen because a drawing game needs continuous peer synchronization. Shared drawing is a collaborative state, not a private action. Broadcasting by room is the simplest and most reliable method in this codebase.

## 10. Why the project uses in-memory Maps instead of a database

This is a prototype-level design choice. The server does not persist rooms or players to a database; it stores them in memory for the active runtime.

This was chosen because:

- the app is focused on local multiplayer gameplay
- there is no user auth or persistent game history requirement
- the server is simple and lightweight

The tradeoff is obvious: state is lost on server restart. That is acceptable for this project stage, but it is a known limitation and the main reason the app cannot preserve long-lived room state across process restarts.

## 11. Why the lobby flow is explicit and staged

The app intentionally stages the flow as:

1. create or join a room
2. create or join a group/team
3. start the game
4. play rounds

This reduces ambiguity and makes the app easier to reason about. The room acts as a shared container; the group acts as a team or side selection; the game acts as the active round state. This separation keeps responsibilities clean.

It also makes the UI simpler. The user only sees the controls relevant to the current step rather than a giant single-screen game state.

## 12. Meaningful changes captured in this project

These are the important changes that shaped the current architecture:

### Change A: Socket layer centralized in a dedicated client service

The app moved socket logic into `client/src/services/Socket.js` instead of scattering event wiring across components. This is better because all socket events and listeners live in one place, reducing duplication and making the client easier to maintain.

### Change B: Stable session identity introduced

`SocketContext` adds `sessionId` persistence in `localStorage` and emits `session:resume` on reconnect. This was necessary for handling reconnections without duplicating users or losing team placement.

### Change C: Server-authoritative game state introduced

The server now owns the turn timer, current word, and current team index through `roomGames` and `syncGameToRoom`. This prevents client-side cheat scenarios and keeps all players synchronized.

### Change D: Personalized snapshots replaced naive broadcasting

Example: the server no longer simply sends the same room object to everyone. It now builds `buildRoomSnapshot(roomCode, viewerSessionId)` and exposes the current word only to the active drawer. This improves fairness and privacy.

### Change E: Team membership is recomputed from server state

The `syncTeamPlayers` helper rebuilds team members from the room’s `players` map. This keeps team cards consistent even after reconnects and state updates.

### Change F: Start-turn logic moved into the shared context layer

`GroupContext.startTurn()` encapsulates the start-game request. This makes the event call more reusable and keeps the component-level code smaller and cleaner.

## 13. Why the state model is intentionally simple and not a full app store

The app does not use a big central store like Redux or a database-backed state layer. That is a conscious decision.

Why this approach works here:

- the app is small and the state is mostly room-oriented
- most updates happen through a narrow set of socket events
- the real truth lives on the server, not in a client-side store
- the main UI concerns are room membership, active team, and current game status

This keeps the system easier to follow. The state is not spread across many files or deeply nested reducers. Instead, it is centralized in the room model and surfaced through context.

The downside is that it is not a highly scalable architecture for large multiplayer systems. If the game grows to many rooms, bigger lobbies, persisted history, or analytics, this approach would need to be replaced with a more durable and queryable store.

## 14. Why the project keeps validation logic lightweight instead of heavy form validation

The app validates room names, user names, and group names in a minimal way. This is not an extensive validation system, but it is appropriate for the project’s level.

The reason is practical:

- the app is not building a multi-tenant SaaS product
- the server is relatively small and the room logic is in-memory
- the project favors speed of iteration over strict enterprise validation rules

This means the code is easier to understand, but it also means edge cases such as empty room names, duplicate usernames in the same room, or name collision semantics are handled in a simpler way. That is acceptable for a prototype and a good fit for a learning or demo project.

## 15. Known trade-offs and limitations

This project is intentionally optimized for quick multiplayer experimentation rather than production-scale guarantees.

Important trade-offs:

- The server keeps everything in memory, so room data disappears on restart.
- There is no persistent database for room history or user accounts.
- There is no robust anti-abuse layer for room spamming or duplicate user attempts.
- There is no strict lifecycle cleanup for stale rooms after inactivity.
- Game logic is centralized but not heavily abstracted into formal domain modules.

These are not accidental flaws; they are conscious choices made to keep the project simple, understandable, and fast to debug.

## 16. Why there is a clear separation between service modules and controller logic

The project splits responsibility into a few layers:

- `client/services/Socket.js` handles all client-side socket event emission
- `server/services/roomService.js` validates room behavior
- `server/services/groupService.js` validates group behavior
- `server/controllers/socketController.js` owns the runtime socket handlers and game orchestration

This separation matters because it reduces coupling:

- the UI does not directly manipulate core server data
- the socket handler does not become a giant unstructured blob
- domain operations are easier to reason about when isolated by responsibility

The codebase is not a full layered architecture, but it follows a practical, readable pattern: service logic for data rules and controller logic for network event handling.

## 17. Why the app favors direct event-to-state synchronization over heavy abstraction

The project uses events like `room:snapshot`, `game:state`, `groupCreated`, `roomCreated`, and `canvas:*` to keep the UI synchronized.

This is an intentional choice because:

- the app is event-driven by nature
- the socket layer is already the dominant communication mechanism
- direct synchronization is easier to trace than building a large command pattern or an additional message bus

This keeps the code readable in a small codebase while still supporting proper real-time updates.

## 18. Overall architectural summary

The app’s design follows a practical real-time game pattern:

- React client for UI
- Socket.IO for live events
- Express server for room orchestration
- in-memory Maps for temporary state
- server-authoritative decisions for fairness
- session resume for continuity
- snapshot-based UI state for stable rendering
- lightweight validation and minimal persistence for speed and simplicity

This gives the project a simple but strong base. It is easy to understand, debug, and extend without introducing heavy infrastructure. The tradeoff is that it is intentionally optimized for a compact multiplayer prototype rather than large-scale production workloads.
