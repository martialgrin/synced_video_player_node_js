import { CONFIG } from "./CONFIG.js";

export function createInputHandlers(
	state,
	slider,
	renderer,
	moveSlide,
	onResize,
	apiGetter,
	isMaster
) {
	// Helper to send messages to server via WebSocket
	function sendToServer(message) {
		if (apiGetter && apiGetter() && apiGetter().send) {
			apiGetter().send(message);
			console.log("Sent to server:", message);
		}
	}

	function onSliderChange() {
		const value = slider.valueAsNumber;
		const index = Math.round(value * (state.numSlides - 1));
		moveSlide(index);

		// Broadcast slide changes to ALL clients (master and slaves)
		// When anyone navigates, all devices follow
		if (state.albumData[index]) {
			sendToServer({
				type: "setSource",
				source: state.albumData[index].sourceId,
			});
		}
	}

	function onPointerDown(event) {
		state.isDragging = true;
		state.dragStartX = event.clientX ?? event.touches[0].clientX;
		state.dragScrollStart = slider.valueAsNumber;
		renderer.domElement.style.cursor = "grabbing";
		event.preventDefault();
	}

	function onPointerMove(event) {
		if (!state.isDragging) return;
		event.preventDefault();

		const currentX = event.clientX ?? event.touches[0].clientX;
		const deltaX = currentX - state.dragStartX;
		const sensitivity = window.innerWidth * CONFIG.DRAG_SENSITIVITY_FACTOR;
		const scrollAmount = deltaX / sensitivity;

		slider.valueAsNumber = Math.max(
			0,
			Math.min(1, state.dragScrollStart - scrollAmount)
		);
		onSliderChange();
	}

	function onPointerUp() {
		if (!state.isDragging) return;
		state.isDragging = false;
		renderer.domElement.style.cursor = "grab";
	}

	function onWheel(event) {
		slider.valueAsNumber += event.deltaY * CONFIG.WHEEL_SENSITIVITY;
		onSliderChange();
		event.preventDefault();
	}

	function setup() {
		slider.addEventListener("input", onSliderChange);

		renderer.domElement.addEventListener("mousedown", onPointerDown);
		renderer.domElement.addEventListener("mousemove", onPointerMove);
		window.addEventListener("mouseup", onPointerUp);

		renderer.domElement.addEventListener("touchstart", onPointerDown, {
			passive: true,
		});
		renderer.domElement.addEventListener("touchmove", onPointerMove, {
			passive: false,
		});
		renderer.domElement.addEventListener("touchend", onPointerUp);
		renderer.domElement.addEventListener("touchcancel", onPointerUp);

		window.addEventListener("wheel", onWheel, { passive: false });
		window.addEventListener("resize", onResize);

		renderer.domElement.style.cursor = "grab";
	}

	return { setup, sendToServer };
}
