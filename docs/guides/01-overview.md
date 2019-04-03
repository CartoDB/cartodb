## Overview

CARTO.js lets you create custom location intelligence applications that leverage the power of the CARTO Platform.

### Audience

This documentation is designed for people familiar with JavaScript programming and object-oriented programming concepts. You should also be familiar with [Leaflet](https://leafletjs.com/) from a developer's point of view.

This conceptual documentation is designed to let you quickly start exploring and developing applications with the CARTO.js library. We also publish the [CARTO.js API Reference]({{site.cartojs_docs}}/reference/).

### Hello, World

The easiest way to start learning about the CARTO.js library is to see a simple example. The following web page displays a map adding a layer over it.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Single layer | CARTO</title>
    <meta name="viewport" content="initial-scale=1.0">
    <meta charset="utf-8">
    <!-- Include Leaflet -->
    <script src="https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"></script>
    <link href="https://unpkg.com/leaflet@1.3.1/dist/leaflet.css" rel="stylesheet">
    <!-- Include CARTO.js -->
    <script src="https://libs.cartocdn.com/carto.js/%VERSION%/carto.min.js"></script>
    <link href="https://fonts.googleapis.com/css?family=Montserrat:600" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
    <link href="https://carto.com/developers/carto-js/examples/maps/public/style.css" rel="stylesheet">
  </head>
  <body>
    <div id="map">
    </div>
    <!-- Description -->
    <aside class="toolbox">
      <div class="box">
        <header>
          <h1>Add a layer</h1>
          <button class="github-logo js-source-link"></button>
        </header>
        <section>
          <p class="description open-sans">Add one CARTO layer to your map.</p>
        </section>
        <footer class="js-footer"></footer>
      </div>
    </aside>

    <script>
      const map = L.map('map').setView([30, 0], 3);
      map.scrollWheelZoom.disable();

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      const client = new carto.Client({
        apiKey: 'default_public',
        username: 'cartojs-test'
      });

      const source = new carto.source.Dataset(`
        ne_10m_populated_places_simple
      `);
      const style = new carto.style.CartoCSS(`
        #layer {
          marker-width: 7;
          marker-fill: #EE4D5A;
          marker-line-color: #FFFFFF;
        }
      `);
      const layer = new carto.layer.Layer(source, style);

      client.addLayer(layer);
      client.getLeafletLayer().addTo(map);
    </script>
  </body>
</html>
```

[View example]({{site.cartojs_docs}}/examples/#example-add-a-layer).

Even in this simple example, there are a few things to note:

  - We declare the application as HTML5 using the `<!DOCTYPE html>` declaration.
  - We load the CARTO.js library using a `script` tag.
  - We create a `div` element named "map" to hold the map.
  - We define the JavaScript that creates a map in the `div`.

These steps are explained below.

### Declaring your application as HTML5

We recommend that you declare a true DOCTYPE within your web application. Within the examples here, we've declared our applications as HTML5 using the simple HTML5 DOCTYPE as shown below:

```html
<!DOCTYPE html>
```

Most current browsers will render content that is declared with this DOCTYPE in "standards mode" which means that your application should be more cross-browser compliant. The DOCTYPE is also designed to degrade gracefully; browsers that don't understand it will ignore it, and use "quirks mode" to display their content.

We add styles to the map through the file `style.css`, declaring:

```css
body {
  margin: 0;
  padding: 0;
}

#map {
  position: absolute;
  height: 100%;
  width: 100%;
  z-index: 0;
}
```

This CSS declaration indicates that the map container <div> (with id map) should take up 100% of the height of the HTML body.

### Loading the CARTO.js library

To load the Maps JavaScript API, use a script tag like the one in the following example:

```html
<script src="https://libs.cartocdn.com/carto.js/%VERSION%/carto.min.js"></script>
```

The URL contained in the script tag is the location of a JavaScript file that loads all of the code you need for using the CARTO.js library. This script tag is required. We are using the minified version of the library.

#### HTTPS or HTTP
We think security on the web is pretty important, and recommend using HTTPS whenever possible. As part of our efforts to make the web more secure, we've made all of the CARTO components available over HTTPS. Using HTTPS encryption makes your site more secure, and more resistant to snooping or tampering.

We recommend loading the CARTO.js library over HTTPS using the `<script>` tag provided above.

### Map DOM Elements

```html
<div id="map"></div>
```

For the map to display on a web page, we must reserve a spot for it. Commonly, we do this by creating a named div element and obtaining a reference to this element in the browser's document object model (DOM).

In the example above, we used CSS to set the height of the map div to "100%". This will expand to fit the size on mobile devices. You may need to adjust the width and height values based on the browser's screensize and padding.

### Map options

In this example, we are using Leaflet to render the map:

```javascript
const map = L.map('map').setView([30, 0], 3);
```

The common options for every map are: `center` and `zoom`. In this case, we are setting these with [Leaflet's setView method](https://leafletjs.com/reference-1.3.0.html#map-setview).

#### Zoom Levels

The initial resolution at which to display the map is set by the zoom property, where zoom 0 corresponds to a map of the Earth fully zoomed out, and larger zoom levels zoom in at a higher resolution. Specify zoom level as an integer. In our case, we are setting up this as **3**.

### Troubleshooting

If your code isn't working:

  - Look for typos. Remember that JavaScript is a case-sensitive language.
  - Check the basics. Some of the most common problems occur with the initial map creation. Such as:
    - Confirm that you've specified the zoom and center properties in your map options.
    - Ensure that you have declared a div element in which the map will appear on the screen.
    - Ensure that the div element for the map has a height.
    - Refer to our [examples]({{site.cartojs_docs}}/examples/) for a reference implementation.
  - Use a JavaScript debugger to help identify problems. Chrome Developer Tools is a good one.
  - Post questions to the [GIS Stack Exchange using the `CARTO` tag](https://gis.stackexchange.com/questions/tagged/carto). Guidelines on how to post great questions are available on the [support page]({{site.cartojs_docs}}/support/).
