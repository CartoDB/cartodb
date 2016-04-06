# API

## cartodb.DI.createDashboard(domObject, vizJson, callback(err, obj))
Creates a new dashboard inside `domObject` based on `vizJson`.

#### Arguments
- domObject: dom object identifier where the dashboard will be inserted
- vizJson: either a vizjson url or a vizjson object. See viz.json spec to see how to generate one
- callback: it will be called when the dashboard is generated. First argument will be null if
  everything was fine, an `Error` object otherwise.

#### Example
```js
cartodb.deepInsights.createDashboard('#dashboard', vizJSONurl, function(err, dashboard) {
  if (err) {
    console.log('there was an error generating the dashboard');
    return;
  }
  var map = dashboard.getMap()
});
```

## cartodb.DI.Dashborbard

This object contains a CartoDB dashboard, a map, and some widgets:

#### getWidgets() -> Array of widgets
#### getWidget(id) -> get widget
#### getMap() -> returns a Map object

#### createCategoryWidget(widgetAttrs) -> CategoryWidget

*example*
```js
var map = dashboard.getMap();
var params = {
  "type": "category",
  "title": "Metro line",
  "type": "aggregation",
  "column": "closest_metro_line",
  "aggregationColumn": "closest_metro_line",
  "aggregation": "count",
};
// adds a category widget using column `test` from the second layer
dashboard.createCategory(params, map.getLayer(2))
```


#### createHistogramWidget(widgetAttrs) -> HistogramWidget
widgetAttrs: `id`, `title`, `order`, `collapsed`, `bins`, `show_stats`, `normalized`

#### createFormulaWidget(widgetAttrs) -> FormulaWidget
widgetAttrs: `id`, `title`, `order`, `collapsed`, `prefix`, `suffix`, `show_stats`, `description`

#### createTimeSeriesWidget(widgetAttrs) -> TimeSeriesWidget
widgetAttrs: `id`, `title`, `order`, `collapsed`, `bins`, `show_stats`, `normalized`

## cartodb.DI.CategoryWidget

##### update(widgetAttrs) -> Boolean
available attributes: `id`, `title`, `order`, `collapsed`, `prefix`, `suffix`, `show_stats`
returns `true` if the attribute was modified

*example*

```js
var cat = dashboard.createCategory(params, map.getLayer(2))
cat.update({ title: 'testing title' })
```

##### remove()
removes the widget from the dashboard

*example*

```js
var cat = dashboard.createCategory(params, map.getLayer(2));
cat.remove();
```


## cartodb.DI.HistogramWidget

##### update(widgetAttrs) -> Boolean
available attributes: `id`, `title`, `order`, `collapsed`, `bins`, `show_stats`, `normalized`

##### remove()
returns `true` if the attribute was modified


## cartodb.DI.FormulaWidget

##### update(widgetAttrs) -> Boolean
widgetAttrs: `id`, `title`, `order`, `collapsed`, `prefix`, `suffix`, `show_stats`, `description`

##### remove()
returns `true` if the attribute was modified


### cartodb.DI.TimeSeriesWidget

##### update(widgetAttrs) -> Boolean
widgetAttrs: `id`, `title`, `order`, `collapsed`, `bins`, `show_stats`, `normalized`

##### remove()
returns `true` if the attribute was modified
