# URL Parameters Reference

You can now control what media plays directly from the URL!

## Basic Format

```
http://localhost:3000/?[parameters]
```

## Parameters

### `type` - Player Type
- **Values**: `pngSequence` (default) | `video`
- **Example**: `?type=pngSequence`

### `master` - Master Device Flag
- **Values**: `true` | `false` (default)
- **Example**: `?master=true`
- **Use**: Set to `true` for the device with audio (won't be time-corrected)

### `project` - Project Name
- **Values**: Any project folder name (e.g., `test-cavalry-project`)
- **Example**: `?project=test-cavalry-project`

### `media` - Media Type
- **Values**: `poster` | `phone` | `billboard` | `album/1` | `album/2` | `album/3`
- **Example**: `?media=poster`
- **Note**: Requires `project` parameter

### `source` - Combined Source
- **Values**: `{project}/{media}` (e.g., `test-cavalry-project/poster`)
- **Example**: `?source=test-cavalry-project/poster`
- **Note**: Alternative to using `project` + `media` separately

---

## Examples

### Display Poster from Project
```
http://localhost:3000/?type=pngSequence&project=test-cavalry-project&media=poster
```

### Display Phone View
```
http://localhost:3000/?type=pngSequence&project=test-cavalry-project&media=phone
```

### Display Billboard
```
http://localhost:3000/?type=pngSequence&project=test-cavalry-project&media=billboard
```

### Display Album Subfolder 1
```
http://localhost:3000/?type=pngSequence&project=test-cavalry-project&media=album/1
```

### Using Combined Source Parameter
```
http://localhost:3000/?type=pngSequence&source=test-cavalry-project/poster
```

### Master Device with Audio (Poster)
```
http://localhost:3000/?type=pngSequence&source=test-cavalry-project/poster&master=true
```

### Slave Device (Phone)
```
http://localhost:3000/?type=pngSequence&source=test-cavalry-project/phone
```

---

## Priority Rules

1. If `source` is provided, it overrides `project` and `media`
2. If only `project` is provided, defaults to `poster`
3. If no parameters, waits for server to send source

---

## Typical Setup

### Master Device (with audio)
```
http://localhost:3000/?master=true&source=test-cavalry-project/poster
```

### Slave Device 1 (poster)
```
http://localhost:3000/?source=test-cavalry-project/poster
```

### Slave Device 2 (phone)
```
http://localhost:3000/?source=test-cavalry-project/phone
```

### Slave Device 3 (billboard)
```
http://localhost:3000/?source=test-cavalry-project/billboard
```

### Command Panel (control all devices)
```
http://localhost:3000/command.html
```

---

## How It Works

### Priority System

1. **URL Source** (highest priority on load)
   - If you specify a source in the URL, it will be used instead of the server default
   - The initial server source is ignored if you have a URL source

2. **Server Default Source**
   - Used only if no URL source is provided
   - Automatically set to the first available media type from the first project

3. **Command Panel Changes**
   - Changes from `command.html` override everything
   - All clients (including those with URL sources) will switch to the new source

### Example Behavior

```
Device A: http://localhost:3000/?source=test-cavalry-project/poster
Device B: http://localhost:3000/?source=test-cavalry-project/phone
Device C: http://localhost:3000/  (no URL params)
```

- Device A plays: **poster** (from URL)
- Device B plays: **phone** (from URL)
- Device C plays: **poster** (server default: test-cavalry-project/poster)

If you then select "billboard" from the command panel:
- Device A switches to: **billboard** ✓
- Device B switches to: **billboard** ✓
- Device C switches to: **billboard** ✓

---

## Notes

- Default type is now `pngSequence` (was `video` before)
- All parameters are optional
- Parameters are case-sensitive
- Use `&` to combine multiple parameters
- Media loads instantly with lazy loading (no preload delay!)
- URL parameters set initial media, command panel can override at any time

