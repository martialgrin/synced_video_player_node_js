# Multi-Device Setup Guide

## Concept

Set up multiple devices where each device shows a **different view** (poster, phone, billboard) of the **same project**. The project is selected centrally from the command panel.

---

## Setup Method

### Device URLs

Each device specifies ONLY its **media type** in the URL:

```
Device 1 (Poster):    http://localhost:3000/?media=poster
Device 2 (Phone):     http://localhost:3000/?media=phone
Device 3 (Billboard): http://localhost:3000/?media=billboard
Device 4 (Album 1):   http://localhost:3000/?media=album/1
Device 5 (Album 2):   http://localhost:3000/?media=album/2
```

### Command Panel

Control all devices from:
```
http://localhost:3000/command.html
```

---

## How It Works

### 1. Each Device Loads
- Specifies media type in URL: `?media=phone`
- Waits for project from server/command panel
- Maintains its media type preference

### 2. Command Panel Selects Project
- Choose project (e.g., `test-cavalry-project`)
- Choose any media type for preview

### 3. All Devices Update
- Server broadcasts: `test-cavalry-project/poster`
- Each device extracts project: `test-cavalry-project`
- Each device combines with its media type:
  - Device 1: `test-cavalry-project/poster` ✓
  - Device 2: `test-cavalry-project/phone` ✓
  - Device 3: `test-cavalry-project/billboard` ✓
  - Device 4: `test-cavalry-project/album/1` ✓

---

## Example Workflow

### Step 1: Open Devices
```bash
# Device 1 - Poster Display
http://localhost:3000/?media=poster

# Device 2 - Phone Display
http://localhost:3000/?media=phone

# Device 3 - Billboard Display
http://localhost:3000/?media=billboard
```

### Step 2: Open Command Panel
```bash
http://localhost:3000/command.html
```

### Step 3: Select Project
- In command panel, click on `test-cavalry-project`
- Select any media type (doesn't matter, just selects the project)
- All devices update to show their respective views

### Step 4: Control Playback
- Click **Play** - all devices play synchronized
- Click **Pause** - all devices pause
- Click **Stop** - all devices stop

---

## Advanced: Master Device (with Audio)

If one device has audio and should be the timing reference:

```
http://localhost:3000/?media=poster&master=true
```

The master device:
- Plays audio
- Never gets time-corrected (important for smooth audio)
- Other devices sync to the master's timeline

---

## Media Types

| Type | Description | URL Parameter | Special Features |
|------|-------------|---------------|------------------|
| **Poster** | Main poster display | `?media=poster` | Visual only |
| **Phone** | Mobile/phone view | `?media=phone` | Visual only |
| **Billboard** | Large billboard display | `?media=billboard` | **🎵 Plays music automatically** |
| **Album 1** | Album subfolder 1 | `?media=album/1` | Visual only |
| **Album 2** | Album subfolder 2 | `?media=album/2` | Visual only |
| **Album 3** | Album subfolder 3 | `?media=album/3` | Visual only |

### 🎵 Billboard + Music

The **billboard** media type automatically:
1. Loads the billboard PNG sequence
2. Loads the music from `music/` folder
3. Plays both in sync when you hit play
4. Pauses/stops both together

**No configuration needed!** Just use `?media=billboard` and it handles everything.

---

## Full Setup Example

### Physical Setup
- **Screen 1** (Large): Poster view
- **Screen 2** (Vertical): Phone view
- **Screen 3** (Horizontal): Billboard view
- **Laptop**: Command panel

### URLs

**Screen 1:**
```
http://192.168.1.100:3000/?media=poster
```

**Screen 2:**
```
http://192.168.1.100:3000/?media=phone
```

**Screen 3:**
```
http://192.168.1.100:3000/?media=billboard
```

**Laptop (Command):**
```
http://192.168.1.100:3000/command.html
```

Replace `192.168.1.100` with your server's IP address.

---

## Tips

✅ **DO:**
- Use `?media=` for fixed view per device
- Control project selection from command panel
- Keep all devices on same network
- Use master flag for audio device

❌ **DON'T:**
- Don't use `?source=` with `?media=` (they conflict)
- Don't specify project in device URLs
- Don't open multiple command panels

---

## Troubleshooting

**Problem:** Device showing wrong view
- **Solution:** Check URL parameter `?media=phone` is correct

**Problem:** Devices not syncing
- **Solution:** Ensure all devices connected (check command panel)

**Problem:** Project not changing
- **Solution:** Make sure you selected a project from command panel

**Problem:** Audio stuttering on master device
- **Solution:** Add `&master=true` to URL

