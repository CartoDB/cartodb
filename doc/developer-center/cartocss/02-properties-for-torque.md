## CartoCSS Properties for Torque Style Maps

While you can use _most_ of the CartoCSS properties to customize Torque maps, CARTO provides additional CartoCSS properties that are specific for Torque style maps. You can add these CartoCSS properties to [Torque](#cartocss---torque-maps), [Torque Heatmaps](#cartocss---torque-heatmaps), and [Torque Category](#cartocss---torque-category-maps) maps. 

**Note:** For a reference of the CartoCSS properties that are currently supported with Torque, see the [torque-reference.json file](https://github.com/CartoDB/torque-reference/blob/master/1.0.0/reference.json).

### CartoCSS - Torque Maps

The following CartoCSS properties can be applied to Torque style maps. Note that some values vary, depending on the type of Torque map you are creating.

[-torque-frame-count](#-torque-frame-count-number) | [-torque-animation-duration](#-torque-animation-duration-number) | [-torque-time-attribute](#-torque-time-attribute-string)
[-torque-aggregation-function](#-torque-aggregation-function-keyword) | [-torque-resolution](#-torque-resolution-float) | [-torque-data-aggregation](#-torque-data-aggregation-keyword) 
[frame-offset](#frame-offset-number) | 

**Note:** All Torque CartoCSS syntax is prefaced with a hypen.

#### -torque-frame-count `number`

Description | Specifies the number of animation steps/frames in your torque animation.
Sample CartoCSS Code | `-torque-frame-count:128;`
Default Value | 128, the data is broken into 128 time frames when parsing CartoCSS. If the data contains a fewer number of total frames, a lessor value is used.
Available Values | See [numbers](#numbers).

**Tip:** In the CARTO Builder, this is the _STEPS_ value when the style is ANIMATED.

#### -torque-animation-duration `number`

Description | Specifies the length of time for your animation, in seconds.
Sample CartoCSS Code | `-torque-animation-duration:30;`
Default Value | undefined. Any positive number value is accepted.
Available Values | See [numbers](#numbers). _This can also be a decimal - see [float](#float)._

**Tip:** In the CARTO Builder, this is the _DURATION_ value when the style is ANIMATED.

#### -torque-time-attribute `string`

Description | Defines the name of the date column in your dataset. This column can be an integer *or* a date.
Sample CartoCSS Code | `-torque-time-attribute:"cartodb_id";`
Default Value | undefined
Available Values | See [string](#string).

**Tip:** In the CARTO Builder, this is the _COLUMN_ value when the style is ANIMATED.

#### -torque-aggregation-function `keyword`

**Note:** Please note the different available values that should be applied if you are using a [Torque Category](#cartocss---torque-category-maps) map.

Description | Since Torque maps renders data in clusters, this property defines how values are displayed in each cluster of the map. Column data must be numeric. For example, you can define: a maximum value, a count, or the total number of values in each cluster.<br /><br />**Note:** When visualizing Torque style maps, it is required that you normalize your data to show a total count, or a range, of `0`-`255`. For more details, see this description about [statistical normalization](https://books.google.com/books?id=FrUQHIzXK6EC&pg=PT347&lpg=PT347&dq=choropleth+normalization&source=bl&ots=muDZhsb2jT&sig=DbomJnKedQjaKvcQgm_sVqHBt-8&hl=en&sa=X&ved=0CCYQ6AEwAjgKahUKEwje0ee8qaTHAhUCZj4KHRF5CjM#v=onepage&q=choropleth%20normalization&f=false).
Sample CartoCSS Code | `-torque-aggregation-function: "count(cartodb_id)";`
Default Value | `"count(cartodb_id)"`
Available Values | `count(column_name), max(column_name), sum(column_name)`
Related Example | Wiki page about [how spatial aggregation works](https://github.com/CartoDB/torque/wiki/How-spatial-aggregation-works).

**Note:** Since the CARTO geospatial database is built on the PostgreSQL platform and supports advanced PostGIS capabilities, see [PostgreSQL Aggregate Functions](http://www.postgresql.org/docs/10/static/functions-aggregate.html) for additional supported values.

**Tip:** Functions can also be combinations of functions and operations. For example, `log(1 + max(column_name))`.

#### -torque-resolution `float`

Description | Since Torque maps create a grid from your data and aggregates data to each cell of that grid, this property defines the width and height of each cell, in pixels. 
Sample CartoCSS Code | `-torque-resolution:2;`
Default Value | undefined
Available Values | Resolution values should be applied in powers of 2 (for example, `2` `4` `8` and so on). The maximum value is `256`.

**Note:** Defining a larger number applies a larger grid to your data.

**Tip:** In the CARTO Builder, this is the _RESOLUTION_ value when the style is ANIMATED.

#### -torque-data-aggregation `keyword`

Description | Defines how Torque maps display past data. By default, linear data aggregation is applied, where no traces of past data appears. Optionally, you can show past data markers cumulatively.
Sample CartoCSS Code | `-torque-data-aggregation:linear;`
Default Value | `linear`, does not leave any trace of past data.
Available Values | `linear` `cumulative`

**Tip:** In the CARTO Builder, this is the _OVERLAP_ value when the style is ANIMATED.

#### frame-offset `number`

Description | Once your data is aggregated, you can further customize your Torque animation options by specifying how a pixel is rendered in the frames, after the initial rendering (the explosion effect on a Torque map).
Sample CartoCSS Code | `[frame-offset=1] { ... }`
Default Value | undefined, customize the marker options for each `frame-offset` property to add more styling. 
Available Values | See [numbers](#numbers).

**Tip:** In the CARTO Builder, this is the _TRAILS_ value when the style is ANIMATED.

The following example displays additional `frame-offset` values applied to a Torque map.

{% highlight scss %}
#twitter_citymaps[frame-offset=1] {
 marker-width:12;
 marker-fill-opacity:0.45; 
}
#twitter_citymaps[frame-offset=2] {
 marker-width:14;
 marker-fill-opacity:0.225; 
}
#twitter_citymaps[value=1] {
 marker-fill:#A6CEE3; 
}
{% endhighlight %}

**Tip:** You can also select each cluster value and apply custom marker styles, based on the data category. For example, suppose you want to apply a unique style only to the maximum value in your dataset, change the marker style for the maximum value in your animation. These values are located in your CartoCSS properties.

The following example displays CartoCSS properties with a Torque map.

{% highlight scss %}
/** torque visualization */

Map {
-torque-frame-count:512;
-torque-animation-duration:30;
-torque-time-attribute:"cartodb_id";
-torque-aggregation-function:"count(cartodb_id)";
-torque-resolution:2;
-torque-data-aggregation:linear;
}

#twitter_citymaps{
  comp-op: lighter;
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 1.5;
  marker-line-opacity: 1;
  marker-type: ellipse;
  marker-width: 6;
  marker-fill: #ff9900;
}
#twitter_citymaps[frame-offset=1] {
 marker-width:8;
 marker-fill-opacity:0.45; 
}
#twitter_citymaps[frame-offset=2] {
 marker-width:10;
 marker-fill-opacity:0.225; 
}
{% endhighlight %}

### CartoCSS - Torque Heatmaps

While any of the [Torque CartoCSS properties](#cartocss---torque-maps) can be applied to a Torque Heatmap, the following CartoCSS properties can also be applied to Torque Heatmaps.

- [image-filters `functions`](#image-filters-function), enables you to define the color stop for your heatmap

- [marker-file `uri`](#marker-file-uri), when creating a Torque Heatmap with Carto, marker files are automatically provided. You cannot change these options

- [marker-fill-opacity `float`](#marker-fill-opacity-float)

- [marker-width `expression`](#marker-width-expression)

**Note:** It is a [known issue](http://gis.stackexchange.com/questions/137384/marker-file-for-torque-cartodb) that certain marker properties are not supported when applied to Torque and Torque Category maps. Specifically, when the [marker-file](#marker-file-uri) and [marker-fill](#marker-fill-color) CartoCSS properties are applied, you cannot color a sprite using the marker-fill value. You must create a sprite per color when applying these properties to Torque map. Optionally, change the map type to a Torque Heatmap as a workaround.

The following example displays CartoCSS properties with a Torque Heatmap.

{% highlight scss %}
/** torque_heat visualization */

Map {
-torque-frame-count:1;
-torque-animation-duration:10;
-torque-time-attribute:"cartodb_id";
-torque-aggregation-function:"count(cartodb_id)";
-torque-resolution:2;
-torque-data-aggregation:linear;
}

#twitter_citymaps{
  image-filters: colorize-alpha(blue, cyan, #008000, yellow , orange, red);
  marker-file: url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png);
  marker-fill-opacity: 0.4*[value];
  marker-width: 35;
}
#twitter_citymaps[frame-offset=1] {
 marker-width:37;
 marker-fill-opacity:0.2; 
}
#twitter_citymaps[frame-offset=2] {
 marker-width:39;
 marker-fill-opacity:0.1; 
}
{% endhighlight %}

### CartoCSS - Torque Category Maps

While any of the [Torque CartoCSS properties](#cartocss---torque-maps) can be applied to a Torque Category map, the `-torque-aggregration-function` contains different available values that are specific for Torque Category maps.

#### -torque-aggregation-function `keyword` (Torque Category only)

Description | Torque Category applies a PostgreSQL command to find the values that appear most often in your data (in order to cluster your data accordingly).<br /><br />**Note:** When visualizing Torque style maps, it is required that you normalize your data to show a total count, or a range, of `0`-`255`. For more details, see this description about [statistical normalization](https://books.google.com/books?id=FrUQHIzXK6EC&pg=PT347&lpg=PT347&dq=choropleth+normalization&source=bl&ots=muDZhsb2jT&sig=DbomJnKedQjaKvcQgm_sVqHBt-8&hl=en&sa=X&ved=0CCYQ6AEwAjgKahUKEwje0ee8qaTHAhUCZj4KHRF5CjM#v=onepage&q=choropleth%20normalization&f=false).
Sample CartoCSS Code | `-torque-aggregation-function:"CDB_Math_Mode (torque_category)";`
Default Value | `"CDB_Math_Mode(torque_category)"`
Available Values | `count(column_name), max(column_name), sum(column_name)`<br /><br />**Tip:** For a Torque category layer that is created dynamically with `carto.createLayer`, the SQL query must explicitly include how to build the torque_category column. You must include both the `sql` and `table_name` parameters. See this [createLayer with torque category layer](https://gist.github.com/danicarrion/dcaf6f00a71aa55134b4) example.<br /><br />**Note:** `column_name` is a column that contains an integer or number for each category in the map. If you are applying CartoCSS with the CARTO Editor, you can select a text column. When applied as the `CDB_Math_Mode` value, the [statistical mode](https://en.wikipedia.org/wiki/Mode_%28statistics%29), or category, of the most occurrences over time appear as a Torque pixel. If a pixel returns multiple values, the colors may overlap and render incorrectly.<br /><br />**Tip:** An advanced math trick to properly blend colors is to apply the `sum(distinct(column_name));` value. This enables you to render pixels in categories and apply colors to each value. For example, when all pixel values=1, the sum of distinct is 1. When all pixels values=2, the sum of distinct is 2. When the values are mixed with either 1 or 2, the sum of distinct is 3. You can then apply `marker-fill` colors to each value category (value=1, value=2, value=3). If you have more than two values in your column, use these guidelines to figure out your own math trick to render the data.<br /><br />Additionally, you can use the `column_name` value to diverge values (i.e. when there is only one record of category 1 and 99 records of category 2).<br /><br />**Tip:** Since Torque does not return negative values, set this value high, i.e. 100. For example, `"100+sum(floor(category_name*1.5)-2)";` converts values to negative and positive values and sums them up. The greater the negative value, the greater the preference to category 1 in the pixel. The greater the positive value, the greater the preference to category 2.
Related Examples | Wiki page about [how spatial aggregation works](https://github.com/CartoDB/torque/wiki/How-spatial-aggregation-works).

The following example displays CartoCSS properties with a Torque Category map.

{% highlight scss %}
/** torque_cat visualization */

Map {
  -torque-frame-count:1024;
  -torque-animation-duration:30;
  -torque-time-attribute:"dates";
  -torque-aggregation-function:"CDB_Math_Mode(torque_category";
  -torque-resolution:2;
  -torque-data-aggregation:linear;
}
{% endhighlight %}
