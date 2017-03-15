# prj-b71-vr

## Overview

This is an interactive demo of a sprite landscape rendering technique used on [Bear71](https://bear71vr.nfb.ca/).

### Technique overview

To render an image map as an interactive field of sprites, we designed a point cloud tile system that turns each pixel of our map into a sprite. 

You can take a look at the map data in app/assets/images/map.png

For each pixel in our map, we use the red channel to depict height, and the green channel to depict the sprite index. Each green value divided by 8 is the index on our spritesheet image. For our specific look, we also organized our sprites from smallest to largest so that we can use the index as the size as well, to reduce on overdraw on sprites with lots of empty space.

You can see the original colored map in app/assets/images/map-legend-aesthetic.png

The process of creating map.png is more art than science, so no specific tool will aid in this process. For our purposes, to create the green channel of map.png, we saved map-legend-aesthetic.png as a 32 color palette png and manually (painstakingly) created a new palette to replace the colors with the correct shades of gray that correlate with the correct index in spritesheet.png.

Our spritesheet has 32 slots in it, which we didn't fully use. The unused slots are represented as red waffles. You can experiment with the look by trying different versions of the spritesheet, like assets/images/spritesheet-3d.png.

## Setup

For development;

- `npm@3.8.9`
- `Node@6.2.x`
- OSX/Linux preferred, but not essential
- install [git lfs](https://git-lfs.github.com/) before cloning

Clone & install:

```sh
git clone https://github.com/nfbinteractive/Bear71VR_OpenSource.git
cd Bear71VR_OpenSource
npm install
```

Now run the app:

```sh
npm start
```

And open `localhost:9966`.

###### :warning: Module Format

We use ES2015 features with Babel, but we are sticking with CommonJS `require()` and `module.exports` to avoid issues with module inter-op and source transforms like `glslify`.

## License

MIT, see [LICENSE.md](http://github.com/nfbinteractive/Bear71VR_OpenSource/blob/master/LICENSE.md) for details.
