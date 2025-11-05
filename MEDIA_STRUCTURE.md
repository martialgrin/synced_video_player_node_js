# Media Structure Documentation

## Overview

The media directory structure has been redesigned to support multiple projects with various media types including PNG sequences, music, and thumbnails.

## Directory Structure

```
videos/
├── [project_name]/
│   ├── poster/          (PNG sequence for poster display)
│   │   ├── 0000.png
│   │   ├── 0001.png
│   │   └── ...
│   ├── phone/           (PNG sequence for phone display)
│   │   ├── 0000.png
│   │   ├── 0001.png
│   │   └── ...
│   ├── music/           (MP3 audio files)
│   │   ├── track1.mp3
│   │   └── track2.mp3
│   ├── billboard/       (PNG sequence for billboard)
│   │   ├── 0000.png
│   │   ├── 0001.png
│   │   └── ...
│   ├── album/           (PNG sequence organized in subfolders)
│   │   ├── 1/
│   │   │   ├── 0000.png
│   │   │   └── ...
│   │   ├── 2/
│   │   │   ├── 0000.png
│   │   │   └── ...
│   │   └── 3/
│   │       ├── 0000.png
│   │       └── ...
│   └── thumb.png        (Project thumbnail - single image)
```

## Example

```
videos/
├── ProjectA/
│   ├── poster/
│   │   ├── 0000.png
│   │   ├── 0001.png
│   │   └── 0002.png
│   ├── phone/
│   │   ├── 0000.png
│   │   └── 0001.png
│   ├── music/
│   │   └── background.mp3
│   ├── billboard/
│   │   ├── 0000.png
│   │   └── 0001.png
│   ├── album/
│   │   ├── 1/
│   │   │   ├── 0000.png
│   │   │   └── 0001.png
│   │   ├── 2/
│   │   │   ├── 0000.png
│   │   │   └── 0001.png
│   │   └── 3/
│   │       ├── 0000.png
│   │       └── 0001.png
│   └── thumb.png
└── ProjectB/
    ├── poster/
    ├── phone/
    ├── music/
    ├── billboard/
    ├── album/
    └── thumb.png
```

## API Endpoints

### Get All Media
```
GET /api/media
```
Returns the complete media catalog with summary.

### Get All Projects
```
GET /api/media/projects
```
Returns list of all project names.

### Get Specific Project
```
GET /api/media/projects/:projectName
```
Returns all media for a specific project.

Example: `/api/media/projects/ProjectA`

### Get All Thumbnails
```
GET /api/media/thumbnails
```
Returns all project thumbnails.

### Get Specific Media Type
```
GET /api/media/projects/:projectName/:mediaType
```
Returns specific media type for a project.

Valid media types: `poster`, `phone`, `music`, `billboard`, `album`, `thumb`

Example: `/api/media/projects/ProjectA/poster`

## Direct File Access

Files are served directly via static routes:

```
/media/{projectName}/poster/{filename}
/media/{projectName}/phone/{filename}
/media/{projectName}/music/{filename}
/media/{projectName}/billboard/{filename}
/media/{projectName}/album/{subfolder}/{filename}
/media/{projectName}/thumb.png
```

## Command Panel

The command panel at `/command.html` displays:

- **Connected Devices**: Real-time list of all connected clients
- **Projects Grid**: Visual grid of all projects with:
  - Thumbnails (if available)
  - Project name
  - Media type badges (Poster, Phone, Music, Billboard, Album)
  - Click to select a project

## Features

- **Automatic Scanning**: Media directory is scanned on server startup
- **Dynamic Loading**: New projects can be added without code changes
- **Organized Structure**: Clear separation of media types
- **Thumbnail Support**: Visual preview of projects in command panel
- **PNG Sequences**: Sorted automatically for correct playback order
- **Album Subfolders**: Support for multiple album variations (1, 2, 3, etc.)

## Notes

- PNG files are automatically sorted alphabetically (0000.png, 0001.png, etc.)
- Album subfolders are sorted numerically (1, 2, 3, etc.)
- All media types are optional - projects can have any combination
- Thumbnails (thumb.png) are optional but recommended for better UX

