## Quickstart Guide

CARTO.js lets you create custom location intelligence applications that leverage the power of the **[CARTO Engine](https://carto.com/pricing/engine/)** ecosystem.

This document details CARTO.js v4. To update your v3 apps, please consult the [Upgrade Considerations]({{site.cartojs_docs}}/guides/upgrade-considerations/).

### About this Guide

This guide describes how to create a Leaflet map and display data from CARTO over the map. This demonstrates how CARTO.js can be used to

1. Overlay Data from your CARTO account on any Map.
2. Use Dataviews to Create Widgets.


**Tip:** For more advanced documentation, view the [Full Reference API]({{site.cartojs_docs}}/reference/) or browse through some [examples]({{site.cartojs_docs}}/examples/). You can also read the [FAQs]({{site.cartojs_docs}}/support/faq/).

### Audience

This document is intended for website or mobile developers who want to include CARTO.js library within a webpage or mobile application. It provides an introduction to using the library and reference material on the available parameters.

### Requesting an API Key

CARTO.js requires using an API Key. From your CARTO dashboard, click [_Your API keys_](https://carto.com/login) from the avatar drop-down menu to view your uniquely generated API Key for managing data with CARTO Engine.

If you want learn more about authorization and authentication, read the [authorization fundamentals section]({{site.fundamental_docs}}/authorization/). 

### Importing Datasets
Before you start working on the map, you need to import a couple of datasets. For this guide, we will use CARTO's Data Library, available from *Your datasets* dashboard, to import and connect public datasets to your account.

Alternatively, click the following links to download datasets from a public CARTO account:

* [European countries (ne_adm0_europe)](https://carto.com/dataset/ne_adm0_europe)
* [Populated places (ne_10m_populated_places_simple)](https://carto.com/dataset/ne_10m_populated_places_simple)

Once downloaded, import the datasets to your CARTO account.

### Setting up the Map

By the end of the lesson, you will have generated an HTML file of a Leaflet Map showing CARTO's Voyager basemap and labels on top.

#### Application Skeleton

Create an HTML file using your preferred text editor and paste the following code to build the application skeleton:


```html
<!DOCTYPE html>
<html>
  <head>
    <title>Guide | CARTO</title>
    <meta name="viewport" content="initial-scale=1.0">
    <meta charset="utf-8">
    <!-- Include Leaflet -->
    <script src="https://unpkg.com/leaflet@1.2.0/dist/leaflet.js"></script>
    <link href="https://unpkg.com/leaflet@1.2.0/dist/leaflet.css" rel="stylesheet">
    <!-- Include CARTO.js -->
    <script src="https://cartodb-libs.global.ssl.fastly.net/carto.js/%VERSION%/carto.min.js"></script>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700" rel="stylesheet" type="text/css">
    <style>
      * { margin:0; padding:0; }
      html { box-sizing:border-box; height:100%; }
      body { background:#f2f6f9; height:100%; font-family:"Open sans", Helvetica, Arial, sans-serif; }
      #container { display:flex; width:100%; height:100%; }
      #map { flex:1; margin:10px; }
      #widgets { width:300px; margin:10px 10px 10px 0; }
      .widget { background:white; padding:10px; margin-bottom:10px; }
      .widget h1 { font-size:1.2em; }
      .widget-formula .result { font-size:2em; }
    </style>
  </head>
  <body>
    <div id="container">
      <div id="map"></div>
      <div id="widgets">
        <div id="countriesWidget" class="widget">
          <h1>European countries</h1>
          <select class="js-countries">
            <option value="">All</option>
          </select>
        </div>
        <div id="avgPopulationWidget" class="widget widget-formula">
          <h1>Average population</h1>
          <p><span class="js-average-population result">xxx</span> inhabitants</p>
        </div>
      </div>
    </div>
    <script>
      // code will go here!
    </script>
  </body>
</html>
```

The first part of the skeleton loads CARTO.js and Leaflet 1.2.0 assumes Leaflet is loaded in `window.L`. The library checks if the version of Leaflet is compatible. If not, it throws an error.

The app skeleton also loads CARTO.js, adds some necessary elements, and defines a `script` tag. This is where you will write all the JavaScript code to make the example work.

**Note:** While CARTO.js enables you to display data from CARTO on top of Leaflet or Google Maps map, the actual map settings are controlled via the [Leaflet](http://leafletjs.com/) or [Google Maps](https://hpneo.github.io/gmaps/) map options.

#### Creating the Leaflet Map

CARTO.js apps start from a Leaflet or Google Map. Let's use a basic [Leaflet](http://leafletjs.com/) map for this guide:

```javascript
const map = L.map('map').setView([50, 15], 4);
```

#### Adding Basemap and Label Layers

Define the type of basemap to be used for the background of your map. For this guide, let's use [CARTO's Voyager basemap](https://carto.com/location-data-services/basemaps/).

```javascript
// Adding Voyager Basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Adding Voyager Labels
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png', {
  maxZoom: 18,
  zIndex: 10
}).addTo(map);
```

`L.tileLayer` creates a layer for the basemap and the `zIndex` property defines the basemap labels (that sit on top of the other layers).

### Defining a `carto.Client`

`carto.Client` is the entry point to CARTO.js. It handles the communication between your app and your CARTO account, which is defined by your API Key and your username.

```javascript
var client = new carto.Client({
  apiKey: '{API Key}',
  username: '{username}'
});
```

**Warning:** Ensure that you modify any placeholder parameters shown in curly brackets with your own credentials. For example, `apiKey: '123abc',` and `username: 'john123'`.

### Displaying Data on the Map

Display data hosted on your CARTO account as map layers.

### Defining Layers

Layers are defined with `carto.layer.Layer` which include the dataset name and basic styling options with CartoCSS.

```javascript
const europeanCountriesDataset = new carto.source.Dataset(`
  ne_adm0_europe
`);
const europeanCountriesStyle = new carto.style.CartoCSS(`
  #layer {
  polygon-fill: #162945;
    polygon-opacity: 0.5;
    ::outline {
      line-width: 1;
      line-color: #FFFFFF;
      line-opacity: 0.5;
    }
  }
`);
const europeanCountries = new carto.layer.Layer(europeanCountriesDataset, europeanCountriesStyle);
```
The first layer defines a `carto.source.Dataset` object that points to the imported dataset named `ne_adm0_europe`. To style the layer, define a `carto.style.CartoCSS` object that describes how polygons will be rendered.

```javascript
const populatedPlacesSource = new carto.source.SQL(`
  SELECT *
    FROM ne_10m_populated_places_simple
    WHERE adm0name IN (SELECT admin FROM ne_adm0_europe)
`);
const populatedPlacesStyle = new carto.style.CartoCSS(`
  #layer {
    marker-width: 8;
    marker-fill: #FF583E;
    marker-fill-opacity: 0.9;
    marker-line-width: 0.5;
    marker-line-color: #FFFFFF;
    marker-line-opacity: 1;
    marker-type: ellipse;
    marker-allow-overlap: false;
  }
`);
const populatedPlaces = new carto.layer.Layer(populatedPlacesSource, populatedPlacesStyle, {
  featureOverColumns: ['name']
});
```

The second layer uses a more complex type of data source for the layer. `carto.source.SQL` provides more flexibility for defining the data that you want to display in a layer. For this guide, we are composing a `SELECT` statement that selects populated cities in Europe. (Optionally, you can change this query at runtime).

The `featureOverColumns: ['name']` option we include in the layer creation defines what columns of the datasource will be available in `featureOver` events as we explain below.

#### Adding Layers to the Client

Before you can add layers to the map, the `carto.Client` variable needs to be notified that these layers exist. The client is responsible for grouping layers into a single Leaflet layer.

```javascript
client.addLayers([europeanCountries, populatedPlaces]);
```

#### Adding Layers to the Map

Now that the client recognizes these two layers, this single Leaflet layer can be added to the map.

```javascript
client.getLeafletLayer().addTo(map);
```

As a result, your map should display polygons for each European country and red points represent populated cities.

**Tip:** In order to change the order of layers, flip the order from `([A, B]);` to `(B, A);`

### Setting up Tooltips

Tooltips give map viewers information about the underlying data as they interact with the map by clicking or hovering over data. CARTO.js provides a simple mechanism to detect some of these interactions and use the data associated to them. For this guide, let's display a mouse hover tooltip showing the name of a city.

#### Showing the Tooltip when User Mouses Over a City

Layers trigger `featureOver` events when the map viewer hovers the mouse over a feature. The event includes data about the feature, such as the latitude and longitude, as well as specified column values defined in `featureOverColumns`.

```javascript
const popup = L.popup({ closeButton: false });
populatedPlaces.on(carto.layer.events.FEATURE_OVER, featureEvent => {
  popup.setLatLng(featureEvent.latLng);
  if (!popup.isOpen()) {
    popup.setContent(featureEvent.data.name);
    popup.openOn(map);
  }
});
```

In this snippet, we are defining a `L.popup` and listening to the `featureOver` event. When the event is triggered, the pop-up is positioned, populated with the name of the city, and added to the map.


#### Hiding the Tooltip

Similarly, layers trigger `featureOut` events when the map viewer is no longer moving the mouse over a feature. Use this event to hide the pop-up.

```javascript
populatedPlaces.on(carto.layer.events.FEATURE_OUT, featureEvent => {
  popup.removeFrom(map);
});
```

When `featureOut` is triggered, this code removes the pop-up from the map.

### Creating a Country Selector Widget

This section describes how to get data from a previously defined data source and display a country selector the map. As a result, selecting a country on the map highlights the country and filters by populated places.

#### Defining a Category Dataview

Dataviews are the mechanism CARTO.js uses to access data from a data source (dataset or SQL query) in a particular way (eg: list of categories, result of a formula, etc.). Use the `carto.dataview.Category` dataview to get the names of the European countries in the dataset:

```javascript
const countriesDataview = new carto.dataview.Category(europeanCountriesDataset, 'admin', {
  limit: 100
});
```

This type of dataview expects a data source and the name of the column with the categories. By default, results are limited. For this guide, we specified a limit of 100 categories to make sure all country names are returned.

#### Listening to Data Changes on the Dataview

In order to know when a dataview has new data (eg: right after it has been added to the client or when its source has changed), you should listen to the `dataChanged` event. This event gives you an object with all the categories.

```javascript
countriesDataview.on('dataChanged', data => {
  const countryNames = data.categories.map(category => category.name).sort();
  refreshCountriesWidget(countryNames);
});

function refreshCountriesWidget(adminNames) {
  const widgetDom = document.querySelector('#countriesWidget');
  const countriesDom = widgetDom.querySelector('.js-countries');

  countriesDom.onchange = event => {
    const admin = event.target.value;
    highlightCountry(admin);
    filterPopulatedPlacesByCountry(admin);
  };

  // Fill in the list of countries
  adminNames.forEach(admin => {
    const option = document.createElement('option');
    option.innerHTML = admin;
    option.value = admin;
    countriesDom.appendChild(option);
  });
}

function highlightCountry(admin) {
  let cartoCSS = `
    #layer {
      polygon-fill: #162945;
      polygon-opacity: 0.5;
      ::outline {
        line-width: 1;
        line-color: #FFFFFF;
        line-opacity: 0.5;
      }
    }
  `;
  if (admin) {
    cartoCSS = `
      ${cartoCSS}
      #layer[admin!='${admin}'] {
        polygon-fill: #CDCDCD;
      }
    `;
  }
  europeanCountriesStyle.setContent(cartoCSS);
}

function filterPopulatedPlacesByCountry(admin) {
  let query = `
    SELECT *
      FROM ne_10m_populated_places_simple
      WHERE adm0name IN (SELECT admin FROM ne_adm0_europe)
  `;
  if (admin) {
    query = `
      SELECT *
        FROM ne_10m_populated_places_simple
        WHERE adm0name='${admin}'
    `;
  }
  populatedPlacesSource.setQuery(query);
}
```

This snippet generates the list of country names in alphabetical order from the `dataChanged` parameter and uses the `SELECT` function to populate the list.

When a country is selected, two functions are invoked: `highlightCountry` (highlights the selected country by setting a new CartoCSS to the layer) and `filterPopulatedPlacesByCountry` (filters the cities by changing the SQL query).

#### Adding the Dataview to the Client

The dataview needs to be added to the client in order to fetch data from CARTO.

```javascript
client.addDataview(countriesDataview);
```

### Creating a Formula Widget

Now that you have a working country selector, let's add a widget that will display the average max population of the populated places for the selected country (or display ALL if no country is selected).

#### Defining a Formula Dataview

`carto.dataview.Formula` allows you to execute aggregate functions (count, sum, average, max, min) on a data source:

```javascript
const averagePopulation = new carto.dataview.Formula(populatedPlacesSource, 'pop_max', {
  operation: carto.operation.AVG
});
```

The `averagePopulation` dataview triggers a `dataChanged` event every time a new average has been calculated.

#### Listening to Data Changes on the Dataview

The `dataChanged` event allows you to get results of the aggregate function and use it in many ways.

```javascript
averagePopulation.on('dataChanged', data => {
  refreshAveragePopulationWidget(data.result);
});

function refreshAveragePopulationWidget(avgPopulation) {
  const widgetDom = document.querySelector('#avgPopulationWidget');
  const averagePopulationDom = widgetDom.querySelector('.js-average-population');
  averagePopulationDom.innerText = Math.floor(avgPopulation);
}
```

This snippet refreshes the averaged population widget every time a new average is available (e.g., when a new country is selected).

#### Adding the dataview to the client

To get a full working dataview, add it to your client:

```javascript
client.addDataview(averagePopulation);
```

### Conclusion

<div class="example-map">
  <iframe src="{{site.cartojs_docs}}/guides/quickstart-example.html" width="100%" height="600" frameBorder="0" style="padding-top: 20px;padding-bottom: 0;" class="u-vspace--24"></iframe>
  <a href="{{site.cartojs_docs}}/guides/quickstart-example.html" class="buttonLink is-DocsGreen u-vspace--32" target="_blank">
    <svg width="8px" height="7px" viewbox="0 0 8 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path class="buttonLink-media" d="M1.52245273,3.04854764 L3.68776506,0.883235307 C3.88225492,0.688745449 3.88821988,0.353713791 3.68525771,0.15075162 C3.4882313,-0.0462747862 3.15435142,-0.053333131 2.95277402,0.148244267 L0.147793654,2.95322464 C0.0109867585,3.09003153 -0.0325396573,3.29637729 0.0243152648,3.47738142 C-0.0325396573,3.65838554 0.0109867585,3.8647313 0.147793654,4.00153819 L2.95277402,6.80651857 C3.15435142,7.00809596 3.4882313,7.00103762 3.68525771,6.80401121 C3.88821988,6.60104904 3.88225492,6.26601738 3.68776506,6.07152753 L1.70421948,4.08798194 L7.99996393,4.08798194 L7.99996393,3.04854764 L1.52245273,3.04854764 Z" id="Combined-Shape" fill="#1FAC06" transform="translate(3.999982, 3.477381) scale(-1, 1) translate(-3.999982, -3.477381) "/>
      </g>
    </svg>
    Click to open map full size
  </a>
</div>

### Troubleshooting and support

For more information on using the CARTO.js library, take a look at the [support page]({{site.cartojs_docs}}/support/).

The CARTO.js library may issue an error or warning when something goes wrong. You should check for warnings in particular if you notice that something is missing. It's also a good idea to check for warnings before launching a new application. Note that the warnings may not be immediately apparent because they appear in the HTTP header. For more information, see the guide to [errors messages]({{site.cartojs_docs}}/support/error-messages/).

This guide is just an overview of how to use CARTO.js to overlay data and create widgets. View the [Examples]({{ site.cartojs_docs }}/examples/) section for specific features of CARTO.js in action.
