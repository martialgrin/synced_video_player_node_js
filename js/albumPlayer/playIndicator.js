import { CONFIG } from "./CONFIG.js";

export function createPlayIndicator() {
	let frameCounter = 0;
	let isShowing = false;

	// Create DOM element for the indicator
	const indicator = document.createElement("div");
	indicator.id = "playIndicator";
	indicator.textContent = "PLAY";
	indicator.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 200px;
		font-weight: bold;
		color: #00ff00;
		text-shadow: 0 0 40px #00ff00, 0 0 80px #00ff00;
		z-index: 999999;
		display: none;
		pointer-events: none;
		font-family: Arial, sans-serif;
	`;
	document.body.appendChild(indicator);

	function show() {
		if (!CONFIG.SHOW_PLAY_INDICATOR) return;

		frameCounter = 0;
		isShowing = true;
		indicator.style.display = "block";
		console.log("[PlayIndicator] SHOWING - Frame 0");
	}

	function update() {
		if (!isShowing) return;

		frameCounter++;

		if (frameCounter >= CONFIG.PLAY_INDICATOR_FRAMES) {
			indicator.style.display = "none";
			isShowing = false;
			console.log(`[PlayIndicator] HIDDEN - After ${frameCounter} frames`);
		}
	}

	function hide() {
		indicator.style.display = "none";
		isShowing = false;
		frameCounter = 0;
	}

	return { show, update, hide };
}
