import * as THREE from "three";
import gsap from "gsap";

class SlideCard extends THREE.Object3D {
	constructor(album, config, isMaster) {
		super();
		this.config = config;
		this.isMaster = isMaster;
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
		video.muted = !this.isMaster;
		video.playsInline = true;
		video.volume = this.isMaster ? 1.0 : 0;
		video.preload = "auto"; // Request full preload

		// Track loading state
		video.isFullyLoaded = false;

		// When metadata is loaded
		video.addEventListener("loadedmetadata", () => {
			console.log(`[Video] Metadata loaded: ${url.split("/").pop()}`);
		});

		// When enough data is loaded to start playing
		video.addEventListener("canplay", () => {
			console.log(`[Video] Can play: ${url.split("/").pop()}`);
		});

		// When fully loaded (can play through without buffering)
		video.addEventListener("canplaythrough", () => {
			console.log(`[Video] Fully loaded: ${url.split("/").pop()}`);
			video.isFullyLoaded = true;
		});

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
			this.config.PLANE_WIDTH,
			this.config.PLANE_HEIGHT
		);

		const topPlane = new THREE.Mesh(geometry, topMaterial);
		this.add(topPlane);

		const reflectionPlane = new THREE.Mesh(
			geometry.clone(),
			reflectionMaterial
		);
		reflectionPlane.rotation.x = Math.PI;
		reflectionPlane.position.y = -this.config.PLANE_HEIGHT - 1;
		this.add(reflectionPlane);
	}

	play() {
		if (this.video.paused) {
			// Check if video is ready
			const readyState = this.video.readyState;
			console.log(
				`[Play] Video readyState: ${readyState} (0=nothing, 1=metadata, 2=current data, 3=future data, 4=enough data)`
			);

			// Force load if not ready (helps iOS)
			if (readyState < 2) {
				console.warn("[Play] Video not ready, forcing load...");
				this.video.load();
			}

			this.video.play().catch((error) => {
				console.error("Video play error:", error);
				// Retry once after a delay (helps iOS)
				setTimeout(() => {
					console.log("[Play] Retrying play...");
					this.video.play().catch((e) => console.error("Retry failed:", e));
				}, 100);
			});
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

export default SlideCard;
