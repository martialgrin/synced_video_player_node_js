# Album Player Module Structure

Professional, modular architecture for the 3D video carousel album player.

## 📁 File Structure

```
js/albumPlayer/
├── CONFIG.js                    # Configuration constants
├── SlideCard.js                 # 3D slide card component
├── animation.js                 # Animation calculations
├── sceneSetup.js                # THREE.js scene setup
├── loadAlbumsPhonesDatas.js     # Server data loading
├── slideManager.js              # Slide creation & initialization
├── carouselController.js        # Carousel navigation logic
├── inputHandlers.js             # User input (drag/swipe/wheel)
├── websocketHandlers.js         # WebSocket command handlers
└── README.md                    # This file
```

## 📋 Module Responsibilities

### **CONFIG.js**

- All configuration constants
- Visual parameters (dimensions, spacing, colors)
- Animation timings
- Interaction sensitivities

### **SlideCard.js**

- 3D slide card component (extends THREE.Object3D)
- Video element creation and management
- Video texture setup
- Material creation (main + reflection)
- Brightness control
- Play/pause/reset methods

### **sceneSetup.js**

- THREE.js scene initialization
- Camera setup
- Renderer setup
- Lighting configuration
- Background image loading

### **animation.js**

- Pure calculation functions
- Slide position calculations
- Rotation calculations
- No side effects

### **loadAlbumsPhonesDatas.js**

- Fetches data from server API
- Loads all projects
- Scans album subfolders
- Finds MP4 video files
- Transforms API data to album format

### **slideManager.js**

- Creates SlideCard instances
- Adds slides to scene
- Initializes slide states
- Sets initial brightness
- Returns initial index

### **carouselController.js**

- Carousel navigation logic
- `moveSlide()` - Main navigation function
- Slide state updates (active/inactive)
- Slide animations (position + rotation)
- Brightness transitions

### **inputHandlers.js**

- Slider input handling
- Mouse drag/swipe
- Touch gestures
- Mouse wheel navigation
- Event listener setup
- Cursor state management
- **Server communication** - Can send messages to server/other clients

### **websocketHandlers.js**

- WebSocket message handling
- Play command (with countdown)
- Pause/Stop commands
- Source command (project switching)
- Reload command
- Play timeout management

## 🔄 Data Flow

```
1. User opens page
   ↓
2. main() executes
   ↓
3. loadAlbumsPhonesDatas() fetches all album videos from all projects
   ↓
4. slideManager.createSlides() creates 3D slide cards
   ↓
5. carouselController.moveSlide() positions initial view
   ↓
6. inputHandlers setup user interactions
   ↓
7. websocketHandlers listen for commands
   ↓
8. tick() renders continuously
```

## 🎮 User Interactions

### Input → Handler → Action

- **Slider** → `onSliderChange()` → `moveSlide()`
- **Drag** → `onPointerMove()` → `moveSlide()`
- **Wheel** → `onWheel()` → `moveSlide()`
- **Touch** → `onPointerMove()` → `moveSlide()`

### WebSocket → Handler → Action

- **Play** → `handlePlayCommand()` → `slide.play()`
- **Pause** → handler → `slide.pause()`
- **Stop** → handler → `slide.reset()`
- **Source** → `handleSourceCommand()` → `moveSlide()`

## 🏗️ Architecture Benefits

### **Separation of Concerns**

Each module has a single, clear responsibility

### **Testability**

Pure functions can be tested independently

### **Maintainability**

Changes are isolated to specific modules

### **Reusability**

Modules can be reused in other projects

### **Readability**

Clear file names and organization

### **Scalability**

Easy to add new features without touching existing code

## 🔧 Adding New Features

### To add a new animation type:

→ Add to `animation.js`

### To add a new input method:

→ Add to `inputHandlers.js`

### To add a new WebSocket command:

→ Add to `websocketHandlers.js`

### To change visual parameters:

→ Update `CONFIG.js`

### To modify the slide appearance:

→ Update `SlideCard.js`

## 📝 Usage

```javascript
// URL Parameters
?isMaster=true          // Enable audio (master device)
?project=Dynamic-ID     // Load specific project (default: Dynamic-ID)

// Examples:
http://localhost:3000/album-player.html?isMaster=true
http://localhost:3000/album-player.html?project=test-cavalry-project
```

## 🎯 Main File Responsibilities

The main `albumPlayer.js` now only:

- Imports all modules
- Wires dependencies together
- Initializes the application
- Manages lifecycle

This follows the **Dependency Injection** pattern, making the code highly flexible and testable.

## 🌐 Server Communication from Input Handlers

The input handlers can now send messages to the server, enabling synchronized navigation across all devices.

### **Master/Slave Navigation Behavior**

The album player implements smart navigation synchronization:

#### **Slave Devices (default)**

- When you navigate (drag/swipe/wheel/slider), changes are broadcast to all clients
- Other devices automatically follow your navigation
- Enables collaborative viewing

#### **Master Device (`?isMaster=true`)**

- Navigation changes are NOT broadcast
- Master has full control with audio
- Other devices sync to master's commands

```javascript
// In inputHandlers.js - onSliderChange()
// Only broadcasts if NOT master
if (!isMaster && state.albumData[index]) {
	sendToServer({
		type: "setSource",
		source: state.albumData[index].sourceId,
	});
}
```

### **Custom Commands**

Send custom messages for any interaction:

```javascript
// Example: Notify server when user drags
sendToServer({
	type: "userInteraction",
	action: "drag",
	slideIndex: index,
});
```

### **Analytics/Tracking**

Track user interactions:

```javascript
// Example: Track which albums users view most
sendToServer({
	type: "analytics",
	event: "slideView",
	albumId: state.albumData[index].sourceId,
	timestamp: Date.now(),
});
```

### **Collaborative Features**

Enable multi-user experiences:

```javascript
// Example: Share current view with other users
sendToServer({
	type: "shareView",
	slideIndex: index,
	username: "User123",
});
```

### API Methods Available

From `inputHandlers.js`, you have access to:

```javascript
sendToServer(message); // Send any message to server
```

The message will be:

1. JSON-stringified automatically
2. Sent via WebSocket
3. Received by server
4. Can be broadcast to other clients

### Example Use Cases

**Scenario 1: Interactive Installation**

- Multiple phones/tablets showing different albums
- Users on slave devices can navigate independently
- Their navigation broadcasts to all other slaves
- Creates collaborative viewing experience

**Scenario 2: Controlled Presentation**

- Master device (with audio) controls the main flow
- Master navigates → all slaves follow (via command.html)
- Slaves can't override master's control
- Perfect for guided presentations

**Scenario 3: Multi-User Gallery**

- All devices are slaves (no master)
- Anyone can navigate
- Everyone sees the same content
- Synchronized exploration

## 🎮 Testing Multi-Device Sync

Open multiple browser windows:

**Window 1 (Slave):**

```
http://localhost:3000/album-player.html
```

**Window 2 (Slave):**

```
http://localhost:3000/album-player.html
```

**Window 3 (Master):**

```
http://localhost:3000/album-player.html?isMaster=true
```

Now:

- Navigate on Window 1 → Window 2 follows
- Navigate on Window 2 → Window 1 follows
- Navigate on Window 3 (master) → Windows 1 & 2 do NOT follow (master doesn't broadcast)
- Use command.html → All windows follow (server commands override)
