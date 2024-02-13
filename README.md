## build

### archive

```bash
chmod +x ./build_scripts/build.sh
./build_scripts/build.sh
```

Browse [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) and load `web-ext-artifacts/ark-cms-broweser-ext.zip`


### web-ext

```bash
npm install --global web-ext
# web-ext --version
```

```bash
web-ext run
```

```bash
web-ext lint
```

```bash
# web-ext build
# web-ext build --verbose
web-ext --config=my-config.js build
```