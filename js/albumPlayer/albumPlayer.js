import * as THREE from "three";
import { api } from "../api/api.js";
import { messageManager } from "../components/messageManager.js";
import { getParamsFromUrl } from "../utils.js";
import {
	setupLighting,
	setupBackground,
	setupCamera,
	setupRenderer,
} from "./sceneSetup.js";
import { loadAlbumsPhonesDatas } from "./loadAlbumsPhonesDatas.js";
import { createSlideManager } from "./slideManager.js";
import { createCarouselController } from "./carouselController.js";
import { createInputHandlers } from "./inputHandlers.js";
import { createWebSocketHandlers } from "./websocketHandlers.js";
import { createMasterControls } from "./masterControls.js";
import { createPlayIndicator } from "./playIndicator.js";

function main() {
	const { isMaster } = getParamsFromUrl(window.location.href);

	// State
	const state = {
		slides: [],
		albumData: [],
		currentSlideIndex: 0,
		numSlides: 0,
		isPlaying: false,
		playTimeoutId: null,
		playbackStartTime: null,
		isDragging: false,
		dragStartX: 0,
		dragScrollStart: 0,
	};

	// Scene setup
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);
	const camera = setupCamera();
	const renderer = setupRenderer();

	const container = document.getElementById("container") || document.body;
	container.appendChild(renderer.domElement);

	const slider = document.querySelector("input#rangeSlider");

	// Controllers
	const slideManager = createSlideManager(state, scene, isMaster);
	const carouselController = createCarouselController(state);
	const playIndicator = createPlayIndicator();
	let masterControls = null;

	// Render loop
	function onResize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}

	function tick() {
		playIndicator.update(); // Update play indicator frame counter
		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	}

	const inputHandlers = createInputHandlers(
		state,
		slider,
		renderer,
		carouselController.moveSlide,
		onResize,
		() => API,
		isMaster
	);

	const MESSAGE_MANAGER = messageManager();
	let API = null;

	const websocketHandlers = createWebSocketHandlers(
		state,
		carouselController.moveSlide,
		() => API,
		MESSAGE_MANAGER,
		() => masterControls?.updatePlayPauseButton(),
		null, // No sync manager
		playIndicator
	);

	// Initialization
	async function init() {
		try {
			const { pointLight, ambientLight } = setupLighting();
			scene.add(pointLight);
			scene.add(ambientLight);

			// Get media type from URL params (e.g., ?media=album or ?media=album,phone)
			const urlParams = getParamsFromUrl(window.location.href);
			const mediaTypes = urlParams.media || "album"; // Default to album only

			state.albumData = await loadAlbumsPhonesDatas(mediaTypes);
			state.numSlides = state.albumData.length;

			slideManager.createSlides(state.albumData);

			const background = setupBackground();
			if (background) scene.add(background);

			const initialIndex = slideManager.initializeSlides();
			carouselController.moveSlide(initialIndex);
			slider.max = "1";
			slider.step = "0.001";
			slider.value = initialIndex / (state.numSlides - 1);

			inputHandlers.setup();

			// Setup master controls after everything is loaded
			masterControls = createMasterControls(state, isMaster);
			masterControls.setup(inputHandlers.sendToServer, playIndicator);

			onResize();
			tick();
		} catch (error) {
			console.error("Initialization failed:", error);
			alert(`Failed to load album videos: ${error.message}`);
		}
	}

	API = api(websocketHandlers.createMessageHandler(), isMaster);
	init();
}

window.onload = () => {
	main();
};
