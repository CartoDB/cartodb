## Deep Insights

This document is a quick start guide for CartoDB Deep Insights (DI). It shows how to create dashboards and modify widgets from a JavaScript application.

**Important notice:** This is a beta version, so the API interface might change. We will do our best effort to keep all the changes backwards compatible, please read NEWS.md to keep track of changes.

### Using Deep insights library in your application

As this is a WIP library, it will be updated daily with bugfixes, for that reason it is
recommended to use the CDN version of the library so, as we update the library, your application gets the latests bugfixes.

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/di.js/v0/themes/css/deep-insights.css" />
<script src=" http://libs.cartocdn.com/di.js/v0/deep-insights.uncompressed.js"></script>
```


### Create a dashboard

Here's how to create a dashboard:

```js
cartodb.deepInsights.createDashboard('#dashboard', vizJSONurl, {}, function(err, dashboard) {
    // update a dashboard widget
    var formulaWidget = dashboard.getWidget('whatever-id')
    formulaWidget.update({ title: 'this is the title' });

    // update map layers
    var map = dashboard.getMap();
    map.getLayer(1).set('cartocss', CARTOCSS);

    // create a new widget on layer 2
    var params = {
      "type": "category",
      "title": "Metro line",
      "type": "aggregation",
      "column": "closest_metro_line",
      "aggregationColumn": "closest_metro_line",
      "aggregation": "count",
    };
    // adds a categoty using column `test` from the second layer
    dashboard.createCategoryWidget(params, map.getLayer(2))
});
```

See a Working example - [code](http://github.com/CartoDB/deep-insights.js/tree/master/examples/dynamic_widgets.html), [live](http://deep-insights-js.github.io/examples/dynamic_widgets.html)

**Note on named maps**. As you probably know there is a way in CartoDB to have a map with private
tables, this is called [named maps](http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/). If you are using a named map you will not be able to add any widget or modify anything related with the widgets source data.

## Found a bug?

Please report it in [deep insights repo](https://github.com/CartoDB/deep-insights.js/issues), make
sure you report the version you are using. To check the version just open the developer tools and
check `cartodb.deepInsights.VERSION`.


## API

Read the [API documentation](api.md).
