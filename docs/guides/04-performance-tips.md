## Performance Tips

As you go through developing your applications with CARTO.js, you might find useful some tips to ease the development and make your application more performant.

### Sources
Every layer needs a source to get data from. The source is the entity that points to the data we want to show, at least, in one of our layers.

When working with sources, you may want to change the actual query to show other data in your visualization or dataviews. The visualizations and dataviews react to changes coming from linked sources, so that you don't have to create another source, and layer or dataview to reflect the changes in your application.

As you might think, the way to go is to call `.setQuery` method to update the SQL query when using a `carto.source.SQL`, or use `.setDataset` in a `carto.source.Dataset` source, like this example:

``` js
const populationSource = new carto.source.SQL('SELECT * FROM your_dataset');
populationSource.setQuery('SELECT column1 FROM your_dataset');
```

![setQuery diagram](../../img/set_query_diagram.svg)

``` js
const populationDataset = new carto.source.Dataset('your_dataset');
populationDataset.setTableName('your_new_dataset');
```

![setTableName diagram](../../img/set_table_name_diagram.svg)

That way, the dataviews and visualizations retrieving data from that source will be automatically updated without doing something else.

### Styles
We need to use CartoCSS whenever we want to change the style of our markers or polygons, among other things. Each CartoCSS instance contains the styles we want to apply to any of our layers.

These style instances work the same way as sources do. It is pretty common to change styles in your map based on certain triggers, so that you can adequate your visualization to what you want to show.

When linked to a layer, it will be automatically updated by invoking `.setContent` with a string containing the new style content.

```js
const layerStyle = new carto.style.CartoCSS(`
  #layer {
    marker-width: 8;
    marker-fill: #FF583E;
    marker-fill-opacity: 0.9;
    marker-allow-overlap: false;
  }
`);

layerStyle.setContent(`
  #layer {
    marker-width: 10;
    marker-fill: #FF583E;
    marker-allow-overlap: true;
  }
`);
```

![setContent diagram](../../img/set_content_diagram.svg)

### Layers
Layers are a fundamental part of your CARTO.js application. They are composed of a source and its attached styles.

As stated before, this layer will be automatically updated in the map when any of its properties (taking source and style as properties) change.

So, let's say that you want to update the table of your visualization which had been created like this:

``` js
const populationSource = new carto.source.SQL('SELECT * FROM your_dataset');
const layerStyle = new carto.style.CartoCSS(`
  #layer {
    marker-width: 10;
    marker-fill: #FF583E;
    marker-allow-overlap: true;
  }
`);

const layer = new carto.layer.Layer(populationSource, layerStyle)
```

To update the visualization, the only thing you need to do is to invoke `.setQuery` in your source and everything will be refreshed accordingly.

```js
populationSource.setQuery('SELECT column1 FROM your_dataset');
```

### Dataviews
Dataviews are a way to extract data from our source in predefined ways depending on the type of the column (eg: a list of categories, the result of a formula operation, etc...).

Dataviews need a source to extract data from. So when a source is passed to a Dataview, it will react to the changes happening to the source, whether changing the query or adding filters.

```js
const populatedPlaces = new carto.source.Dataset('ne_10m_populated_places_simple');

const column = 'adm0name'; // Aggregate the data by country.
const categoryDataview = new carto.dataview.Category(populatedPlaces, column, {
  operation: carto.operation.AVG, // Compute the average
  operationColumn: 'pop_max' // The name of the column where the operation will be applied.
});

citiesSource.addFilter(new carto.filter.Category('adm0name', { eq: 'Spain' } ));
```

In the example above, we add a new filter that filters other countries than Spain out of the source.
