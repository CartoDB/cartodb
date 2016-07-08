
# how to use raster with cartodb.js

The way to add a raster layer to your map with cartodb.js is similar to add a regular cartodb layer,
as everything in CartoDB it uses ``SQL`` + ``CartoCSS``


## introduction to raster

In [mapschool](http://mapschool.io/) you have a very good introduction to the basis of raster. Here
we are going to explain how raster works in CartoDB.

Raster usually takes a lot of space in the database and therefore render tiles is a heavy task.
Luckily CartoDB solved this for you, when you import a raster using the editor or the [Import
API](http://docs.carto.com/cartodb-platform/import-api.html) it generates a series of overviews,
that's it, a bunch of tables with preprocessed information in order to speedup rendering. 

You don't need to care about that but there are special cases you should be aware of when you create
a raster based visualization


##  creating a layer

As always a layer is created using ``createLayer`` method:

```
cartodb.createLayer(map, {
  user_name: 'doc',
  type: 'cartodb',
  sublayers: [{
     sql: 'select * from pop',
     cartocss: '#pop { raster-opacity: 1.0; }',
     raster: true,
  }]
})
.addTo(map)
```

The only special thing here is the ``raster`` flag, that tells Maps API that you are going to use a
raster table so all the optimizations and so on are enabled

## working the the layer

Change CartoCSS and so on it's the same than working with a regular layer, you can use methods like
``setCartoCSS``:

```
layer.getSubLayer(0).setCartoCSS('#layer {..... }');
```

You can also use ``setSQL`` but if you use a query different than the identity (select * from table)
the raster optimizations are not going to work and you will get a timeout depending on the zoom
level you are working on.

## using SQL for analysis

You can also access raster tables using SQL API  through cartodb.js, the following example gets the
average value for a raster in a radius of 100 meters with center in latlng 0, 0

```
 var sql = new cartodb.SQL({ user: 'doc' });
 var query = "SELECT avg((stats).mean) as m from (select st_summarystats(the_raster_webmercator, 1) as stats from pop where st_intersects(the_raster_webmercator, st_transform(st_buffer(cdb_latlon(0, 0)::geography, 100)::geometry, 3857) as foo";
                
 sql.execute(q).done(function(data) {
    if (data.rows && data.rows.length > 0) {
        console.log("Average raster value inside the " + type + ": " + data.rows[0].m);
    }
```

don't forget to use ``the_raster_webmercator`` column. 



## limitations

- changing the SQL to something custom could avoid Maps API to use overviews and not rendering the
  tiles due to timeout
- cartocss version should be 2.3.0. You usually don't need to do anything but if you are working
  with specific versions take this into account
- interaction does not work for rasters



