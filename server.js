const express = require("express");
const { WebSocketServer } = require("ws");
const { createServer } = require("http");
const { join } = require("path");
const timesyncServer = require("timesync/server");
const {
	scanMediaDirectories,
	getFolderNames,
	getFolderUrls,
	getMediaSummary,
} = require("./js/server/mediaScanner");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let currentSource = "0";
const videosPath = join(__dirname, "videos");

// Scan media directories on startup
let mediaCatalog = {};
try {
	mediaCatalog = scanMediaDirectories(videosPath);
	const summary = getMediaSummary(mediaCatalog);
	console.log("Media catalog loaded:");
	console.log("MP4 folders:", summary.mp4.folders);
	console.log("PNG Sequence folders:", summary.png_sequence.folders);
	console.log(`Total MP4 files: ${summary.mp4.totalFiles}`);
	console.log(`Total PNG files: ${summary.png_sequence.totalFiles}`);
} catch (error) {
	console.error("Error scanning media directories:", error);
}

const PORT = process.env.PORT || 3000;

// Store all connected clients with metadata
const clients = new Map(); // Map of ws -> client metadata
let clientIdCounter = 0;

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Serve index.html for root route
app.get("/", (req, res) => {
	res.sendFile(join(__dirname, "index.html"));
});
app.use("/timesync", timesyncServer.requestHandler);

// Serve MP4 files: /videos/mp4/{folder}/{file}
app.use("/videos/mp4", express.static(join(__dirname, "videos/mp4")));

// Serve PNG sequence files: /videos/png_sequence/{folder}/{file}
app.use(
	"/videos/png_sequence",
	express.static(join(__dirname, "videos/png_sequence"))
);

// API endpoint to get media catalog
app.get("/api/media", (req, res) => {
	res.json({
		catalog: mediaCatalog,
		summary: getMediaSummary(mediaCatalog),
	});
});

// API endpoint to get folders for a specific type
app.get("/api/media/:type/folders", (req, res) => {
	const { type } = req.params;
	const folders = getFolderNames(mediaCatalog, type);
	res.json({ type, folders });
});

// API endpoint to get URLs for a specific folder
app.get("/api/media/:type/:folderName", (req, res) => {
	const { type, folderName } = req.params;
	const urls = getFolderUrls(mediaCatalog, type, folderName);
	if (urls.length === 0) {
		return res.status(404).json({ error: "Folder not found" });
	}
	res.json({ type, folderName, urls, count: urls.length });
});

// Keep old route for backward compatibility
app.use(
	"/video-vertical",
	express.static(join(__dirname, "/videos/mp4/0/0.mp4"))
);

// Broadcast message to all connected clients
function broadcast(message, excludeCommanders = false) {
	const data = JSON.stringify(message);
	clients.forEach((metadata, client) => {
		if (client.readyState === 1) {
			// WebSocket.OPEN = 1
			// Skip commander clients if excludeCommanders is true
			if (excludeCommanders && metadata.isCommander) {
				return;
			}
			client.send(data);
		}
	});
}

// Get list of all connected clients
function getClientsList() {
	const clientsList = [];
	clients.forEach((metadata, ws) => {
		if (ws.readyState === 1) {
			clientsList.push({
				id: metadata.id,
				connectedAt: metadata.connectedAt,
				isCommander: metadata.isCommander,
			});
		}
	});
	return clientsList;
}

// Broadcast client list update to all commander clients
function broadcastClientListUpdate() {
	const clientsList = getClientsList();
	const message = JSON.stringify({
		type: "clientsUpdate",
		clients: clientsList,
		total: clientsList.length,
	});

	clients.forEach((metadata, client) => {
		if (client.readyState === 1 && metadata.isCommander) {
			client.send(message);
		}
	});
}

// WebSocket connection handling
wss.on("connection", (ws, req) => {
	console.log("New WebSocket connection established");

	// Create client metadata
	const clientId = ++clientIdCounter;
	const clientMetadata = {
		id: clientId,
		connectedAt: new Date().toISOString(),
		isCommander: false, // Will be set to true if client identifies as commander
	};

	// Add client to map
	clients.set(ws, clientMetadata);

	// Send welcome message to client
	ws.send(
		JSON.stringify({
			type: "welcome",
			message: "Connected to server",
			clientId: clientId,
		})
	);
	ws.send(JSON.stringify({ type: "source", source: currentSource }));

	// Broadcast updated client list to commanders
	broadcastClientListUpdate();

	// Handle messages from client
	ws.on("message", (message) => {
		try {
			const data = JSON.parse(message);
			console.log("Received:", data);

			switch (data.type) {
				case "identify":
					// Client identifies itself as commander or regular client
					if (data.role === "commander") {
						clientMetadata.isCommander = true;
						// Send initial client list to new commander
						ws.send(
							JSON.stringify({
								type: "clientsUpdate",
								clients: getClientsList(),
								total: getClientsList().length,
							})
						);
					}
					break;
				case "getClients":
					// Request for client list
					ws.send(
						JSON.stringify({
							type: "clientsUpdate",
							clients: getClientsList(),
							total: getClientsList().length,
						})
					);
					break;
				case "play":
					// Calculate target time: 5 seconds from now
					const targetTime = Date.now() + 5000;

					// Broadcast play command to all clients with target time (excluding commanders)
					broadcast(
						{
							type: "play",
							video: data.video || "video-vertical",
							targetTime: targetTime,
							delay: 5000,
						},
						true
					);
					console.log(
						`Broadcasting play command for ${
							data.video || "video-vertical"
						} at ${new Date(targetTime).toISOString()}`
					);
					break;
				case "pause":
					broadcast({ type: "pause" }, true);
					break;
				case "reload":
					broadcast({ type: "reload" }, true);
					break;
				case "stop":
					broadcast({ type: "stop" }, true);
					break;
				default:
					// Echo message back to sender only
					ws.send(JSON.stringify({ type: "echo", data: data }));
			}
		} catch (error) {
			console.error("Error parsing message:", error);
			ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
		}
	});

	// Handle connection close
	ws.on("close", () => {
		console.log("WebSocket connection closed");
		clients.delete(ws);
		// Broadcast updated client list to commanders
		broadcastClientListUpdate();
	});

	// Handle errors
	ws.on("error", (error) => {
		console.error("WebSocket error:", error);
		clients.delete(ws);
		// Broadcast updated client list to commanders
		broadcastClientListUpdate();
	});
});

// Start server
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`WebSocket server ready for connections`);
});
