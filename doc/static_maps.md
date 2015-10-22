# Static Maps

Static views of CartoDB maps can be generated using the [Static Maps API](http://docs.cartodb.com/cartodb-platform/maps-api.html#static-maps-api) within CartoDB.js. The map's style, including the zoom and bounding box, follows from what was set in the viz.json file, but you can change the zoom, center, and size of your image with a few lines of code. You can also change your basemap Images can be placed in specified DOM elements on your page, or you can generate a URL for the image.

## Quick Start

The easiest way to generate an image is by using the following piece of code, which generates is replaced by an `img` tag once run in an HTML file:

```javascript
<script>
var vizjson_url = 'https://documentation.cartodb.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';

cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(4)
  .write({ class: "thumb", id: "AwesomeMap" });
</script>
```

### Result
```html
<img id="AwesomeMap" src="https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/center/04430594691ff84a3fdac56259e5180b:1419270587670/4/-3.4/44.2/600/400.png" class="thumb">
```

### cartodb.Image(_layerSource_[, options])

#### Arguments

- **layerSource**: can be either a viz.json object or a [layer source object](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#standard-layer-source-object-type-cartodb)

#### Options

Options take the form of a JavaScript object.

- **options**:
    - **basemap**: change the basemap specified in the layer definition. Type: Object defining base map properties (see example below).
    - **no_cdn**: Disable CDN usage. Type: Boolean. Default: `false` (use CDN)
    - **override_bbox**: Override default of using the bounding box of the visualization. This is needed to use `Image.center` and `Image.zoom`. Type: Boolean. Default: `false` (use bounding box)

```javascript
<script>
var vizjson_url = 'https://documentation.cartodb.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';
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

#### Returns
An _Image_ object

## cartodb.Image

### Image.size(_width_,_height_)

Sets the size of the image.

#### Arguments

- **width**: the width of the resulting image in pixels
- **height**: the height of the resulting image in pixels

#### Returns
An _Image_ object

### Image.center(_latLng_)

Sets the center of the map.

#### Arguments

- **latLng**: an array of the latitude and longitude of the center of the map. Example: `[40.4378271,-3.6795367]`

#### Returns

An _Image_ object

### Image.zoom(zoomLevel)

Sets the zoom level of the static map. Must be used with the option `override_bbox: true` if not using `Image.center` or `Image.bbox`.

#### Arguments

- **zoomLevel**: the zoom of the resulting static map. `zoomLevel` must be an integer in the range [0,24].

#### Returns

An _Image_ object

### Image.bbox(_boundingBox_)

If you set `bbox`, `center` and `zoom` will be overridden.

#### Arguments

- **boundingBox**: an array of coordinates making up the bounding box for your map. `boundingBox` takes the form: `[sw_lat, sw_lon, ne_lat, ne_lon]`.

#### Returns

An _Image_ object

### Image.into(HTMLImageElement)

Inserts the image into the HTML DOM element specified.

#### Arguments

- **HTMLImageElement**: the DOM element where your image is to be located.

#### Returns

An _Image_ object

<div class="image-into">Image.into</div>
```javascript
cartodb.Image(vizjson_url).into(document.getElementById('map_preview'))
```

### Image.write(_attributes_)

Adds an `img` tag in the same place script is executed. It's possible to specify a class name (`class`) and/or an id attribute (`id`) for the resulting image:

<div class="image-write">Image.write</div>
```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(10)
  .write({ class: "thumb", id: "ImageHeader", src: 'spinner.gif' });
</script>
```

#### Arguments

- **attributes**:
    + **class**: the DOM class applied to the resulting `img` tag
    + **id**: the DOM id applied to the resulting `img` tag
    + **src**: path to a temporary image that acts as a placeholder while the static map is retrieved

#### Returns

An _Image_ object


### Image.getUrl(_callback(err, url)_)

Gets the URL for the image requested.

<div class="image-geturl">Image.getUrl</div>
```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .getUrl(function(err, url) {
      console.log('image url',url);
  })
</script>
```

#### Callback Arguments

- **err**: error associated with the image request, if any
- **url**: URL of the generated image

#### Returns

An _Image_ object

### Image.format(_format_)

Gets the URL for the image requested.

#### Argument

- **format**: image format of resulting image. One of `png` (default) or `jpg` (which have a quality of 85 dpi)

#### Returns

An _Image_ object
