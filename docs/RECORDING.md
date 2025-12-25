# Recording Demos for Knutpunkt

This guide explains how to create demo recordings for the project documentation.

## Prerequisites

### For Terminal Recordings (MCP Demo)

Install VHS:
```bash
brew install vhs
```

### For Browser Recordings (UI Demo)

Install Kap (macOS):
```bash
brew install --cask kap
```

Or use an alternative:
- **Windows**: [ScreenToGif](https://www.screentogif.com/)
- **Linux**: [Peek](https://github.com/phw/peek)
- **Cross-platform**: [OBS Studio](https://obsproject.com/)

## Recording the MCP Demo

The MCP demo shows Claude Code interacting with the Knutpunkt task board.

### Option 1: Using the VHS Script (Simulated)

```bash
# Generate the GIF from the script
vhs docs/demo-mcp.tape

# Output will be at docs/images/demo-mcp.gif
```

### Option 2: Real Recording with asciinema

For a real recording showing actual Claude Code interaction:

```bash
# 1. Ensure backend is running
./start.sh

# 2. Start recording
asciinema rec docs/demo-mcp.cast

# 3. In the recording, demonstrate:
#    - Launch Claude Code
#    - List tasks
#    - Claim a task
#    - Create a task
#    - Exit Claude Code

# 4. Stop recording (Ctrl+D or exit)

# 5. Convert to GIF
agg --theme mocha docs/demo-mcp.cast docs/images/demo-mcp.gif
```

## Recording the Browser UI Demo

### Preparation

1. **Start the application**:
   ```bash
   ./start.sh
   ```

2. **Open browser** at http://127.0.0.1:8080

3. **Prepare sample tasks**:
   - Have 2-3 tasks in each column
   - Use realistic task names
   - Set different priorities and categories

4. **Clean up the UI**:
   - Close browser dev tools
   - Hide bookmarks bar (Cmd+Shift+B)
   - Zoom to 100%
   - Use a clean browser profile (no extensions visible)

### Recording Flow

Record these separate GIFs (keep each under 30 seconds):

#### 1. Creating a Task (`demo-create-task.gif`)
- Click the + button
- Fill in title: "Add user authentication"
- Write description in Markdown
- Set priority to "high"
- Add category "feature"
- Click "Create Task"
- Show task appears in Planned column

#### 2. Drag and Drop (`demo-drag-drop.gif`)
- Grab a task from Planned
- Drag to Ongoing
- Show smooth animation
- Drag another task within same column to reorder
- Show the order changes

#### 3. Editing with Markdown (`demo-markdown-editor.gif`)
- Click edit on a task
- Show the Markdown editor
- Add some formatting (headers, lists, checkboxes)
- Show live preview
- Save changes

#### 4. VIM Mode (Optional) (`demo-vim-mode.gif`)
- Open settings
- Enable VIM mode
- Edit a task
- Show VIM mode indicator
- Demonstrate INSERT and NORMAL modes
- Save and close

### Recording Settings (Kap)

- **FPS**: 30
- **Resolution**: 1280x720 or 1920x1080
- **Format**: GIF
- **Quality**: High (but optimize for file size)
- **Highlight clicks**: Optional (can help viewers follow along)

### Post-Processing

**Optimize GIF size**:
```bash
# Using gifsicle
brew install gifsicle
gifsicle -O3 --colors 256 -o optimized.gif original.gif

# Using ImageMagick
brew install imagemagick
convert original.gif -fuzz 10% -layers Optimize optimized.gif
```

**Target file sizes**:
- Each GIF should be under 5MB for fast loading
- Aim for 2-3MB if possible
- Use lower FPS (15-20) if needed to reduce size

## Adding to README

Once you have the GIFs, add them to the README:

```markdown
## Demo

### Browser UI

**Creating and managing tasks**
![Creating a task](docs/images/demo-create-task.gif)

**Drag and drop**
![Drag and drop between columns](docs/images/demo-drag-drop.gif)

**Markdown editing**
![Built-in Markdown editor](docs/images/demo-markdown-editor.gif)

### MCP Integration

**Working with tasks via Claude Code**
![MCP server interaction](docs/images/demo-mcp.gif)
```

## Tips for Great Recordings

1. **Slow down**: Move cursor deliberately, pause briefly after actions
2. **Be clean**: Hide desktop clutter, use a plain wallpaper
3. **Focus**: Show only what's necessary, crop tight
4. **Consistency**: Use same theme/settings for all recordings
5. **Test**: Record a practice run first
6. **Retry**: Don't hesitate to re-record if something goes wrong

## Troubleshooting

### VHS Issues

**Script runs too fast**:
- Increase `Sleep` durations
- Adjust `PlaybackSpeed` to < 1.0

**Terminal looks wrong**:
- Try different themes: `Set Theme "Dracula"`, `"GitHub Dark"`, etc.
- Adjust `FontSize` and dimensions (`Width`, `Height`)

**GIF too large**:
- Reduce `Width` and `Height`
- Lower `TypingSpeed` to make recording shorter
- Use fewer sleep pauses

### Kap Issues

**GIF too large**:
- Lower FPS to 15-20
- Reduce resolution
- Trim unnecessary frames
- Use built-in optimization

**Choppy recording**:
- Close other applications
- Increase FPS to 30
- Record smaller area

## File Locations

After recording, ensure files are in:
```
docs/images/
├── demo-mcp.gif          # MCP/terminal demo
├── demo-create-task.gif  # Creating a task
├── demo-drag-drop.gif    # Drag and drop
└── demo-markdown-editor.gif  # Markdown editing
```
