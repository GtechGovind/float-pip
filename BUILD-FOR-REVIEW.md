# Reproduce the Firefox package

The executable extension code is plain readable JavaScript/HTML/CSS under `extension/`. No JavaScript is transpiled, concatenated or minified. The packaging script generates manifests and original PNG icons, and copies the readable source into each browser package.

## Environment

- Verified on macOS with Python 3.9.6.
- Python 3.9 or later, standard library only. No pip packages or network downloads are required.
- The build uses pathlib and zipfile and can also run on Linux or Windows with Python installed from https://www.python.org/downloads/ .
- Node 18+ is needed only to run the optional JavaScript tests, not to build the extension. No npm install is required for the build.

## Steps

1. Extract this source archive.
2. Open a terminal in the `float-pip-source` folder containing `tools/build.py`.
3. Run `python3 tools/build.py` (on Windows, `py -3 tools/build.py`).
4. The Firefox submission package is produced in `dist/float-pip-firefox-1.0.0.zip`.
5. Inspect `dist/packages/firefox/manifest.json` and the copied readable JS/HTML/CSS there. The ZIP contains that directory with manifest.json at its root.

The build generates Chrome and Edge archives too; review the Firefox archive. It sets the fixed Gecko ID, Firefox 140 desktop minimum and no-data declaration. The selected AMO target is desktop Firefox only; Android is not selected.

To run unit checks (optional): `node --test tests/*.test.cjs`, then `python3 -m unittest discover -s tests -p 'test_*.py' -v` after building.

No external executable code or runtime service is used. Artwork under `store-assets/` is for store listings; it is not packaged into the installed extension. The same locally authored source and packaging script produced the submitted archive.
