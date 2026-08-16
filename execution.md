# Execution and Code Flow

This document explains the entry points of the project, the execution order, and the most important function-call chains.

## 1. Project entry points

### Client entry point

The browser app starts in:

- `client/src/main.jsx`

This file is the true browser bootstrap. It does the following:

1. creates the React root
2. loads the main CSS
3. renders the root App
4. wraps the app in `SocketContext`
5. wraps the app in `BrowserRouter`

Important sequence:

- `createRoot(document.getElementById('root'))`
- render `<SocketContext><BrowserRouter><App /></BrowserRouter></SocketContext>`

This means every component in the app can access the shared socket/session state, and the route system is available immediately.

### Server entry point

The backend starts in:

- `server/index.js`

This file does the following:

1. creates the Express app
2. configures CORS for HTTP and Socket.IO
3. creates the HTTP server
4. creates the Socket.IO server
5. registers `handleConnection(io, socket)`
6. listens on the configured port

This is the server bootstrapping layer. Everything else is called from the socket controller after a client connects.

## 2. Client boot sequence

### Sequence

1. `main.jsx` mounts the app.
2. `App.jsx` runs and defines routes.
3. The root route loads `Home.jsx`.
4. `Home.jsx` renders `RoomForm.jsx`.
5. `RoomForm.jsx` uses `useSocket()` from `SocketContext`.
6. When the user creates or joins a room, `RoomForm` emits socket events via `client/src/services/Socket.js`.
7. The server responds with room/group events.
8. On success, the app navigates to `/GameRoom`.
9. `GameRoom.jsx` mounts and listens for `room:snapshot` and game state updates.

### Main route structure

`App.jsx` defines:

- `/` -> `Home`
- `/GameRoom` -> wrapped by `RoomSettingContext` and `GroupContext` plus `GameRoom`

This means the game room is mounted only after room and group setup has succeeded.

## 3. Client state and context order

### `SocketContext`

`client/src/context/SocketContext.jsx` is one of the most important client-side entry points for app state.

It:

- creates the global socket state context
- reads/stores `sessionId` from `localStorage`
- initializes the room, user, group, and team state
- listens for `connect` and emits `session:resume`
- exposes `useSocket()` for all app components

This provider is mounted before `App`, so every route has access to the same shared session and room state.

### `RoomSettingContext`

`client/src/context/RoomSettingContext.jsx` owns the difficulty and word configuration. It is used by `GroupContext` when starting a game.

### `GroupContext`

`client/src/context/GroupContext.jsx` owns the turn state:

- `groups`
- `currentWord`
- `turnsEndAt`
- `currentTeamIndex`
- `phase`

It also contains `startTurn(roomCodeOverride)`, which packages the server call for beginning a round.

## 4. Socket service call flow

The client socket helper file is:

- `client/src/services/Socket.js`

This is the bridge between UI components and the server.

### Example call chain

`RoomForm.jsx` -> `createRoom(...)` in `Socket.js` -> `socket.emit("Create Room", roomCode, userName, sessionId)` -> server receives event in `socketController.js`

Likewise:

- `JoinRoom` emits `Join Room`
- `createGroup` emits `createGroup`
- `joinGroup` emits `joinGroup`
- `callAllGroup` emits `callAllGroup`
- canvas functions emit `canvas:*` events
- `GroupContext.startTurn` emits `game:start`

These service methods keep the components free of raw socket logic, which makes the UI easier to read.

## 5. Server boot and connection handling

### `server/index.js`

This file creates the server and then registers:

- `io.on("connection", (socket) => { handleConnection(io, socket); })`

So every new client connection enters the server controller at exactly one place: `handleConnection`.

### `socketController.js`

This is the central server logic file.

It defines:

- room creation handlers
- room join handlers
- group creation/join handlers
- canvas broadcasting
- game lifecycle events
- reconnect resume logic
- disconnect cleanup

This file is the heart of the server’s execution path.

## 6. Important execution chains

### A. Create room flow

1. User enters username and clicks “Create room” in `RoomForm.jsx`.
2. `createNewRoom()` calls `createRoom({ roomCode: roomName, userName, sessionId })`.
3. `Socket.js` emits `Create Room`.
4. Server `handleConnection` receives the event.
5. `createRoom({ roomCode, userName, userId: resolvedSessionId })` runs from `server/services/roomService.js`.
6. Server adds the room to the in-memory room map.
7. `attachPlayerToRoom(...)` adds the player to the room’s player map.
8. Server emits `roomCreated` to the client.
9. `RoomForm` handles `roomCreated` and navigates to `/GameRoom`.

### B. Join room flow

1. User enters an existing room code.
2. `JoinExistingRoom()` calls `JoinRoom(...)`.
3. Socket emits `Join Room`.
4. Server validates the room in `roomService.js`.
5. `attachPlayerToRoom(...)` adds the user to the room.
6. Server emits `RoomJoined`.
7. Client receives the join acknowledgement and sets room state.
8. Server emits `room:snapshot` for the player.

### C. Group/team flow

1. After the room is joined, the user can create or join a group.
2. `RoomForm` calls `createGroup(...)` or `joinGroup(...)` in the socket service.
3. The server receives `createGroup` or `joinGroup`.
4. `groupService.js` checks if the group exists or creates it.
5. `updatePlayerTeam(...)` assigns `teamIndex` and `groupName` to the current player.
6. Server broadcasts the updated list and emits personalized room snapshots.
7. `RoomForm` resolves the correct `groupIndex` and navigates to the game room.

### D. Game start flow

1. `GameRoom.jsx` calls `startTurn()` from `GroupContext`.
2. `startTurn()` gets the active room code and selected word pool.
3. It emits `game:start` via `Socket.js`.
4. The server receives `game:start` in `socketController.js`.
5. The server creates a game state object with:
   - `roomCode`
   - `wordPool`
   - `turnMs`
   - `groups`
   - `phase`
   - `currentWord`
   - `turnsEndAt`
6. `syncGameToRoom(...)` writes the game state into the room record.
7. The server emits `game:state` to the room and calls `emitPersonalizedRoomSnapshots`.
8. `scheduleAdvance(...)` starts a timer that rotates teams automatically.

### E. Reconnect flow

1. `SocketContext` detects a reconnect and emits `session:resume`.
2. Server looks up the player by `sessionId`.
3. If found, it restores the room and socket connection.
4. It sends back `room:snapshot` to restore the UI.
5. If a game is active, it also sends `game:state`.

This is the path that keeps users in the same room and role after temporary disconnects.

## 7. Function call map

### Frontend call map

- `main.jsx`
  - renders `App`
- `App.jsx`
  - renders `Home` or `GameRoom`
- `Home.jsx`
  - renders `RoomForm`
- `RoomForm.jsx`
  - calls `createRoom`, `JoinRoom`, `createGroup`, `joinGroup`
  - listens for `roomCreated`, `RoomJoined`, `groupCreated`, `groupJoined`
  - navigates to `/GameRoom`
- `GameRoom.jsx`
  - uses `useSocket()` and `useGroupContext()`
  - registers `room:snapshot` listener
  - renders `Canvas`, `WordBox`, `GuessPanel`, `TeamPlayers`
- `GroupContext.jsx`
  - calls `emitGameStart` / `emitGameStateRequest`
  - listens to `game:state` and `room:snapshot`

### Backend call map

- `server/index.js`
  - creates Express + Socket.IO
  - calls `handleConnection(io, socket)` on every connection
- `socketController.js`
  - handles Create Room, Join Room, createGroup, joinGroup
  - handles canvas events and game lifecycle
  - calls helper functions like:
    - `attachPlayerToRoom`
    - `updatePlayerTeam`
    - `buildRoomSnapshot`
    - `emitPersonalizedRoomSnapshots`
    - `syncGameToRoom`
    - `scheduleAdvance`
- `roomService.js`
  - validates room existence and membership
- `groupService.js`
  - validates group creation and joining

## 8. Key internal helpers and what they do

### `attachPlayerToRoom`

Adds a player to the in-memory room and updates the room state map.

### `updatePlayerTeam`

Assigns a player to a team/group and recomputes the team index.

### `syncTeamPlayers`

Rebuilds each team’s player list from the player registry so team cards always match actual room membership.

### `buildRoomSnapshot`

Creates the sanitized room payload sent to clients. It hides the current word for non-drawers.

### `syncGameToRoom`

Copies the runtime game state into the room entity so the room state and game state remain in sync.

### `scheduleAdvance`

Sets the timer that advances the turn automatically after the configured interval.

### `pickWord`

Picks the next word from a shuffled word pool.

## 9. End-to-end execution trace

A practical end-to-end trace looks like this:

1. Browser loads `main.jsx`.
2. `SocketContext` initializes the session and socket connection.
3. User enters username and decides to create/join a room in `RoomForm.jsx`.
4. Client emits a socket event from `Socket.js`.
5. Server receives the event in `handleConnection` and updates the in-memory room state.
6. Server emits acknowledgements like `roomCreated` or `RoomJoined`.
7. `RoomForm` updates the local context and navigates to `/GameRoom`.
8. `GameRoom.jsx` subscribes to `room:snapshot` and `game:state`.
9. `GroupContext` starts a round by emitting `game:start`.
10. Server creates a game object and starts `scheduleAdvance()`.
11. Timer rotates teams and updates the room state.
12. Clients receive fresh snapshots and re-render with new scores, roles, and the active drawing state.

## 10. Decision branches in the runtime

The execution is driven by a few important conditional branches:

- If the room does not exist, join requests fail with a room error.
- If the room exists, a player is attached to that room and a session is resumed if present.
- If a team/group already exists, the app will join it instead of creating a duplicate.
- If a player disconnects, the server marks them as disconnected without removing their identity from the room.
- If the player reconnects, `session:resume` restores the same room and identity.
- If a new round starts, the server resets turn data and emits the new `game:state` to all members.

These are the main state transitions that keep the game coherent.

## 11. What calls what, in plain English

- `main.jsx` calls `App.jsx`.
- `App.jsx` calls `Home.jsx` at `/` and `GameRoom.jsx` at `/GameRoom`.
- `Home.jsx` calls `RoomForm.jsx`.
- `RoomForm.jsx` calls socket helper methods in `Socket.js`.
- `Socket.js` emits events to the server.
- The server handles them in `socketController.js`.
- `socketController.js` calls `roomService.js` and `groupService.js` for room/group validation.
- The controller then updates `rooms`, `roomGames`, and `roomTimers`.
- The server emits a snapshot back to the client.
- `GameRoom.jsx` updates context state from `room:snapshot` and the UI re-renders.

## 12. Runtime mental model

The easiest way to understand this project is:

- the client is the interface
- the server owns the truth
- room membership and game rules are server-managed
- the UI is a reflection of snapshots and socket events

Once the room and group are established, the actual game loop is driven by server events, not by local component state alone.

That is the core design choice that keeps the experience consistent across multiple players and reconnects.
