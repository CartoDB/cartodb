# Static Maps

Static views of CartoDB maps can be generated using the [Static Maps API](/cartodb-platform/maps-api/static-maps-api/) within CartoDB.js. The map's style, including the zoom and bounding box, follows from what was set in the `viz.json` file, but you can change the zoom, center, and size of your image with a few lines of code. You can also change your basemap Images can be placed in specified DOM elements on your page, or you can generate a URL for the image.

## Quick Start

The easiest way to generate an image is by using the following piece of code, which generates is replaced by an `img` tag once run in an HTML file:

```javascript
<script>
var vizjson_url = 'https://documentation.carto.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';

cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(4)
  .write({ class: "thumb", id: "AwesomeMap" });
</script>
```

#### Result

```html
<img id="AwesomeMap" src="https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/center/04430594691ff84a3fdac56259e5180b:1419270587670/4/-3.4/44.2/600/400.png" class="thumb">
```

### cartodb.Image(_layerSource[, options]_)

#### Arguments

Name |Description
--- | ---
layerSource | can be either a `viz.json` object or a [layer source object](/cartodb-platform/cartodb-js/api-methods/#standard-layer-source-object-type-cartodb)

options | 
--- | ---
&#124;_ basemap | change the basemap specified in the layer definition. Type: Object defining base map properties (see example below).
&#124;_ no_cdn | Disable CDN usage. Type: Boolean. Default: `false` (use CDN)
&#124;_ override_bbox | Override default of using the bounding box of the visualization. This is needed to use `Image.center` and `Image.zoom`. Type: Boolean. Default: `false` (use bounding box)

#### Returns

An `Image` object

#### Example

```javascript
<script>
var vizjson_url = 'https://documentation.carto.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';
var basemap = {
  type: "http",
  options: {
    urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"]
  }
};

cartodb.Image(vizjson_url, {basemap: basemap})
  .size(600, 400)
  .center([0,0])
  .write({ class: "thumb", id: "AwesomeMap" });
</script>
```

---

## cartodb.Image

### Image.size(_width, height_)

Sets the size of the image.

#### Arguments

Name |Description
--- | ---
width | the width of the resulting image in pixels
height | the height of the resulting image in pixels

#### Returns

An `Image` object

### Image.center(_latLng_)

Sets the center of the map.

#### Arguments

Name |Description
--- | ---
latLng | an array of the latitude and longitude of the center of the map. Example: `[40.4378271, -3.6795367]`

#### Returns

An `Image` object

### Image.zoom(_zoomLevel_)

Sets the zoom level of the static map. Must be used with the option `override_bbox: true` if not using `Image.center` or `Image.bbox`.

#### Arguments

Name |Description
--- | ---
zoomLevel | the zoom of the resulting static map. `zoomLevel` must be an integer in the range [0,24].

#### Returns

An `Image` object

### Image.bbox(_boundingBox_)

If you set `bbox`, `center` and `zoom` will be overridden.

#### Arguments

Name |Description
--- | ---
boundingBox | an array of coordinates making up the bounding box for your map. `boundingBox` takes the form: `[sw_lat, sw_lon, ne_lat, ne_lon]`.

#### Returns

An `Image` object

### Image.into(_HTMLImageElement_)

Inserts the image into the HTML DOM element specified.

#### Arguments

Name |Description
--- | ---
HTMLImageElement | the DOM element where your image is to be located.

#### Returns

An `Image` object

#### Example

```javascript
cartodb.Image(vizjson_url).into(document.getElementById('map_preview'))
```

### Image.write(_attributes_)

Adds an `img` tag in the same place script is executed. It's possible to specify a class name (`class`) and/or an id attribute (`id`) for the resulting image:

#### Arguments

Name |Description
--- | ---
class | the DOM class applied to the resulting `img` tag.
id | the DOM id applied to the resulting `img` tag.
src | path to a temporary image that acts as a placeholder while the static map is retrieved.

#### Returns

An `Image` object

#### Example

```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(10)
  .write({ class: "thumb", id: "ImageHeader", src: 'spinner.gif' });
</script>
```

### Image.getUrl(_callback(err, url)_)

Gets the URL for the image requested.

#### Callback Arguments

Name |Description
--- | ---
err | error associated with the image request, if any.
url | URL of the generated image.

#### Returns

An `Image` object

#### Example

```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .getUrl(function(err, url) {
    console.log('image url',url);
  })
</script>
```

### Image.format(_format_)

Gets the URL for the image requested.

#### Arguments

Name |Description
--- | ---
format | image format of resulting image. One of `png` (default) or `jpg` (which have a quality of 85 dpi)

#### Returns

An `Image` object
