# Getting data with SQL

CartoDB offers a powerful SQL API for you to query and retreive data from your CartoDB tables. CartoDB.js offers a simple to use wrapper for sending those requests and using the results.

### cartodb.SQL

`cartodb.SQL` is the tool you will use to access data you store in your CartoDB tables. This is a really powerful technique for returning things like: **items closest to a point**, **items ordered by date**, or **GeoJSON vector geometries**. It’s all powered with SQL and our tutorials will show you how easy it is to begin with SQL.

#### Arguments

Name | Description
--- | ---
format | should be GeoJSON.
dp | float precision.
jsonp | if jsonp should be used instead of CORS. This param is enabled if the browser does not support CORS.

These arguments will be applied to all the queries performed by this object. If you want to override them for one query see **execute** options.

#### Example

```javascript
var sql = new cartodb.SQL({ user: 'cartodb_user' });
sql.execute("SELECT * FROM table_name WHERE id > {{id}}", { id: 3 })
  .done(function(data) {
    console.log(data.rows);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
```

### sql.execute(_sql [,vars][, options][, callback]_)

It executes a sql query.

#### Arguments

Name |Description
--- | ---
sql | a string with the sql query to be executed. You can specify template variables like {{variable}} which will be filled with `vars` object.
vars | a map with the variables to be interpolated in the sql query.
options | accepts `format`, `dp` and `jsonp`. This object also overrides the params passed to `$.ajax`.

#### Returns

A promise object. You can listen for the following events:

Events | Description
--- | ---
done | triggered when the data arrives.
error | triggered when something failed.

#### Example

You can also use done and error methods:

```javascript
sql.execute('SELECT * FROM table_name')
  .done(fn)
  .error(fnError)
```

### sql.getBounds(_sql [,vars][, options][, callback]_)

Returns the bounds `[ [sw_lat, sw_lon], [ne_lat, ne_lon ] ]` for the geometry resulting of specified query.

#### Arguments

Name |Description
--- | ---
sql | a string with the sql query to calculate the bounds from.

#### Example

```javascript
sql.getBounds('select * from table').done(function(bounds) {
  console.log(bounds);
});
```

#### getBounds and Leaflet

You can use the results from `getBounds` to center data on your maps using Leaflet.

```javascript
sql.getBounds('select * from table').done(function(bounds) {
  map.setBounds(bounds);
  // or map.fitBounds(bounds, mapView.getSize());
});
```
