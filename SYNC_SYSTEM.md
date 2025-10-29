# Video Synchronization System

## Overview

This system provides **frame-accurate synchronized playback** across multiple devices using a server-based clock as the single source of truth. No master/slave relationship between clients - all devices sync independently to the server time.

## Architecture

```
┌─────────────────┐
│   TimeSunc      │  ← Single Source of Truth
│   Server Clock  │
└────────┬────────┘
         │
    ┌────┴────────┬──────────┬──────────┐
    │             │          │          │
┌───▼───┐   ┌────▼────┐ ┌───▼───┐  ┌───▼───┐
│Client1│   │ Client2 │ │Client3│  │Client4│
└───────┘   └─────────┘ └───────┘  └───────┘
```

## How It Works

### 1. **Synchronized Time Foundation**

- Uses `timesync` library to synchronize all client clocks with server
- Each client maintains a synchronized time offset
- Typical accuracy: ±10-50ms

### 2. **Playback Start**

When a play command is sent:

```javascript
// Server broadcasts
{
  type: "play",
  targetTime: 1730000000000  // Server time when playback should start
}
```

All clients:

1. Receive the same `targetTime` (in synchronized server time)
2. Calculate local delay until that time
3. Start playback simultaneously at that moment

### 3. **Continuous Sync Monitoring**

The `syncManager` runs every second and:

```javascript
// Calculate expected position
expectedTime = (currentServerTime - playbackStartTime) / 1000

// Get actual position
actualTime = player.getCurrentTime()

// Check drift
drift = |expectedTime - actualTime|

// Resync if needed
if (drift > 0.1 seconds) {
  player.setCurrentTime(expectedTime)
}
```

### 4. **Automatic Drift Correction**

**Triggers for resync:**

- Periodic check (every 1 second)
- Large timesync offset change (>100ms)
- Manual force resync

**Resync threshold:** 100ms

- Smaller = more frequent corrections but smoother
- Larger = fewer corrections but more drift

## Components

### `syncManager.js`

Handles all synchronization logic:

- Tracks playback start time (in server time)
- Monitors drift every second
- Triggers corrections when needed
- Responds to timesync offset changes

**Key methods:**

```javascript
syncMgr.startPlayback(player, targetTime); // Start synced playback
syncMgr.checkAndResync(); // Check sync status
syncMgr.forceResync(); // Manual resync
syncMgr.handleOffsetChange(offset); // Handle clock drift
```

### `pngSequencePlayer.js`

PNG sequence player with time tracking:

- Plays at exactly 24 FPS
- `getCurrentTime()` - Returns current playback position
- `setCurrentTime(time)` - Seeks to specific time
- `getDuration()` - Returns total duration

### `playerManager.js`

Integrates sync manager with players:

- Creates sync manager when timesync is available
- Forwards offset changes to sync manager
- Coordinates pause/stop with sync tracking

### `api.js`

Provides synchronized time:

```javascript
API.getTs(); // Returns current synchronized server time
```

## Configuration

### Sync Parameters (in `syncManager.js`)

```javascript
const SYNC_CHECK_INTERVAL = 1000; // Check every 1 second
const SYNC_THRESHOLD = 0.1; // Resync if off by >100ms
```

### Frame Rate (in `pngSequencePlayer.js`)

```javascript
const FPS = 24; // 24 frames per second
```

Adjust based on your content:

- 24 FPS = cinema standard
- 25 FPS = PAL video
- 30 FPS = NTSC video
- 12 FPS = slower, more stylized

## Usage

### 1. Start the Server

```bash
npm start
```

### 2. Open Multiple Clients

```
http://localhost:3000/?type=pngSequence
http://localhost:3000/?type=video
```

### 3. Trigger Playback

Use the command interface or send via WebSocket:

```javascript
{
  "type": "play",
  "video": "0"  // or source name
}
```

## Monitoring Sync

Watch the console for sync messages:

```
[SyncManager] Playback scheduled at server time: 2024-10-29T12:00:00.000Z
[SyncManager] Sync checking started (every 1000ms)
[SyncManager] Drift detected: 0.150s. Resyncing from 5.234s to 5.384s
```

## Troubleshooting

### Sync Drift

**Symptom:** Videos consistently drift apart
**Solutions:**

1. Reduce `SYNC_CHECK_INTERVAL` (e.g., 500ms)
2. Lower `SYNC_THRESHOLD` (e.g., 0.05 = 50ms)
3. Check network stability
4. Verify timesync is working: monitor offset changes

### Stuttering

**Symptom:** Video keeps jumping/stuttering  
**Solutions:**

1. Increase `SYNC_THRESHOLD` (e.g., 0.2 = 200ms)
2. Increase `SYNC_CHECK_INTERVAL` (e.g., 2000ms)
3. Check device performance

### Not Syncing at All

**Symptom:** No sync corrections happening
**Solutions:**

1. Check console for `[SyncManager]` messages
2. Verify `getTimeSyncNow` is passed to `playerManager`
3. Check that timesync is initialized in `api.js`

## Advanced Features

### Manual Force Resync

```javascript
PLAYER_MANAGER.forceResync();
```

### Monitor Offset Changes

The system automatically resyncs when timesync offset changes significantly:

```javascript
// Triggered automatically on large offset changes (>100ms)
PLAYER_MANAGER.handleOffsetChange(offsetChange);
```

## Performance

**Typical Sync Accuracy:**

- LAN: ±20-50ms
- Good WiFi: ±50-100ms
- Poor Network: ±100-500ms

**Overhead:**

- Sync check: <1ms per second
- Resync operation: <10ms
- Network: ~100 bytes/second for timesync

## Best Practices

1. **Start with default settings** - They work well for most cases
2. **Monitor the console** - Watch for drift patterns
3. **Adjust threshold gradually** - Small changes, test thoroughly
4. **Consider network quality** - Tighter sync needs better network
5. **Test with target devices** - Mobile may need different settings

## Future Improvements

Potential enhancements:

- Adaptive sync threshold based on network quality
- Predictive drift compensation
- Multi-server redundancy
- Real-time latency visualization
- Automatic FPS detection from media
