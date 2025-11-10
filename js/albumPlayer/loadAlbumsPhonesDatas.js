export async function loadAlbumsPhonesDatas(mediaTypesParam = "album") {
	const projectsResponse = await fetch("/api/media/projects");
	if (!projectsResponse.ok) {
		throw new Error("Failed to fetch projects");
	}

	const projectsData = await projectsResponse.json();
	const projects = projectsData.projects;

	const items = [];

	// Parse media types from parameter (e.g., "album" or "album,phone")
	const mediaTypes = mediaTypesParam.split(",").map((t) => t.trim());

	// Load albums and phones from each project
	for (const projectName of projects) {
		for (const mediaType of mediaTypes) {
			try {
				const response = await fetch(
					`/api/media/projects/${projectName}/${mediaType}`
				);
				if (!response.ok) continue; // Skip if this media type doesn't exist

				const result = await response.json();

				if (result.data && typeof result.data === "object") {
					const subfolders = Object.keys(result.data).sort(
						(a, b) => parseInt(a) - parseInt(b)
					);

					subfolders.forEach((subfolder) => {
						const files = result.data[subfolder];
						const videoFile = files.find((file) =>
							file.url.toLowerCase().endsWith(".mp4")
						);

						if (videoFile) {
							const label = mediaType === "album" ? "Album" : "Phone";
							items.push({
								title: `${projectName} - ${label} ${subfolder}`,
								video_url: videoFile.url,
								subfolder: subfolder,
								projectName: projectName,
								mediaType: mediaType,
								sourceId: `${projectName}/${mediaType}/${subfolder}`,
							});
						}
					});
				}
			} catch (error) {
				console.warn(`Failed to load ${mediaType} from ${projectName}:`, error);
			}
		}
	}

	if (items.length === 0) {
		throw new Error("No album or phone videos found in any project");
	}

	console.log(
		`Loaded ${items.length} items (albums + phones) from ${projects.length} projects`
	);
	return items;
}
