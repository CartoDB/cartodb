## CartoCSS Properties

Each CartoCSS map category has its own configurable properties. You can apply multiple symbolizers and properties to the same map layer. Navigate to a selected symbolizer to view a description of the CartoCSS property, sample CartoCSS code, the default value, and the available values. 

**Warning:** CARTO is currently maintaining this library of CartoCSS properties and values. This content was adapted from the open source material provided by [Mapbox](https://github.com/mapbox/carto/blob/master/docs/latest.md), who has ceased active development of CartoCSS documentation.

#### CartoCSS Symbolizer

[Polygon](#polygon) (polygon) | [Line](#line) (lines and polygons)| [Markers](#markers) (points, lines, and polygons)
[Shield](#shield) (points and lines) | [Line Pattern](#line-pattern) (lines and polygons) | [Polygon Pattern](#polygon-pattern) (polygons) 
[Raster](#raster) (grid data layers) | [Point](#point) (points) | [Text](#text) (points, lines, and polygons)
[Building](#building) | |

#### CartoCSS Values

[Color](#color) | [Float](#float) | [URI](#uri)
[String](#string) | [Boolean](#boolean) | [Expression](#expression)
[Numbers](#numbers) | [Percentages](#percentages) | [Functions](#functions)

#### Other CartoCSS Parameters

[Common Elements](#common-elements) | [Map Background and String Elements](#map-background-and-string-elements) | [Debug mode](#debug-mode-string)

In addition to customizing the look of your maps using CartoCSS, CARTO provides additional CartoCSS properties that you can apply to Torque style maps. For details, see [CartoCSS Properties for Torque Style Maps]({{ site.torque_docs }}/guides/cartocss/).

#### Torque CartoCSS Properties

[-torque-frame-count](#-torque-frame-count-number) | [-torque-animation-duration](#-torque-animation-duration-number) | [-torque-time-attribute](#-torque-time-attribute-string)
-[torque-aggregation-function]({#-torque-aggregation-function-keyword) | [-torque-resolution](#-torque-resolution-float) | [-torque-data-aggregation](#-torque-data-aggregation-keyword)


### Common Elements

These common element CartoCSS properties can be applied to any feature layer in a map. A feature layer is any data layer that contains points, lines, or polygons (not a basemap). 

[comp-op](#comp-op-keyword) | [image-filters](#image-filters-function) | [opacity float](#opacity-float)

#### comp-op `keyword`

Description | The composite operation define how a layer behaves, relative to the layers around it. For example, you can style the way colors of overlapping markers interact.
Sample CartoCSS Code | `comp-op: src-over;`
Default Value | `src-over`, adds the current layer on top of other layers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`
Related Example | See [CartoCSS Composite Operations](#cartocss-composite-operations) for a description of composite operation effects.

**Note:** The `comp-op` value can be applied as an overall style effect, or it can be applied to the specific symbolizer property, depending on the color blending (or alpha blending) operation that you are trying to achieve. For details, see [Composite Operation Effects](#effects-of-composite-operations).

#### image-filters `function`

Description | A list of image filters that applies a defined style to the active rendering canvas.
Sample CartoCSS Code | `image-filters: functions(value, value, value);`
Default Value | `none`, no filters applied.
Available Values | See [functions](#functions).
Related Examples | You can add multiple image-filters to a layer, which creates a new active canvas and renders all of the defined styles, before compositing everything back into the main canvas. For example: `image-filters:colorize-alpha(blue, cyan, green, yellow , orange, red);`<br/><br/>Applying stack-blur can help with gradient rendering of the image, i.e, `image-filters: agg-stack-blur(#,#);`.**Note:** There is a known issue about how tile edges are appearing.

#### opacity `float`

Description | An alpha value for the style. This indicates that the alpha value is applied to all features in a separate buffer, then composited back to main buffer.
Sample CartoCSS Code | `opacity: 1;`
Default Value | `1`, no separate buffer is used and no alpha is applied to the style after rendering.
Available Values | See [float](#float).


### Map Background and String Elements

These generic CartoCSS background and string element properties can be applied to any layer in a map.

[background-image](#background-image-uri) | [background-image-comp-op](#background-image-comp-op-keyword) | [background-image-opacity](#background-image-opacity-float)
[buffer-size](#buffer-size-float) | | 

#### background-image `uri`

Description | An image that appears as the map background. This image appears underneath any other applied styles on the map.
Sample CartoCSS Code | `background-image: url(imageurl);`
Default Value | This parameter is not applied by default. The default background image is transparent.
Available Values | See [uri](#uri).

**Note:** The `background-image-uri` CartoCSS property is only supported when using the [Maps API]({{ site.baseurl }}/maps-api/) with [Carto.js]({{ site.baseurl }}/carto-js/), not with the CARTO Editor.

#### background-image-comp-op `keyword`

Description | Sets the compositing operation used to blend the image into the background.
Sample CartoCSS Code | `background-image-comp-op keyword`
Default Value | `src-over`, the background image is placed on top of any existing `background-image`.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

**Note:** The `background-image-comp-op` CartoCSS property is only supported when using the [Maps API]({{ site.baseurl }}/maps-api/) with [Carto.js]({{ site.baseurl }}/carto-js/), not with the CARTO Editor.

#### background-image-opacity `float`

Description | Sets the opacity of the image.
Sample CartoCSS Code | `background-image-opacity: 1;`
Default Value | `1`, indicates that the image opacity will not be changed when applied to the map background).
Available Values | See [float](#float).

_**Note:** The `background-image-opacity-float` CartoCSS property is only supported when using the [Maps API]({{ site.baseurl }}/maps-api/) with [Carto.js]({{ site.baseurl }}/carto-js/), not with the CARTO Editor._

#### buffer-size `float`

Description | Ensures that labels crossing tile boundaries are equally rendered in each tile.
Sample CartoCSS Code | `buffer-size: float;`
Default Value | `0`, no buffer is applied by default.
Available Values | See [float](#float).

**Note:** Enter any values in pixels and do not apply this property in combination with &quot;avoid-edges&quot;.

### Polygon

These CartoCSS properties can be applied to the fill and outline of a polygon layer.

[polygon-fill](#polygon-fill-color) | [polygon-opacity](#polygon-opacity-float) | [polygon-gamma](#polygon-gamma-float)
[polygon-gamma-method](#polygon-gamma-method-keyword) | [polygon-clip](#polygon-clip-boolean)| [polygon-simplify](#polygon-simplify-float)
[polygon-simplify-algorithm](#polygon-simplify-algorithm-keyword) | [polygon-smooth](#polygon-smooth-float) | [polygon-geometry-transform](#polygon-geometry-transform-functions)
[polygon-comp-op](#polygon-comp-op-keyword) | | 

#### polygon-fill `color`

Description | The fill color assigned to a polygon.
Sample CartoCSS Code | `polygon-fill: rgba(128, 128, 128, 1);`
Default Value | Gray (as indicated with the rgb color=128, 128, 128) and fully opaque (as indicated with alpha=1).
Available Values | See [color](#color).

#### polygon-opacity `float`

Description | The opacity of the polygon.
Sample CartoCSS Code | `polygon-opacity: 1;`
Default Value | `1`, indicates that the default opacity as opaque.
Available Values | See [float](#float).

#### polygon-gamma `float`

Description | The level of antialiasing (smoothness of oversampling) of polygon edges. A range of 0-5 represents the most antialiased to the least antialiased.
Sample CartoCSS Code | `polygon-gamma: 1; `
Default Value | `1`, fully antialiased, where polygons do not appear jagged. 
Available Values | `0`, `1`, `2`, `3`, `4`, `5`<br/><br/>**Tip:** If you notice that there are spaces between polygons on your map, enter anti-antialiased values, in increments closer to `0`.

#### polygon-gamma-method `keyword`

Description | An anti-grain geometry method that represents a 2D rendering library, specific to controlling the quality of antialiasing and used to calculate pixel gamma (pow(x,gamma), which produces slightly smoother line and polygon antialiasing than the &#x27;linear&#x27; method.
Sample CartoCSS Code | `polygon-gamma-method: power;`
Default Value | `power`
Available Values | `power` `linear` `none` `threshold` `multiply`

**Tip:** Mapnik uses this method in combination with the &#x27;gamma&#x27; value (which defaults to 1). These methods are documented in the the [AGG GitHub source](https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h).

#### polygon-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable polygon clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `polygon-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### polygon-simplify `float`

Description | Simplifies geometries by a given tolerance value.
Sample CartoCSS Code | `polygon-simplify: 0;`
Default Value | `0`, geometry is  not simplified.
Available Values | See [float](#float).

**Note:** The `polygon-simplify-float` CartoCSS property is only supported when using the [Maps API]({{ site.baseurl }}/maps-api/) with [carto.js]({{ site.baseurl }}/carto-js/), not with the CARTO Editor.

#### polygon-simplify-algorithm `keyword`

Description | Simplifies geometries by a given algorithm value.
Sample CartoCSS Code | `polygon-simplify-algorithm: radial-distance;`
Default Value | `radial-distance`, geometry is simplified using the radial distance algorithm.
Available Values | `radial-distance` `zhao-saalfeld` `visvalingam-whyatt`

#### polygon-smooth `float`

Description | Smooths out geometry angles.
Sample CartoCSS Code | `polygon-smooth: 0;`
Default Value | `0`, no smoothing is applied.
Available Values | `0`, `1`<br /><br />**Note:** `0` indicates no smoothing is applied. `1` indicates that it is fully smoothed. Values greater than `1` produce wild, looping geometries. It is suggested to use a range between 0-1 for this value.

#### polygon-geometry-transform `functions`

Description | Applies transformation functions to the geometry.
Sample CartoCSS Code | `polygon-geometry-transform: none;`
Default Value | `none`, geometry is not transformed.
Available Values | See [functions](#functions).

#### polygon-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `polygon-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

### Line

These CartoCSS properties can be applied to both line and polygon layers.

[line-color](#line-color-color) | [line-width](#line-width-float) | [line-opacity](#line-opacity-float)
[line-join](#line-join-keyword) | [line-cap](#line-cap-keyword) | [line-gamma](#line-gamma-float)
[line-gamma-method](#line-gamma-method-keyword) | [line-dasharray](#line-dasharray-numbers) | [line-dash-offset](#line-dash-offset-numbers)
[line-miterlimit](#line-miterlimit-float) | [line-clip](#line-clip-boolean) | [line-simplify](#line-simplify-float)
[line-simplify-algorithm](#line-simplify-algorithm-keyword) | [line-smooth](#line-smooth-float) | [line-offset](#line-offset-float)
[line-rasterizer](#line-rasterizer-keyword) | [line-geometry-transform](#line-geometry-transform-functions) | [line-comp-op](#line-comp-op-keyword)

#### line-color `color`

Description | The color of the drawn line.
Sample CartoCSS Code | `line-color: rgba(0,0,0,1);`
Default Value | Black (as indicated with the rgb color=0, 0, 0) and fully opaque (as indicated with alpha=1).
Available Values | See [color](#color).

#### line-width `float`

Description | The width of a line, in pixels.
Sample CartoCSS Code | `line-width: 1;`
Default Value | `1` pixel.
Available Values | See [float](#float).

#### line-opacity `float`

Description | The opacity of a line.
Sample CartoCSS Code | `line-opacity: 1;`
Default Value | `1`, the line is opaque.
Available Values | See [float](#float).

#### line-join `keyword`

Description | The behavior of lines when joined on a map.
Sample CartoCSS Code | `line-join: miter;`
Default Value | `miter`, joins the edges at the corners.
Available Values | `miter` `round` `bevel`

#### line-cap `keyword`

Description | The display of line endings.
Sample CartoCSS Code | `line-cap: butt;`
Default Value | `butt`, the ends of lines are squared off at the endpoints.
Available Values | `butt` `round` `square`

#### line-gamma `float`

Description | The level of antialiasing (smoothness of oversampling) of a stroke line.
Sample CartoCSS Code | `line-gamma: 1;`
Default Value | `1`, is fully antialiased.
Available Values | `0-1`. See [float](#float).

#### line-gamma-method `keyword`

Description | An anti-grain geometry method that represents a 2D rendering library, specific to controlling the quality of antialiasing and used to calculate pixel gamma (pow(x,gamma), which produces slightly smoother line and polygon antialiasing than the &#x27;linear&#x27; method.
Sample CartoCSS Code | `line-gamma-method: power;`
Default Value | `power`
Available Values | `power` `linear` `none` `threshold` `multiply`

**Tip:** Mapnik uses this method in combination with the &#x27;gamma&#x27; value (which defaults to 1). These methods are documented in the the [AGG GitHub source](https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h).

#### line-dasharray `numbers`

Description | A pair of length values [a,b], where (a) is the dash length and (b) is the gap length. You can enter more than two values for more complex patterns.
Sample CartoCSS Code | `line-dasharray: none;`
Default Value | `none`, a solid line appears.
Available Values | See [numbers](#numbers).

#### line-dash-offset `numbers`

Description | Sets the line dash pattern offset (pixel on, pixel off, pixel on, etc.) to create an animation display for the line.
Sample CartoCSS Code | `line-dash-offset: none;`
Default Value | `none`, a solid line appears.
Available Values | See [numbers](#numbers).

**Note:** This is a valid parameter for SVG but is currently not supported for rendering. For example, a value of `0` indicates that there is no line, a value of `1` displays a line. A line-dash-offset value of `0 1 0 1 0 1` displays the line offset pattern. You can change the value by one pixel `1 0 1 0 1 0` to change the offset of the line.

#### line-miterlimit `float`

Description | The limit on the ratio of the miter length to the stroke-width. This is used to automatically convert miter joins to bevel joins for sharp angles, to avoid the miter extending beyond the thickness of the stroking path. Typically, this property does not need to be set. However, if you have jaggy artifacts during rendering, defining a larger value for this property helps.
Sample CartoCSS Code | `line-miterlimit: 4;`
Default Value | `4`, auto-convert miters to bevel line joins when theta is less than 29 degrees as per the SVG definitions: &#x27;miterLength &#x2F; stroke-width = 1 &#x2F; sin ( theta &#x2F; 2 )&#x27;)
Available Values | See [float](#float).

**Note:** Define values as per [SVG transformation definitions](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)- which are values separated by whitespace and/or commas, from right to left.

#### line-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable line clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `line-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### line-simplify `float`

Description | Simplifies geometries by a given tolerance value.
Sample CartoCSS Code | `line-simplify: 0;`
Default Value | `0`, geometry is not simplified.
Available Values | See [float](#float).

**Note:** The `line-simplify-float` CartoCSS property is only supported when using the [Maps API]({{ site.mapsapi_docs }}/) with [CARTO.js]({{ site.cartojs_docs }}//), not with the CARTO Editor.

#### line-simplify-algorithm `keyword`

Description | Simplifies geometries by a given algorithm value.
Sample CartoCSS Code | `line-simplify-algorithm: radial-distance;`
Default Value | `radial-distance`, geometry is simplified using the radial distance algorithm.
Available Values | `radial-distance` `zhao-saalfeld` `visvalingam-whyatt`

**Note:** The `line-simplify-algorithm-keyword` CartoCSS property is only supported when using the [Maps API]({{ site.mapsapi_docs }}/) with [CARTO.js]({{ site.cartojs_docs }}/), not with the CARTO Editor.

#### line-smooth `float`

Description | Smooths out geometry angles.
Sample CartoCSS Code | `line-smooth: 0;`
Default Value | `0`, no smoothing is applied.
Available Values | `0` `1`<br /><br />**Note:** 0 indicates no smoothing is applied. 1 indicates that it is fully smoothed. Values greater than 1 produce wild, looping geometries. It is suggested to use a range between 0-1 for this value.

#### line-offset `float`

Description | Offsets a line parallel to its actual path, defined by a number in pixels. Positive values move the line left, negative values move it right (relative to the directionality of the line).
Sample CartoCSS Code | `line-offset: 0;`
Default Value | `0`, no offset is applied.
Available Values | See [float](#float).

#### line-rasterizer `keyword`

Description | Exposes an alternate AGG (Anti-Grain Geometry) rendering method that sacrifices some accuracy for speed.
Sample CartoCSS Code | `line-rasterizer: full;`
Default Value | `full`
Available Values | `full` `fast`

#### line-geometry-transform `functions`

Description | Applies transformation functions to the geometry.
Sample CartoCSS Code | `line-geometry-transform: none;`
Default Value | `none`, geometry is not transformed.
Available Values | See [functions](#functions).

#### line-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `line-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Markers

These CartoCSS properties can be applied to point, line and polygon layers.

[marker-file](#marker-file-uri) | [marker-opacity](#marker-opacity-float) | [marker-fill-opacity](#marker-fill-opacity-float)
[marker-line-color](#marker-line-color-color) | [marker-line-width](#marker-line-width-float) | [marker-line-opacity](#marker-line-opacity-float)
[marker-placement](#marker-placement-keyword) | [marker-multi-policy](#marker-multi-policy-keyword) | [marker-type](#marker-type-keyword)
[marker-width](#marker-width-expression) | [marker-height](#marker-height-expression) | [marker-fill](#marker-fill-color)
[marker-allow-overlap](#marker-allow-overlap-boolean) | [marker-ignore-placement](#marker-ignore-placement-boolean) | [marker-spacing](#marker-spacing-float)
[marker-max-error](#marker-max-error-float) | [marker-transform](#marker-transform-functions) | [marker-clip](#marker-clip-boolean)
[marker-smooth](#marker-smooth-float) | [marker-geometry-transform](#marker-geometry-transform-functions) | [marker-comp-op](#marker-comp-op-keyword)

#### marker-file `uri`

Description | Displays an SVG file at each marker placement. If no file is specified, an ellipse is shown for the marker.
Sample CartoCSS Code | `marker-file: url(http://www.clipartbest.com/cliparts/nTX/AGX/nTXAGXyTB.svg);`
Default Value | `none`, an ellipse appears if the width does not equal the height.<br /><br />**Note:** If the height is equal to the width, a circle appears.
Available Values | See [uri](#uri).

#### marker-opacity `float`

Description | Sets the overall opacity of the marker, overriding any opacity and fill-opacity settings.
Sample CartoCSS Code | `marker-opacity: 1;`
Default Value | `1`, the opacity and fill-opacity are applied.
Available Values | See [float](#float).

#### marker-fill-opacity `float`

Description | The fill opacity of the marker.
Sample CartoCSS Code | `marker-fill-opacity: 1;`
Default Value | `1`, the fill-opacity is opaque.<br /><br />**Tip:** If you want to apply opacity to the entire symbol, apply the `marker-opacity` property. Similarly, for a line, apply the `marker-line-opacity` property.
Available Values | See [float](#float).

#### marker-line-color `color`

Description | The color of the stroke around a marker shape.
Sample CartoCSS Code | `marker-line-color: black;`
Default Value | `black`
Available Values | See [color](#color).

#### marker-line-width `float`

Description | The width of the line around the marker, in pixels, centered on the edge. 
Sample CartoCSS Code | `marker-line-width: 2;`
Default Value | A defined pixel
Available Values | See [float](#float).
Related Example | The marker-line-width is positioned on the boundary, so high values can cover the area itself. For example, if you have a marker with a width (diameter) of `4`, and add a line width of `3`, 1.5 pixels of the line width appears on the inside of the edge, and covers the entire marker.

#### marker-line-opacity `float`

Description | The opacity of the marker line.
Sample CartoCSS Code | `marker-line-opacity: 1;`
Default Value | `1`, the line is opaque.
Available Values | See [float](#float).

#### marker-placement `keyword`

Description | Places markers on a point, in the center of a polygon, or on a line.
Sample CartoCSS Code | `marker-placement: point;`
Default Value | `point`, places markers at the center point (centroid) of the geometry.
Available Values | `point` `line` `interior`<br /><br />**Note:** If placing markers on a line, markers appear multiple times along a line. You can apply &#x27;interior&#x27; to ensure correct placement on a line. Points placed on polygons are forced to be inside the polygon interior.

**Tip:** See the note for how this property interacts with the [Marker-multi-policy](#marker-multi-policy-keyword).

#### marker-multi-policy `keyword`

Description | Enables you to control the rendering behavior for multi-geometries.
Sample CartoCSS Code | `marker-multi-policy: each;`
Default Value | `each`, all geometries display a marker.
Available Values | `each` `whole` `largest`
| whole - indicates that the aggregate centroid between all geometries is applied
| largest - indicates that only the largest (by bounding box areas) renders a marker (similar to default text labeling behavior)

**Note:** If the [marker-placement](#marker-placement-keyword) property is also applied and the value is either `point` or `interior`, a marker is rendered for each placement. If you specified `line` as the marker-placement value, this *marker-multi-policy* property is not applied and all geometries display a marker.

#### marker-type `keyword`

Description | Sets the default marker-type. If a SVG file is not defined with the [marker-file](#marker-file-uri) property, an arrow, ellipse, or circle (if height is equal to width) is rendered. 
Sample CartoCSS Code | `marker-type: ellipse;`
Default Value | `ellipse`
Available Values | `arrow` `ellipse`<br /><br />

**Note:** If the height is equal to the width, a circle appears.

#### marker-width `expression`

Description | If a default [marker-type](#marker-type-keyword) property is defined, this property indicates the width of the marker-type.
Sample CartoCSS Code | `marker-width: 10.0;`
Default Value | `10`
Available Values | See [expression](#expression).

#### marker-height `expression`

Description | If a default [marker-type](#marker-type-keyword) property is defined, this property indicates the height of the marker-type.
Sample CartoCSS Code | `marker-height: 10.0;`
Default Value | `10`
Available Values | See [expression](#expression)

#### marker-fill `color`

Description | The fill color of the marker.
Sample CartoCSS Code | `marker-fill: blue;`
Default Value | `blue`
Available Values | See [color](#color).

#### marker-allow-overlap `boolean`

Description | Shows or hides overlapping markers on a map.
Sample CartoCSS Code | `marker-allow-overlap: false;`
Default Value | `false`, does not allow markers to overlap. Overlapping markers are not rendered if there are conflicts. Overlapping markers may appear when you zoom in, if there is room for markers to display.
Available Values | See [boolean](#boolean).

#### marker-ignore-placement `boolean`

Description | Prevents other placement properties from being rendered.
Sample CartoCSS Code | `marker-ignore-placement: false;`
Default Value | `false`, does not store placement geometries in the collision detector cache of the bbox (bounding box)
Available Values | See [boolean](#boolean).

#### marker-spacing `float`

Description | The space between repeated markers, in pixels. If spacing is less than the marker size, or larger than the line segment length, no markers are displayed.
Sample CartoCSS Code | `marker-spacing: 100;`
Default Value | `100`
Available Values | See [float](#float).

#### marker-max-error `float`

Description | The maximum difference between the actual marker placement and the marker-spacing parameter.
Sample CartoCSS Code | `marker-max-error: 0.2;`
Default Value | `0.2`
Available Values | See [float](#float).

**Note:** Setting a high value can resolve placement conflicts with other symbolizers and improve rendering performance.

#### marker-transform `functions`

Description | Defines SVG transformation functions to scale how markers appear.
Sample CartoCSS Code | `marker-transform: scale (2,2);`
Default Value | no transformation applied by default.
Available Values | See [functions](#functions).

**Note:** Define values as per [SVG transformation definitions](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)- which are values separated by whitespace and/or commas, from right to left.

#### marker-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable line clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `marker-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### marker-smooth `float`

Description | Smooths out geometry angles.
Sample CartoCSS Code | `marker-smooth: float;`
Default Value | `0`, no smoothing is applied.
Available Values | See [float](#float).

**Note:** 0 indicates no smoothing is applied. 1 indicates that it is fully smoothed. Values greater than 1 produce wild, looping geometries. It is suggested to use a range between 0-1 for this value.

#### marker-geometry-transform `functions`

Description | Applies transformation functions to the geometry.
Sample CartoCSS Code | `marker-geometry-transform: none;`
Default Value | `none`, geometry is not transformed.
Available Values | See [functions](#functions).

#### marker-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `marker-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Shield

If you are displaying road shields on a map (for example, highway markers), these CartoCSS properties define the shield styling.

[shield-file](#shield-file-uri) | [shield-name](#shield-name-expression) | [shield-face-name](#shield-face-name-string)
[shield-unlock-image](#shield-unlock-image-boolean) | [shield-size](#shield-size-float) | [shield-fill](#shield-fill-color)
[shield-placement](#shield-placement-keyword) | [shield-avoid-edges](#shield-avoid-edges-boolean) | [shield-allow-overlap](#shield-allow-overlap-boolean)
[shield-min-distance](#shield-min-distance-float) | [shield-spacing](#shield-spacing-float) | [shield-min-padding](#shield-min-padding-float)
[shield-wrap-width](#shield-wrap-width-unsigned) | [shield-wrap-before](#shield-wrap-before-boolean) | [shield-wrap-character](#shield-wrap-character-string)
[shield-halo-fill](#shield-halo-fill-color) | [shield-halo-radius](#shield-halo-radius-float) | [shield-character-spacing](#shield-character-spacing-unsigned)
[shield-line-spacing](#shield-line-spacing-unsigned) | [shield-text-dx](#shield-text-dx-float) | [shield-text-dy](#shield-text-dy-float)
[shield-dx](#shield-dx-float) | [shield-dy](#shield-dy-float) | [shield-opacity](#shield-opacity-float)
[shield-text-opacity](#shield-text-opacity-float) | [shield-horizontal-alignment](#shield-horizontal-alignment-keyword) | [shield-vertical-alignment](#shield-vertical-alignment-keyword)
[shield-placement-type](#shield-placement-type-keyword) | [shield-placements](#shield-placements-string) | [shield-text-transform](#shield-text-transform-keyword)
[shield-justify-alignment](#shield-justify-alignment-keyword) | [shield-transform](#shield-transform-functions) | [shield-clip](#shield-clip-boolean)
[shield-comp-op](#shield-comp-op-keyword) | | 

#### shield-file `uri`

Description | The shield-file property is required before defining any shield styles. Define an image file to render the shield image.
Sample CartoCSS Code | `shield-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/username/assets/20150924175307shield2.png);`
Default Value | none
Available Values | See [uri](#uri).

#### shield-name `expression`

Description | The text name of a shield symbol on a map. Appears on top of the [shield-file](#shield-file-uri) image by default.
Sample CartoCSS Code | `shield-name: '[name_example]';`
Default Value | `undefined`
Available Values | See [expression](#expression). The expression value is a data column specified by using brackets, as shown in the sample code above.

**Note:** See [shield-unlock-image](#shield-unlock-image-boolean) to change how the shield-text appears relative to this shield-file image.

#### shield-face-name `string`

Description | The font name and style for the shield-name property.
Sample CartoCSS Code | `shield-face-name: ‘Open Sans Bold’;`
Default Value | `undefined`
Available Values | See [string](#string).

#### shield-unlock-image `boolean`

Description | Sets the text alignment of the [shield-name](#shield-name-expression) relative to the [shield-file](#sheild-file-uri). 
Sample CartoCSS Code | `shield-unlock-image: false;`
Default Value | `false`, the center of the shield-file image is the anchor for text positioning.
Available Values | See [boolean](#boolean).<br /><br />**Note:** If you are positioning text next to (as opposed to on top of a shield-file image), set the value to `true`.

#### shield-size `float`

Description | The size of the text for the shield-name property, in pixels.
Sample CartoCSS Code | `shield-size: 12;`
Default Value | `undefined`
Available Values | See [float](#float).

#### shield-fill `color`

Description | The fill color of the shield text.
Sample CartoCSS Code | `shield-fill: #e16363;`
Default Value | `undefined`
Available Values | See [color](#color).

#### shield-placement `keyword`

Description | Places shields on top of points, along multiple line places, on the vertexes of polygons, or in the interior inside a polygon.
Sample CartoCSS Code | `shield-placement: point;`
Default Value | `point`, the shield appears on the top of map points.
Available Values | `point` `line` `vertex` `interior`

#### shield-avoid-edges `boolean`

Description | Prevents shields from intersecting with tile boundaries. 
Sample CartoCSS Code | `shield-avoid-edges: false;`
Default Value | `false`, shields do not intersect.
Available Values | See [boolean](#boolean).

#### shield-allow-overlap `boolean`

Description | Controls how shields appear when overlapping with other elements on the map.
Sample CartoCSS Code | `shield-allow-overlap: false;`
Default Value | `false`, shields do not overlap with other map elements. Overlapping shields are hidden.
Available Values | See [boolean](#boolean).

#### shield-min-distance `float`

Description | The minimum distance between the next shield symbol. (This does not apply to multiple shields at one point).
Sample CartoCSS Code | `shield-min-distance: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-spacing `float`

Description | The space between repeated shields, in pixels, on a line. 
Sample CartoCSS Code | `shield-spacing: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-min-padding `float`

Description | The minimum distance, in pixels, that a shield is placed from the edge of a metatile (the tile/buffer space relationship).
Sample CartoCSS Code | `shield-min-padding: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-wrap-width `unsigned`

Description | The length of pixels that appears before the [shield-name](#shield-name-expression) text wraps.
Sample CartoCSS Code | `shield-wrap-width: 0;`
Default Value | `0`
Available Values | Unsigned integer

#### shield-wrap-before `boolean`

Description | Determines how the wrap-text behaves relative to the wrap-width.
Sample CartoCSS Code | `shield-wrap-before: false;`
Default Value | `false`, wrapped text appears longer than the wrap-width.
Available Values | See [boolean](#boolean).<br /><br />**Note:** If value is `true`, the text wraps before wrap-width is reached.

#### shield-wrap-character `string`

Description | Enables you to wrap text with a character, rather than with a space. This is especially useful for long text names.
Sample CartoCSS Code | `shield-wrap-character: '_';`
Default Value | `undefined`
Available Values | See [string](#string).

#### shield-halo-fill `color`

Description | Specifies the color of the halo around the text.
Sample CartoCSS Code | `shield-halo-fill: #FFFFFF;`
Default Value | `#FFFFFF`, the halo color is white by default
Available Values | See [color](#color).

#### shield-halo-radius `float`

Description | The radius of the halo, in pixels.
Sample CartoCSS Code | `shield-halo-radius: 0;`
Default Value | `0`, no halo is applied.
Available Values | See [float](#float).

#### shield-character-spacing `unsigned`

Description | The horizontal space, in pixels, between text characters.
Sample CartoCSS Code | `shield-character-spacing: unsigned;`
Default Value | `0`
Available Values | Unsigned integer.

**Note:** This property is not supported for line placement.

#### shield-line-spacing `unsigned`

Description | The vertical spacing, in pixels, between two lines of multiline labels.
Sample CartoCSS Code | `shield-line-spacing: none`
Default Value | `undefined`
Available Values | Unsigned integer

#### shield-text-dx `float`

Description | Places the shield text within a fixed range of pixels, +&#x2F;- along the X axis. A positive value shifts the text to the right.
Sample CartoCSS Code | `shield-text-dx: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-text-dy `float`

Description | Places the shield text within a fixed range of pixels, +&#x2F;- along the Y axis. A positive value shifts the text down.
Sample CartoCSS Code | `shield-text-dy: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-dx `float`

Description | Places the shield within in a fixed range of pixels, +&#x2F;- along the X axis. A positive value shifts the shield to the right.
Sample CartoCSS Code | `shield-dx: 150;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-dy `float`

Description | Places the shield within a fixed range of pixels, +&#x2F;- along the Y axis. A positive value shifts the shield down.
Sample CartoCSS Code | `shield-dy: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### shield-opacity `float`

Description | Sets the opacity of the [shield-file](#shield-file-uri) image.
Sample CartoCSS Code | `shield-opacity: 1;`
Default Value | `1`
Available Values | See [float](#float).

#### shield-text-opacity `float`

Description | The opacity of the text placed on top of the shield.
Sample CartoCSS Code | `shield-text-opacity: 1;`
Default Value | `1`
Available Values | See [float](#float).

#### shield-horizontal-alignment `keyword`

Description | The horizontal alignment of the shield from its center point.
Sample CartoCSS Code | `shield-horizontal-alignment auto;`
Default Value | `auto`
Available Values | `left` `middle` `right` `auto`

#### shield-vertical-alignment `keyword`

Description | The vertical alignment of the shield from its center point.
Sample CartoCSS Code | `shield-vertical-alignment: middle;'`
Default Value | `middle`
Available Values | `top` `middle` `bottom` `auto`

#### shield-placement-type `keyword`

Description | Enables you to reposition and resize the shield to avoid overlaps.
Sample CartoCSS Code | `shield-placement-type: dummy;`
Default Value | `dummy`, turns off and disables this feature.
Available Values | `dummy` `simple`<br /><br />**Note:** The `simple` value is the shield placement string used for basic algorithms.

#### shield-placements `string`

Description | If [shield-placement-type](#shield-placement-type-keyword) is set to `simple`, you can use this property to set the position of the shield placement.
Sample CartoCSS Code | `shield-placements: E,NE,SE,W,NW,SW;`
Default Value | none
Available Values | See [string](#string).

#### shield-text-transform `keyword`

Description | Identifies the text case of the shield-name.
Sample CartoCSS Code | `shield-text-transform: none;`
Default Value | `none`
Available Values | `none` `uppercase` `lowercase` `capitalize`

#### shield-justify-alignment `keyword`

Description | Defines how the shield-name text is aligned.
Sample CartoCSS Code | `shield-justify-alignment: auto;`
Default Value | `auto`
Available Values | `left` `center` `right` `auto`

#### shield-transform `functions`

Description | Defines SVG transformation functions to scale how shields appear.
Sample CartoCSS Code | `shield-transform: none;`
Default Value | none
Available Values | See [functions](#functions).<br /><br />**Note:** Define values as per [SVG transformation definitions](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)- which are values separated by whitespace and/or commas, from right to left.

#### shield-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `shield-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### shield-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `shield-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Line-Pattern

These CartoCSS pattern properties can be applied to both line and polygon elements on a map.

[line-pattern-file](#line-pattern-file-uri) | [line-pattern-clip](#line-pattern-clip-boolean) | [line-pattern-simplify](#line-pattern-simplify-float)
[line-pattern-simplify-algorithm](#line-pattern-simplify-algorithm-keyword) | [line-pattern-smooth](#line-pattern-smooth-float) | [line-pattern-offset](#line-pattern-offset-float)
[line-pattern-geometry-transform](#line-pattern-geometry-transform-functions) | [line-pattern-comp-op](#line-pattern-comp-op-keyword) | 

#### line-pattern-file `uri`

Description | A defined image file that renders the pattern of a line. The image repeats along the line.
Sample CartoCSS Code | `line-pattern-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/username/assets/20151005164516line-2.png);`
Default Value | none
Available Values | See [uri](#uri).

#### line-pattern-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable line pattern clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `line-pattern-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### line-pattern-simplify `float`

Description | Simplifies geometries by a given tolerance value.
Sample CartoCSS Code | `line-pattern-simplify: 0;`
Default Value | `0`, geometry is not simplified.
Available Values | See [float](#float).

#### line-pattern-simplify-algorithm `keyword`

Description | Simplifies geometries by a given algorithm value.
Sample CartoCSS Code | `line-pattern-simplify-algorithm: radial-distance;`
Default Value | `radial-distance`, geometry is simplified using the radial distance algorithm.
Available Values | `radial-distance` `zhao-saalfeld` `visvalingam-whyatt`

#### line-pattern-smooth `float`

Description | Smooths out geometry angles for line patterns.
Sample CartoCSS Code | `line-pattern-smooth: 0;`
Default Value | `0`,  no smoothing is applied.
Available Values | `0` `1`<br /><br />**Note:** 0 indicates no smoothing is applied. 1 indicates that it is fully smoothed. Values greater than 1 produce wild, looping geometries. It is suggested to use a range between 0-1 for this value.

#### line-pattern-offset `float`

Description | Offsets a line pattern parallel to its actual path, defined by a number in pixels. Positive values move the line pattern left, negative values move it right (relative to the directionality of the line pattern).
Sample CartoCSS Code | `line-pattern-offset: 0;`
Default Value | `0`,  no offset is applied.
Available Values | See [float](#float).

#### line-pattern-geometry-transform `functions`

Description | Applies transformation functions to the geometry.
Sample CartoCSS Code | `line-pattern-geometry-transform: none;`
Default Value | none, geometry is not transformed.
Available Values | See [functions](#functions).

#### line-pattern-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `line-pattern-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Polygon-Pattern

These CartoCSS pattern properties can be applied to both line and polygon elements on a map.

[polygon-pattern-file](#polygon-pattern-file-uri) | [polygon-pattern-alignment](#polygon-pattern-alignment-keyword) | [polygon-pattern-gamma](#polygon-pattern-gamma-float)
[polygon-pattern-opacity](#polygon-pattern-opacity-float) | [polygon-pattern-clip](#polygon-pattern-clip-boolean) | [polygon-pattern-simplify](#polygon-pattern-simplify-float)
[polygon-pattern-simplify-algorithm](#polygon-pattern-simplify-algorithm-keyword) | [polygon-pattern-smooth](#polygon-pattern-smooth-float) | [polygon-pattern-geometry-transform](#polygon-pattern-geometry-transform-functions)
[polygon-pattern-comp-op](#polygon-pattern-comp-op-keyword) | | 

#### polygon-pattern-file `uri`

Description | A defined image file that renders the pattern fill within a polygon.
Sample CartoCSS Code | `polygon-pattern-file:  url(http://com.cartodb.users-assets.production.s3.amazonaws.com/patterns/diagonal_1px_med.png);`
Default Value | none
Available Values | See [uri](#uri).

#### polygon-pattern-alignment `keyword`

Description | Specifies if the polygon-pattern-fill aligns with the map layer.
Sample CartoCSS Code | `polygon-pattern-alignment: local;`
Default Value | `local`
Available Values | `local` `global`

#### polygon-pattern-gamma `float`

Description | The level of antialiasing (smoothness of oversampling) of polygon pattern edges. A range of 0-5 represents the most antialiased to the least antialiased.
Sample CartoCSS Code | `polygon-pattern-gamma: 1;`
Default Value | `1`, is fully antialiased.
Available Values | `0` `1` `2` `3` `4` `5`

#### polygon-pattern-opacity `float`

Description | The opacity level of the polygon-pattern image.
Sample CartoCSS Code | `polygon-pattern-opacity: 1;`
Default Value | `1`, indicates that the default opacity as opaque.
Available Values | See [float](#float).

#### polygon-pattern-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable polygon-pattern-clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `polygon-pattern-clip: true;`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### polygon-pattern-simplify `float`

Description | Simplifies geometries by a given tolerance value.
Sample CartoCSS Code | `polygon-pattern-simplify: 0;`
Default Value | `0`, geometry is not simplified.
Available Values | See [float](#float).

#### polygon-pattern-simplify-algorithm `keyword`

Description | Simplifies geometries by a given algorithm value.
Sample CartoCSS Code | `polygon-pattern-simplify-algorithm: radial-distance;`
Default Value | `radial-distance`, geometry is simplified using the radial distance algorithm.
Available Values | `radial-distance` `zhao-saalfeld` `visvalingam-whyatt`

#### polygon-pattern-smooth `float`

Description | Smooths out geometry angles.
Sample CartoCSS Code | `polygon-pattern-smooth: 0;`
Default Value | `0`, no smoothing is applied.
Available Values | `0` `1`<br /><br />**Note:** 0 indicates no smoothing is applied. 1 indicates that it is fully smoothed. Values greater than 1 produce wild, looping geometries. It is suggested to use a range between 0-1 for this value.

#### polygon-pattern-geometry-transform `functions`

Description | Applies transformation functions to the geometry.
Sample CartoCSS Code | `polygon-pattern-geometry-transform: none;`
Default Value | `none`, geometry is not transformed.
Available Values | See [functions](#functions).

#### polygon-pattern-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `polygon-pattern-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Raster

These CartoCSS properties can be applied to raster (grid) data layers on a map.

[raster-opacity](#raster-opacity-float) | [raster-filter-factor](#raster-filter-factor-float) | [raster-scaling](#raster-scaling-keyword)
[raster-mesh-size](#raster-mesh-size-unsigned) | [raster-comp-op](#raster-comp-op-keyword) | [raster-colorizer-default-mode](#raster-colorizer-default-mode-keyword)
[raster-colorizer-default-color](#raster-colorizer-default-color-color) | [raster-colorizer-epsilon](#raster-colorizer-epsilon-float) | [raster-colorizer-stops](#raster-colorizer-stops-tags)

**Note:** Raster CartoCSS symbolizer properties are only supported when using the [Maps API]({{ site.baseurl }}/maps-api/) with [Carto.js]({{ site.baseurl }}/carto-js/), not with the CARTO Editor.

#### raster-opacity `float`

Description | The opacity of the raster symbolizer on top of other symbolizers.
Sample CartoCSS Code | `raster-opacity: 1;`
Default Value | `1`, the raster is opaque.
Available Values | See [float](#float).

#### raster-filter-factor `float`

Description | Sets the filter factor used for rendering the datasource of the raster. Used by the Raster or GDAL datasources to pre-downscale images using overviews. 
Sample CartoCSS Code | `raster-filter-factor: -1;`
Default Value | `-1`, allows the datasource to determine the appropriate downscaling option.
Available Values | See [float](#float).

**Note:** Higher numbers can improve the output of the scaled image, but may reduce the speed of downscaling.

#### raster-scaling `keyword`

Description | The algorithm applied to scale the resolution of the raster layer.
Sample CartoCSS Code | `raster-scaling: near;`
Default Value | `near`
Available Values | `near` `fast` `bilinear` `bilinear8` `bicubic` `spline16` `spline36` `hanning` `hamming` `hermite` `kaiser` `quadric` `catrom` `gaussian` `bessel` `mitchell` `sinc` `lanczos` `blackman`

**Note:** While the `lanczos` value may render the best quality, the `bilinear` value actually produces the best compromise between speed and accuracy.

#### raster-mesh-size `unsigned`

Description | Specifies a reduced resolution mesh for raster reprojection. The total image size is divided by the mesh-size to determine the quality of the mesh. 
Sample CartoCSS Code | `raster-mesh-size: 16;`
Default Value | `16`, the reprojected mesh is 1&#x2F;16 of the resolution of the source image.
Available Values | Unsigned integer

**Note:** While values defined greater than the default (`16`) may produce faster reprojection, the image may be distorted.

#### raster-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it. 
Sample CartoCSS Code | `raster-comp-op: src-over;` 
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

#### raster-colorizer-default-mode `keyword`

Description | Sets the default coloring mode of the raster. 
Sample CartoCSS Code | `raster-colorizer-default-mode:linear;`
Default Value | `undefined`
Available Values | `discrete` `linear` `exact`

#### raster-colorizer-default-color `color`

Description | Sets the color that is applied to all values outside of the range of the [raster-colorizer-stop values](#raster-colorizer-stop-tags).
Sample CartoCSS Code | `raster-colorizer-default-color: transparent;`
Default Value | `undefined`
Available Values | See [color](#color).

#### raster-colorizer-epsilon `float`

Description | Assigns an epsilon value to the raster colorizer. An epsilon value is when the exact input value matches the stop value to generate the translated color.
Sample CartoCSS Code | `raster-colorizer-epsilon:0.41;`
Default Value | `undefined`
Available Values | See [float](#float).

**Note:** Epsilon values must be listed in ascending order and contain a minimum value and associated color.

Additionally, you can also include the color-mode as a third argument. For example: `stop(100,#fff, exact)`

#### raster-colorizer-stops `tags`

Description | Assigns raster data values to colors. Stops must be listed in ascending order, and contain a minimum value, and the associated color.
Sample CartoCSS Code | `raster-colorizer-stops:',`<br /><br />**Tip:** See the related example for a complete CartoCSS syntax code example.
Default Value | `undefined`
Available Values | See [float](#float).

---

### Point

These CartoCSS properties can be applied to style points on a map.

[point-file](#point-file-uri) | [point-allow-overlap](#point-allow-overlap-boolean) | [point-ignore-placement](#point-ignore-placement-boolean)
[point-opacity](#point-opacity-float) | [point-placement](#point-placement-keyword) | [point-transform](#point-transform-functions)
[point-comp-op](#point-comp-op-keyword) | 

#### point-file `uri`

Description | A defined image path that renders how a point appears.
Sample CartoCSS Code | `point-file: url(http://www.image.com/image.png);`
Default Value | none
Available Values | See [uri](#uri).

#### point-allow-overlap `boolean`

Description | Shows or hides overlapping points on a map.
Sample CartoCSS Code | `point-allow-overlap: false;`
Default Value | `false`, does not allow points to overlap. Overlapping points are hidden
Available Values | See [boolean](#boolean).

#### point-ignore-placement `boolean`

Description | Prevents other placement properties from being rendered.
Sample CartoCSS Code | `point-ignore-placement: false;`
Default Value | `false`, does not store placement geometries in the collision detector cache of the bbox (bounding box).
Available Values | See [boolean](#boolean).

#### point-opacity `float`

Description | Sets the overall opacity of the point.
Sample CartoCSS Code | `point-opacity: 1;`
Default Value | `1`, the point is fully opaque.
Available Values | `0` `1`

#### point-placement `keyword`

Description | Determines how points are placed.
Sample CartoCSS Code | `point-placement: centroid;`
Default Value | `centroid`
Available Values | `centroid` `interior`<br /><br />**Note:** Centroid calculates the geometric center of a polygon (which can outside of the polygon). Interior is always placed inside of a polygon.

#### point-transform `functions`

Description | Defines SVG transformation functions to scale how points appear.
Sample CartoCSS Code | `point-transform: none;`
Default Value | `none`, geometry is not transformed.
Available Values | See [functions](#functions).<br /><br />**Note:** Define values as per [SVG transformation definitions](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)- which are values separated by whitespace and/or commas, from right to left.

#### point-comp-op `keyword

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `point-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Text

Defines the text label properties on the map.

[text-name](#text-name-expression) | [text-face-name](#text-face-name-string) | [text-size](#text-size-float)
[text-ratio](#text-ratio-unsigned) | [text-wrap-width](#text-wrap-width-unsigned) | [text-wrap-before](#text-wrap-before-boolean)
[text-wrap-character](#text-wrap-character-string) | [text-spacing](#text-spacing-unsigned) | [text-character-spacing](#text-character-spacing-float)
[text-line-spacing](#text-line-spacing-unsigned) | [text-label-position-tolerance](#text-label-position-tolerance-unsigned) | [text-max-char-angle-delta](#text-max-char-angle-delta-float)
[text-fill](#text-fill-color) | [text-opacity](#text-opacity-float) | [text-halo-fill](#text-halo-fill-color)
[text-halo-radius](#text-halo-radius-float) | [text-halo-rasterizer](#text-halo-rasterizer-keyword) | [text-dx](#text-dx-float)
[text-dy](#text-dy-float) | [text-vertical-alignment](#text-vertical-alignment-keyword) | [text-avoid-edges](#text-avoid-edges-boolean)
[text-min-distance](#text-min-distance-float) | [text-min-padding](#text-min-padding-float) | [text-min-path-length](#text-min-path-length-float)
[text-allow-overlap](#text-allow-overlap-boolean) | [text-orientation](#text-orientation-expression) | [text-placement](#text-placement-keyword)
[text-placement-type](#text-placement-type-keyword) | [text-placements](#text-placements-string) | [text-transform](#text-transform-keyword)
[text-horizontal-alignment](#text-horizontal-alignment-keyword) | [text-align](#text-align-keyword) | [text-clip](#text-clip-boolean)
[text-comp-op](#text-comp-op-keyword) | 

#### text-name `expression`

Description | The name of the text label.
Sample CartoCSS Code | `text-name: '[label_name_example]';`
Default Value | `undefined`
Available Values | See [expression](#expression).<br /><br />The expression value is a data column specified by using brackets, as shown in the sample code above.

#### text-face-name `string`

**Note:** A limited number of fonts can be applied directly through CARTO Builder. This CartoCSS property enables you to apply a larger range of fonts for your map label text. See the list of [supported fonts](#fonts) that can be applied as values. 

Description | The font name and style for the text-name label.
Sample CartoCSS Code | `text-face-name: ‘Open Sans Bold’;`
Default Value | `undefined`
Available Values | See [string](#string).

#### text-size `float`

Description | The text size of the text label, in pixels.
Sample CartoCSS Code | `text-size: 10;`
Default Value | `10`
Available Values | See [float](#float).

#### text-ratio `unsigned`

Description | Defines the amount of text that appears on successive lines after text wrapping.
Sample CartoCSS Code | `text-ratio: 0;`
Default Value | `0`
Available Values | Unsigned integer

#### text-wrap-width `unsigned`

Description | The length of pixels that appears before the text-name label wraps.
Sample CartoCSS Code | `text-wrap-width: 0;`
Default Value | `0`
Available Values | Unsigned integer

#### text-wrap-before `boolean`

Description | Determines how the wrap-text behaves relative to the wrap-width.
Sample CartoCSS Code | `text-wrap-before: false;`
Default Value | `false`,  wrapped text appears longer than the wrap-width.
Available Values | See [boolean](#boolean).

#### text-wrap-character `string`

Description | Enables you to wrap text with a character, rather than with a space. This is especially useful for long label names.
Sample CartoCSS Code | `text-wrap-character:  '_';`
Default Value | none
Available Values | See [string](#string).

#### text-spacing `unsigned`

Description | The space between repeated text lables, in pixels, on a line.
Sample CartoCSS Code | `text-spacing: 0;`
Default Value | `undefined`
Available Values | Unsigned integer

#### text-character-spacing `float`

Description | The horizontal space, in pixels, between characters.
Sample CartoCSS Code | `text-character-spacing: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### text-line-spacing `unsigned`

Description | The vertical spacing, in pixels, between two lines of multiline text labels.
Sample CartoCSS Code | `text-line-spacing: 0;`
Default Value | `0`
Available Values | Unsigned integer

#### text-label-position-tolerance `unsigned`

Description | Allows you to adjust the default placement of a text label on a line, in pixels.
Sample CartoCSS Code | `text-label-position-tolerance: 0;`
Default Value | `0`
Available Values | Unsigned integer

#### text-max-char-angle-delta `float`

Description | The maximum angle change allowed between adjacent characters in a label (as measured in degrees).
Sample CartoCSS Code | `text-max-char-angle-delta: 22.5;`
Default Value | `22.5`
Available Values | See [float](#float).

**Note:** Internally, the value is converted to the default value (`22.5`), by applying the following radian algorithm:

{% highlight javascript %}
22.5*math.PI/180.0
{% endhighlight %}

The higher the value, the fewer labels are placed around sharp corners.

#### text-fill `color`

Description | The color of the label text.
Sample CartoCSS Code | `text-fill: #000000;`
Default Value | `#000000`, black
Available Values | See [color](#color).

#### text-opacity `float`

Description | The opacity of the text label.
Sample CartoCSS Code | `text-opacity: 1;`
Default Value | `1`, fully opaque
Available Values | `0` `1`

#### text-halo-fill `color`

Description | Specifies the color of the halo around the text label.
Sample CartoCSS Code | `text-halo-fill: #FFFFFF;`
Default Value | `#FFFFFF`, the halo color is white by default.
Available Values | See [color](#color).

#### text-halo-radius `float`

Description | The radius of the halo, in pixels.
Sample CartoCSS Code | `text-halo-radius: 0;`
Default Value | `0`, no halo is applied.
Available Values | See [float](#float).

#### text-halo-rasterizer `keyword`

Description | Exposes an alternate AGG (Anti-Grain Geometry) rendering method that sacrifices some accuracy for speed.
Sample CartoCSS Code | `text-halo-rasterizer: full;`
Default Value | `full`
Available Values | `full` `fast`

#### text-dx `float`

Description | Places the text label within a fixed range of pixels, +/- along the X axis. A positive value shifts the text to the right.
Sample CartoCSS Code | `text-dx: 0;`
Default Value | `0`
Available Values | See [float](#float).

#### text-dy `float`

Description | Places the text label within a fixed range of pixels, +/- along the Y axis. A positive value shifts the text down.
Sample CartoCSS Code | `text-dy: 0;`
Default Value | `0`
Available Values | See [float](#flat).

#### text-vertical-alignment `keyword`

Description | The vertical alignment of the text label from its center point.
Sample CartoCSS Code | `text-vertical-alignment: auto;`
Default Value | `auto`
Available Values | `top` `middle` `bottom` `auto`

**Note:** The default value is affected by the dy (text down) value. If the dy value&gt;0, the vertical alignment value is `bottom`. If the dy value&lt;0, the vertical alignment is `top`.

#### text-avoid-edges `boolean`

Description | Prevents text labels from intersecting with tile boundaries.
Sample CartoCSS Code | `text-avoid-edges: false;`
Default Value | `false`, labels do not intersect.
Available Values | See [boolean](#boolean).

#### text-min-distance `float`

Description | The minimum distance between the next text label.
Sample CartoCSS Code | `text-min-distance: undefined;`
Default Value | `undefined`
Available Values | See [float](#float).

#### text-min-padding `float`

Description | The minimum distance, in pixels, that a text label is placed from the edge of a metatile (the tile/buffer space relationship).
Sample CartoCSS Code | `text-min-padding: undefined;`
Default Value | `undefined`
Available Values | See [float](#float).

#### text-min-path-length `float`

Description | Enables you to place text labels on paths longer than the minimum length.
Sample CartoCSS Code | `text-min-path-length: 0;`
Default Value | `0`, places text label on all paths.
Available Values | See [float](#float).

#### text-allow-overlap `boolean`

Description | Shows or hides overlapping text labels on a map.
Sample CartoCSS Code | `text-allow-overlap: false;`
Default Value | `false`, does not allow text labels to overlap. Overlapping text labels are hidden.
Available Values | See [boolean](#boolean).

#### text-orientation `expression`

Description | Enables you to change the orientation of the text label.
Sample CartoCSS Code | `text-orientation: undefined;`
Default Value | `undefined`
Available Values | See [expression](#expression).

#### text-placement `keyword`

Description | Places text labels on top of points, along multiple line places, on the vertexes of polygons, or in the interior inside a polygon.
Sample CartoCSS Code | `text-placement: point;`
Default Value | `point`, the text label appears on the top of map points.
Available Values | `point` `line` `vertex` `interior`

#### text-placement-type `keyword`

Description | Enables you to reposition and resize the text label to avoid overlaps.
Sample CartoCSS Code | `text-placement-type: dummy;`
Default Value | `dummy`, turns off and disables this feature.
Available Values | `dummy` `simple`

**Note:** The simple value is the text label placement string used for basic algorithms.

#### text-placements `string`

Description | If [text-placement-type](#text-placement-type-keyword) is set to `simple`, you can use this property to adjust the placement of the text label.
Sample CartoCSS Code | `text-placements: E,NE,SE,W,NW,SW;`
Default Value | none
Available Values | See [string](#string).

#### text-transform `keyword`

Description | Identifies the text case of the text label.
Sample CartoCSS Code | `text-transform: none;`
Default Value | `none`
Available Values | `none` `uppercase` `lowercase` `capitalize`

#### text-horizontal-alignment `keyword`

Description | The horizontal alignment of the text label from its center point.
Sample CartoCSS Code | `text-horizontal-alignment: auto;`
Default Value | `auto`
Available Values | `left` `middle` `right` `auto`

#### text-align `keyword`

Description | Defines how text labels are justified, relative to the [text-placement-type](#text-placement-type-keyword) property.
Sample CartoCSS Code | `text-align: auto;`
Default Value | `auto`, text is centered by default except when [text-placement-type](#text-placement-type-keyword) value is `simple`, then the text is justified automatically depending on where the text can fit [text-placements](#text-placements-string).
Available Values | `left` `right` `center` `auto`

#### text-clip `boolean`

Description | By default, geometries are clipped to map bounds. You can disable clips to avoid rendering artifacts on a map if are having performance issues.
Sample CartoCSS Code | `text-clip: true`
Default Value | `true`, geometry is clipped to map bounds before rendering.
Available Values | See [boolean](#boolean).

#### text-comp-op `keyword`

Description | The composite operation that defines how the symbolizer behaves relative to layers atop or below it.
Sample CartoCSS Code | `text-comp-op: src-over;`
Default Value | `src-over`, adds the current symbolizer on top of other symbolizers.
Available Values | `clear` `src` `dst` `src-over` `dst-over` `src-in` `dst-in` `src-out` `dst-out` `src-atop` `dst-atop` `xor` `plus` `minus` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `hard-light` `soft-light` `difference` `exclusion` `contrast` `invert` `invert-rgb` `grain-merge` `grain-extract` `hue` `saturation` `color` `value`

---

### Building

Defines how building structures are rendered on a map.

[building-fill](#building-fill-color) | [building-fill-opacity](#building-fill-opacity-float) | [building-height](#building-height-expression)

#### building-fill `color`

Description | The fill color of building walls.
Sample CartoCSS Code | `building-fill: #FFFFFF;`
Default Value | white, as indicated with the color `#FFFFFF`.
Available Values | See [color](#color).

#### building-fill-opacity `float`

Description | Sets the opacity of the building, including the opacity of the building walls.
Sample CartoCSS Code | `building-fill-opacity; 1;`
Default Value | `1`
Available Values | See [float](#float).

#### building-height `expression`

Description | The height of the building, in pixels.
Sample CartoCSS Code | `building-height: 0;`
Default Value | `0`
Available Values | See [expression](#expression).

---

### Other CartoCSS Parameters

#### Debug-mode `string`

Description | The mode for debug rendering.
Sample CartoCSS Code | `debug-mode: collision;`
Default Value | `collision`
Available Values | See [string](#string).

---

### CartoCSS Values

The following values can be applied to properties in CartoCSS.

#### Color

CartoCSS accepts a variety of syntaxes for colors - HTML-style hex values, rgb, rgba, hsl, and hsla. It also supports the predefined HTML colors names, such as `yellow` and `blue`.

{% highlight scss %}
#line {
  line-color: #ff0;
  line-color: #ffff00;
  line-color: rgb(255, 255, 0);
  line-color: rgba(255, 255, 0, 1);
  line-color: hsl(100, 50%, 50%);
  line-color: hsla(100, 50%, 50%, 1);
  line-color: yellow;
}
{% endhighlight %}

**Note:** Using hsl [(hue, saturation, lightness)](http://mothereffinghsl.com/) color values are often easier than rgb()values. CARTO also includes several color functions [borrowed from Less, a CSS pre-processor](http://lesscss.org/#-color-functions):

{% highlight scss %}
// lighten and darken colors
lighten(#ace, 10%);
darken(#ace, 10%);

// saturate and desaturate
saturate(#550000, 10%);
desaturate(#00ff00, 10%);

// increase or decrease the opacity of a color
fadein(#fafafa, 10%);
fadeout(#fefefe, 14%);

// spin rotates a color around the color wheel by degrees
spin(#ff00ff, 10);

// mix generates a color in between two other colors.
mix(#fff, #000, 50%);
{% endhighlight %}

Each of above examples uses color variables, literal colors, or is the result of other functions operating on colors.

#### Float

In CartoCSS, float values are numbers specified in pixels. Unlike CSS, numbers are not units, but pixels.

{% highlight scss %}
#line {
  line-width: 2;
}
{% endhighlight %}

You can also apply simple math using float number values. For example:

{% highlight scss %}
#line {
  line-width: 4 / 2; // division
  line-width: 4 + 2; // addition
  line-width: 4 - 2; // subtraction
  line-width: 4 * 2; // multiplication
  line-width: 4 % 2; // modulus
}
{% endhighlight %}

#### URI

A uniform resource identifier (URI) is a string of characters used to identify the name of a resource, typically a path on your computer or an internet address. You can also apply a URL (as if using HTML), to define a URI image location.

> In CARTO style code, only a URL to a publicly-available image can be used.

{% highlight scss %}
#markers {
  marker-file: url(http://com.cartodb.users-assets.production.s3.amazonaws.com/simpleicon/map43.svg);
}
{% endhighlight %}

**Note:** In Carto, images applied through CartoCSS cannot be selected from folders. You can define a resource of the image location with this URI value.

#### String

In CartoCSS, string values are identified as the text within the quotations. In the following example, the name of the font is the string value.

{% highlight scss %}
shield-face-name: 'Open Sans Bold';
{% endhighlight %}

**Note:** String values are different than [text-name](#text-name-expression) values, which are text label values defined with brackets, as shown in the following example.

{% highlight scss %}
#labels {
  text-name: "[MY_FIELD]";
}
{% endhighlight %}

#### Boolean

Boolean values are either `true` (Yes, the property is enabled) or `false` (No, the property is turned off).

{% highlight scss %}
#markers {
  marker-allow-overlap:true;
}
{% endhighlight %}

#### Expression

Expressions are flexible statements that can include fields, numbers, and other types of defined variables. For example, you can build an expression by entering a field name, a relation, set a predefined value, or enter a range of values.

{% highlight scss %}
#buildings {
  building-height: [HEIGHT_FIELD] * 10;
}
{% endhighlight %}

#### Numbers

CartoCSS number values are comma-separated lists, identifying one or more numbers, in a specific order. For example, a number value is used is the [line-dasharray](#line-dasharray-numbers) property, which specifies a pair of numbers for the value.

{% highlight scss %}
#disputedboundary {
  line-dasharray: 1, 4, 2;
}
{% endhighlight %}

#### Percentages

The percentage symbol, `%` universally indicates `value/100`. Use percentage values with ratio-related properties, such as the opacity of a shape or color, as shown in the following example.

{% highlight scss %}
#world {
  // this syntax
  polygon-opacity: 50%;

  // is equivalent to:
  polygon-opacity: 0.5;
}
{% endhighlight %}

**Note:** Do not use percentages as widths, heights, or other properties. Unlike CSS, percentages are not relative to cascaded classes or page size. They are simply the value divided by one hundred.

#### Functions

Functions are comma-separated lists of one or more functions. 

For example, [point-transform](#point-transform-functions), defines function values according to  [SVG transformation definitions](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)- which are values separated by whitespace and/or commas, from right to left.

{% highlight scss %}
#point {
  point-transform: scale(2, 2);
}
{% endhighlight %}

#### Fonts

View the [open-source library of fonts](https://github.com/CartoDB/cartodb/blob/226a627d8721d0a4be350af8525ba59e6106c155/lib/assets/core/javascripts/cartodb3/editor/style/style-form/style-form-components-dictionary.js) that can be selected in CARTO Builder when _LABELS_ are enabled for a map layer. If you are using the [`text-face-name: 'string'`](#text-face-name-string) property, a much larger range of font values are supported. _These are the font families and the supported weights for each font family._

- **Open Sans**  
Light, Regular, Semibold, Bold, Extrabold, Light Italic, Italic, Semibold Italic, Bold Italic, Extrabold Italic

- **DejaVu Sans**  
ExtraLight, Book, Oblique, Bold, Bold Oblique, Condensed, Condensed Oblique, Condensed Bold, Condensed Bold Oblique

- **DejaVu Serif**  
Book, Italic, Bold, Bold Italic, Condensed, Condensed Italic, Condensed Bold, Condensed Bold Italic

- **Lato**  
Hairline,  Hairline Italic, Light, Light Italic, Regular, Italic, Bold, Bold Italic, Black, Black Italic

- **Graduate**  
Regular

- **Gravitas One**  
Regular

- **Old Standard TT**  
Regular, Italic, Bold

- **Unifont**  
Medium
