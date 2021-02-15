# Iconify Packager

"iconify-packager" is a module that allows you to generate a custom .json bundle for [iconify](https://iconify.design).

### Installation

To install, run
```
    npm install -g iconify-packager
```
or
```
    yarn add global iconify-packager
```

### Usage
```
    iconify-packager -d <directory> -o <output filename> -p <pack name>
```
**directory**: The input directory that contains svg files, default to current path

**output**: The output filename, default to pack.json

(required) **pack** the icon's pack name

### Roadmap

Those are the features that I want to implement for sure in the near future:

- Disable optimization/position reset/color uniform for a batch operation
-  Customize color export for each icon
- Add visual feedback about each export phase
- Convert svg images from a urls list instead of local folder

### License
The content of this repository is under GPLv3
