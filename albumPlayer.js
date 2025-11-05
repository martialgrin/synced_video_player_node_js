import * as THREE from "three";
import gsap from "gsap";
import { api } from "./js/api/api.js";
import { messageManager } from "./js/components/messageManager.js";
import { getParamsFromUrl } from "./js/utils.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIG = {
	BACKGROUND_IMAGE: "background.png",
	PLANE_WIDTH: 256,
	PLANE_HEIGHT: 256,
	SLIDE_SPACING_X: 80,
	SLIDE_ROTATION: 45 * (Math.PI / 180),
	SLIDE_OFFSET_FACTOR: 0.6,
	CAMERA_FOV: 30,
	CAMERA_Z: 900,
	ANIMATION_DURATION: 1.0,
	ROTATION_DURATION: 0.9,
	BRIGHTNESS_ACTIVE: 1.0,
	BRIGHTNESS_INACTIVE: 0.3,
	DRAG_SENSITIVITY_FACTOR: 2,
	WHEEL_SENSITIVITY: 0.0005,
};

const { isMaster } = getParamsFromUrl(window.location.href);

// ============================================================================
// STATE
// ============================================================================

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

// ============================================================================
// THREE.JS SETUP
// ============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
	CONFIG.CAMERA_FOV,
	window.innerWidth / window.innerHeight,
	1,
	10000
);
camera.position.z = CONFIG.CAMERA_Z;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const container = document.getElementById("container") || document.body;
container.appendChild(renderer.domElement);

// ============================================================================
// SLIDE CARD CLASS
// ============================================================================

class SlideCard extends THREE.Object3D {
	constructor(album) {
		super();

		this.video = this.createVideoElement(album.video_url);
		this.albumData = album;

		const videoTexture = this.createVideoTexture();
		const { topMaterial, reflectionMaterial } =
			this.createMaterials(videoTexture);

		this.addPlanes(topMaterial, reflectionMaterial);
		this.topMaterial = topMaterial;
		this.reflectionMaterial = reflectionMaterial;
	}

	createVideoElement(url) {
		const video = document.createElement("video");
		video.src = url;
		video.crossOrigin = "anonymous";
		video.loop = true;
		video.muted = !isMaster;
		video.playsInline = true;
		video.volume = isMaster ? 1.0 : 0;
		video.preload = "auto";
		video.addEventListener("loadeddata", () => video.pause());
		video.load();
		video.pause();
		return video;
	}

	createVideoTexture() {
		const texture = new THREE.VideoTexture(this.video);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.format = THREE.RGBAFormat;
		return texture;
	}

	createMaterials(videoTexture) {
		const topMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
		const reflectionMaterial = new THREE.MeshBasicMaterial({
			map: videoTexture,
			transparent: true,
			side: THREE.BackSide,
			opacity: 0.2,
		});
		return { topMaterial, reflectionMaterial };
	}

	addPlanes(topMaterial, reflectionMaterial) {
		const geometry = new THREE.PlaneGeometry(
			CONFIG.PLANE_WIDTH,
			CONFIG.PLANE_HEIGHT
		);

		const topPlane = new THREE.Mesh(geometry, topMaterial);
		this.add(topPlane);

		const reflectionPlane = new THREE.Mesh(
			geometry.clone(),
			reflectionMaterial
		);
		reflectionPlane.rotation.x = Math.PI;
		reflectionPlane.position.y = -CONFIG.PLANE_HEIGHT - 1;
		this.add(reflectionPlane);
	}

	play() {
		if (this.video.paused) {
			this.video
				.play()
				.catch((error) => console.error("Video play error:", error));
		}
	}

	pause() {
		if (!this.video.paused) {
			this.video.pause();
		}
	}

	reset() {
		this.video.currentTime = 0;
	}

	setBrightness(brightness) {
		const colorTween = {
			r: brightness,
			g: brightness,
			b: brightness,
			duration: 0.5,
			ease: "power2.out",
		};

		gsap.to(this.topMaterial.color, colorTween);
		gsap.to(this.reflectionMaterial.color, colorTween);
	}
}

// ============================================================================
// SCENE MANAGEMENT
// ============================================================================

function setupLighting() {
	const pointLight = new THREE.PointLight(0xffffff, 4, 1000);
	pointLight.position.set(0, 0, 500);
	scene.add(pointLight);

	const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
	scene.add(ambientLight);
}

function setupBackground() {
	try {
		const texture = new THREE.TextureLoader().load(CONFIG.BACKGROUND_IMAGE);
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(3000, 1000),
			new THREE.MeshBasicMaterial({ map: texture })
		);
		mesh.position.z = -500;
		scene.add(mesh);
	} catch (error) {
		console.warn("Background image failed:", error);
	}
}

async function loadAlbumData() {
	const response = await fetch("./albums.json");
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	return response.json();
}

function createSlides(albumData) {
	albumData.forEach((album) => {
		const slide = new SlideCard(album);
		scene.add(slide);
		state.slides.push(slide);
	});
}

function initializeSlides() {
	const initialIndex = Math.floor(state.numSlides / 2);

	state.slides.forEach((slide, i) => {
		slide.setBrightness(
			i === initialIndex ? CONFIG.BRIGHTNESS_ACTIVE : CONFIG.BRIGHTNESS_INACTIVE
		);
		slide.pause();
	});

	return initialIndex;
}

// ============================================================================
// CAROUSEL CONTROL
// ============================================================================

function moveSlide(targetIndex) {
	if (state.currentSlideIndex === targetIndex) return;

	state.slides.forEach((slide, i) => {
		const offset = i - targetIndex;
		const position = calculateSlidePosition(offset);
		const rotation = calculateSlideRotation(offset);

		updateSlideState(slide, i === targetIndex);
		animateSlide(slide, position, rotation);
	});

	state.currentSlideIndex = targetIndex;
}

function calculateSlidePosition(offset) {
	const x = CONFIG.SLIDE_SPACING_X * offset;
	let adjustedX = x;
	let z = 0;

	if (offset < 0) {
		adjustedX -= CONFIG.PLANE_WIDTH * CONFIG.SLIDE_OFFSET_FACTOR;
		z = CONFIG.PLANE_WIDTH;
	} else if (offset > 0) {
		adjustedX += CONFIG.PLANE_WIDTH * CONFIG.SLIDE_OFFSET_FACTOR;
		z = CONFIG.PLANE_WIDTH;
	}

	return { x: adjustedX, z };
}

function calculateSlideRotation(offset) {
	if (offset < 0) return CONFIG.SLIDE_ROTATION;
	if (offset > 0) return -CONFIG.SLIDE_ROTATION;
	return 0;
}

function updateSlideState(slide, isActive) {
	if (isActive) {
		if (state.isPlaying) slide.play();
		slide.setBrightness(CONFIG.BRIGHTNESS_ACTIVE);
	} else {
		slide.pause();
		slide.setBrightness(CONFIG.BRIGHTNESS_INACTIVE);
	}
}

function animateSlide(slide, position, rotationY) {
	gsap.to(slide.position, {
		x: position.x,
		z: -position.z,
		duration: CONFIG.ANIMATION_DURATION,
		ease: "expo.out",
		overwrite: true,
	});

	gsap.to(slide.rotation, {
		y: rotationY,
		duration: CONFIG.ROTATION_DURATION,
		ease: "expo.out",
		overwrite: true,
	});
}

// ============================================================================
// INPUT HANDLERS
// ============================================================================

const slider = document.querySelector("input#rangeSlider");

function onSliderChange() {
	const value = slider.valueAsNumber;
	const index = Math.round(value * (state.numSlides - 1));
	moveSlide(index);
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

function setupInputHandlers() {
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

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

const MESSAGE_MANAGER = messageManager();
let API = null;

function handlePlayCommand(targetTime, isFirstCall = true) {
	const now = API.getTs();
	const timeUntilPlay = targetTime - now;

	if (isFirstCall) {
		MESSAGE_MANAGER.showMessage(
			`Playing in ${Math.ceil(timeUntilPlay / 1000)}s...`
		);
	}

	if (timeUntilPlay <= 0) {
		state.playTimeoutId = null;
		state.playbackStartTime = targetTime;

		if (state.slides[state.currentSlideIndex]) {
			state.slides[state.currentSlideIndex].play();
			state.isPlaying = true;
			MESSAGE_MANAGER.showMessage("Playing");
		}
		return;
	}

	const checkDelay = Math.min(timeUntilPlay, 10);
	state.playTimeoutId = setTimeout(
		() => handlePlayCommand(targetTime, false),
		checkDelay
	);
}

function clearPlayTimeout() {
	if (state.playTimeoutId) {
		clearTimeout(state.playTimeoutId);
		state.playTimeoutId = null;
	}
}

function handleSourceCommand(source) {
	if (!source || !source.includes("/album/")) return;

	const parts = source.split("/album/");
	if (parts.length < 2) return;

	const albumNumber = parseInt(parts[1]);
	if (isNaN(albumNumber) || albumNumber < 1 || albumNumber > state.numSlides)
		return;

	const targetIndex = albumNumber - 1;
	moveSlide(targetIndex);
}

const onMessageHandler = (event, data) => {
	if (event !== "offsetState") {
		MESSAGE_MANAGER.showMessage(event);
	}

	const handlers = {
		play: () => {
			clearPlayTimeout();
			if (data.targetTime) {
				handlePlayCommand(data.targetTime);
			} else if (state.slides[state.currentSlideIndex]) {
				state.slides[state.currentSlideIndex].play();
				state.isPlaying = true;
			}
		},
		pause: () => {
			clearPlayTimeout();
			state.slides.forEach((slide) => slide.pause());
			state.isPlaying = false;
		},
		stop: () => {
			clearPlayTimeout();
			state.playbackStartTime = null;
			state.slides.forEach((slide) => {
				slide.pause();
				slide.reset();
			});
			state.isPlaying = false;
		},
		reload: () => window.location.reload(),
		source: () => handleSourceCommand(data.source),
	};

	handlers[event]?.();
};

// ============================================================================
// RENDER LOOP
// ============================================================================

function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

function tick() {
	renderer.render(scene, camera);
	requestAnimationFrame(tick);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
	try {
		setupLighting();

		state.albumData = await loadAlbumData();
		state.numSlides = state.albumData.length;

		createSlides(state.albumData);
		setupBackground();

		const initialIndex = initializeSlides();
		moveSlide(initialIndex);

		slider.max = "1";
		slider.step = "0.001";
		slider.value = initialIndex / (state.numSlides - 1);

		setupInputHandlers();
		onResize();
		tick();
	} catch (error) {
		console.error("Initialization failed:", error);
		alert("Failed to load albums.json");
	}
}

// ============================================================================
// ENTRY POINT
// ============================================================================

API = api(onMessageHandler, isMaster);
init();
