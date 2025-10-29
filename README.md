# Video Synchronization Platform

A real-time video synchronization platform designed for video installations with minimal offset time. This system uses WebSockets to synchronize video playback across multiple devices.

## Features

- **Master-Slave Architecture**: First connected device becomes master, others sync to it
- **Low Latency**: Optimized for minimal sync offset (< 100ms typical)
- **Network Compensation**: Automatically compensates for network latency
- **Auto-Failover**: If master disconnects, next device becomes master
- **Heartbeat Monitoring**: Continuous connection health monitoring
- **Real-time Sync**: Continuous synchronization during playback

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the server**:

   ```bash
   npm start
   ```

3. **Open multiple browser windows**:

   - Go to `http://localhost:8080`
   - Open the same URL in multiple browser windows/tabs
   - The first window becomes the master device

4. **Add a video file**:
   - Place your video file in the project directory
   - Update the video source in the HTML (currently set to `your-video.mp4`)

## Creating a Test Video

Run the test video generator:

```bash
node create-test-video.js
```

This will either:

- Create a test video using FFmpeg (if installed)
- Generate an HTML file to create a test video in your browser

## How It Works

### Synchronization Strategy

1. **Master Device**: Controls playback and sends sync commands
2. **Slave Devices**: Receive commands and sync their video players
3. **Latency Compensation**: Calculates network delay and adjusts sync timing
4. **Continuous Sync**: Sends sync updates every 100ms during playback

### Key Components

- **WebSocket Server**: Handles real-time communication
- **HTTP Server**: Serves the web interface
- **Client JavaScript**: Manages video synchronization
- **Heartbeat System**: Monitors connection health

## Technical Details

### Sync Precision

- **Target Offset**: < 100ms between devices
- **Sync Frequency**: Every 100ms during playback
- **Latency Compensation**: Automatic network delay calculation
- **Frame Accuracy**: Syncs to video frame boundaries

### Network Requirements

- **Low Latency**: < 50ms network latency recommended
- **Stable Connection**: WebSocket with automatic reconnection
- **Bandwidth**: Minimal (only control commands, not video data)

## Usage for Video Installations

1. **Setup**: Connect all devices to the same network
2. **Master Selection**: First device to connect becomes master
3. **Video Loading**: Load the same video file on all devices
4. **Sync**: Use the "Force Sync" button to ensure perfect alignment
5. **Playback**: Master controls playback, all devices sync automatically

## Troubleshooting

### High Sync Offset

- Check network latency between devices
- Ensure all devices are on the same network
- Use "Force Sync" button to re-synchronize

### Connection Issues

- Check firewall settings (port 8080 and 8081)
- Ensure WebSocket connections are allowed
- Monitor browser console for errors

### Video Not Loading

- Ensure video file exists in project directory
- Check video format compatibility (MP4 recommended)
- Update video source path in the HTML

## Advanced Configuration

### Custom Sync Intervals

Modify the sync frequency in `server.js`:

```javascript
// Change from 100ms to custom interval
if (this.isMaster && Date.now() - this.lastSyncTime > 50) {
	// 50ms for higher precision
}
```

### Network Optimization

- Use wired connections when possible
- Minimize network hops between devices
- Consider dedicated network for installation

## Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

## License

ISC License - Free for use in installations and projects.
# synced_video_player_node_js
