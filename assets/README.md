# assets

Place the app logo here as:

    assets/herrhythm-logo.png

The header (`index.html`) references this path. Until the file exists, the app
falls back to the text wordmark automatically.

Recommendations:
- Use a **transparent-background PNG** (or SVG named `herrhythm-logo.png`/`.svg`
  — update the `src` in `index.html` if you use `.svg`). The version shared in
  chat has a solid black background, which looks correct on the dark theme but
  shows as a black box on the light theme.
- A wide/cropped export (just the mark + wordmark, minimal padding) sits best in
  the header.
