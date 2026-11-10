The profile card source is `concepts/mercury-card.html`. GitHub displays its exported animated WebP because profile READMEs cannot run WebGL.

To regenerate the animation, install Node.js, Chrome, and the WebP command-line tools (`img2webp`), then run:

```sh
npm ci
npm run export:card
```

Set `CHROME_PATH` if Chrome is installed somewhere other than `/usr/bin/google-chrome`. The exporter saves PNG frames under `/tmp/yatinkare-mercury-frames` and writes the final animation and still image into `assets/`.

The contact links live in `README.md` as well as the source card so they remain clickable on GitHub.
