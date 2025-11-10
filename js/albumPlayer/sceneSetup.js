import * as THREE from "three";
import { CONFIG } from "./CONFIG.js";
export function setupLighting() {
	const pointLight = new THREE.PointLight(0xffffff, 4, 1000);
	pointLight.position.set(0, 0, 500);
	const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
	return { pointLight, ambientLight };
}

export function setupBackground() {
	try {
		const texture = new THREE.TextureLoader().load(CONFIG.BACKGROUND_IMAGE);
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(3000, 1000),
			new THREE.MeshBasicMaterial({ map: texture })
		);
		mesh.position.z = -500;
		return mesh;
	} catch (error) {
		console.warn("Background image failed:", error);
	}
}

export function setupCamera() {
	const camera = new THREE.PerspectiveCamera(
		CONFIG.CAMERA_FOV,
		window.innerWidth / window.innerHeight,
		1,
		10000
	);
	camera.position.z = CONFIG.CAMERA_Z;
	return camera;
}

export function setupRenderer() {
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	return renderer;
}
