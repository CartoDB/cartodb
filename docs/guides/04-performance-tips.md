## Performance Tips

As you go through developing your applications with CARTO.js, you might find useful some tips to ease the development and make your application more performant.

### Sources
Sources are the objects to get data from. The source is the entity that points to the data we want to show in our layers or in a widget through a dataview.

When working with sources, you may want to change the actual query to show other data in your visualization or dataviews. The most common case is filtering your data. The layers and dataviews react to changes coming from linked sources, so that you don't have to create another source. Layers and dataviews that are linked to the source reflect the changes in the source.

The way to go is to call `.setQuery` method to update the SQL query when using a `carto.source.SQL`, or use `.setTableName` in a `carto.source.Dataset` source, like in this examples:

``` js
const populationSource = new carto.source.SQL('SELECT * FROM your_dataset');
populationSource.setQuery('SELECT * FROM your_dataset WHERE price < 80');
```

![setQuery diagram](../../img/set_query_diagram.svg)

``` js
const populationDataset = new carto.source.Dataset('your_dataset');
populationDataset.setTableName('another_dataset');
```

![setTableName diagram](../../img/set_table_name_diagram.svg)

That way, the dataviews and visualizations retrieving data from that source will be automatically updated without doing anything else on your part.

### Styles
We need to use CartoCSS whenever we want to change the style of our markers or polygons, among other things. Each CartoCSS instance contains the styles we want to apply to any of our layers.

These style instances work the same way as sources do. It is pretty common to change styles in your map based on certain triggers, so that you can adequate your visualization to what you want to show.

When linked to a layer, it will automatically show the style change when invoking `.setContent` on the style object with a string containing the new style content.

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
Layers are a fundamental part of your CARTO.js application. They show the data of a source using the style of a CartoCSS.

As stated before, the layer will be automatically updated in the map when any of its properties (source and style) change.

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

const layer = new carto.layer.Layer(populationSource, layerStyle);
```

To update the visualization, the only thing you need to do is to invoke `.setQuery` in your source and everything will be refreshed accordingly.

```js
populationSource.setQuery('SELECT * FROM your_dataset WHERE price > 500');
```

### Dataviews
Dataviews are a way to extract data from our source in predefined ways depending on the type of the column (eg: a list of categories, the result of a formula operation, etc...).

Dataviews need a source to extract data from. So when a source is passed to a dataview, it will react to the changes happening to the source, whether changing the query or adding filters.

```js
const populatedPlaces = new carto.source.Dataset('ne_10m_populated_places_simple');

const column = 'adm0name'; // Aggregate the data by country.
const categoryDataview = new carto.dataview.Category(populatedPlaces, column, {
  operation: carto.operation.AVG, // Compute the average
  operationColumn: 'pop_max' // The name of the column where the operation will be applied.
});

// ...

citiesSource.addFilter(new carto.filter.Category(column, { eq: 'Spain' } ));
```

In the example above, first we set a dataview getting data from a dataset with information about populated places. Then, we add a filter to the source to show only data coming from Spain. As you can see, we've updated the source and since the dataview was created linked to that source, a change on the query makes the dataview to react to that change automatically. There's no need to create another source and then another dataview.
