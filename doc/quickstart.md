## Deep Insights

This document is a quick start to use CartoDB Deep Insights (DI). It shows how to create dashboards and modify widgets from a JavaScript application.

**Important notice**
This is a beta version, so the API interface might change. We will do our best effort to keep all the changes backwards compatible, please read NEWS.md to keep track of changes.

### Using Deep insights library in your application

As this is a WIP library, it will be updated daily with bug fixes, for that reason it is
encouraged to use the CDN version of the library so as we update library your application gets the latests fixes.

```htmlc
<link rel="stylesheet" href="http://libs.cartocdn.com/di.js/v0/themes/css/deep-insights.css" />
<script src=" http://libs.cartocdn.com/di.js/v0/deep-insights.uncompressed.js"></script>
```


### Create a dashboard

Here's how to create a dashboard:

```js
cartodb.deepInsights.createDashboard('#dashboard', vizJSONurl, function(err, dashboard) {
    // update a dashboard widget
    var formula = dashboard.getWidget('whatever-id')
    formula.update({ title: 'this is the title' });

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
    dashboard.createCategory(params, map.getLayer(2))
});
```

## Found a bug?

Please report it in [deep insights repo](https://github.com/CartoDB/deep-insights.js/issues), make
sure you report the version you are using. To check the version just open the developer tools and
check `cartodb.deepInsights.VERSION`


## API

read the [API](api.md)


