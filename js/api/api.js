export const api = (_callback, isMaster = false) => {
	let lastOffset = 0;
	const ws = new WebSocket(
		(location.protocol === "https:" ? "wss://" : "ws://") + location.host
	);

	// Initialize timesync
	const ts = timesync.create({
		server: "/timesync",
		interval: 1000,
	});

	ws.onopen = () => {
		console.log("WebSocket connected");
		// Identify to server if this is a master device
		if (isMaster) {
			console.log("Identifying as MASTER device (audio reference)");
			ws.send(JSON.stringify({ type: "identify", isMaster: true }));
		}
		_callback("wsOpen");
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			console.log("Received message:", message);

			switch (message.type) {
				case "play":
					_callback("play", {
						video: message.video,
						targetTime: message.targetTime,
					});
					break;
				case "pause":
					_callback("pause");
					break;
				case "stop":
					_callback("stop");
					break;
				case "reload":
					_callback("reload");
					break;
				case "welcome":
					_callback("welcome", { message: message.message });
					break;
				case "source":
					_callback("source", { source: message.source });
					break;
				default:
					_callback("unknown", { type: message.type });
			}
		} catch (error) {
			console.error("Error parsing message:", error);
			_callback("error", { error: error });
		}
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
		_callback("error WS", { error: error });
	};

	ws.onclose = () => {
		console.log("WebSocket disconnected");
		_callback("close WS");
	};

	// get notified on changes in the offset
	ts.on("change", function (offset) {
		// console.log("Timesync offset changed: " + offset + " ms");

		// Check if offset changed significantly
		const offsetChange = Math.abs(offset - lastOffset);

		_callback("offsetState", {
			currentOffset: offset,
			difference: offsetChange,
		});

		lastOffset = offset;
	});

	const getTs = () => {
		return ts.now();
	};

	return { getTs };
};
