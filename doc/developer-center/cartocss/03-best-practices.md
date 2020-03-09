## CartoCSS Best Practices

While there are many ways to apply the same visual effects with CartoCSS properties, this section describes the most efficient and intuitive methods for structuring your CartoCSS syntax.

You can apply CartoCSS properties to the overall map style, or to specific map symbolizers (such as markers and points). Sometimes, applying properties to a symbolizer is not the most effective workflow for enhancing your overall map style. Other times, applying a style to the overall map is not rendered if there is no default value defined, and thus, not needed. For example, see how  [composite operations](#composite-operation-effects) can be used for color blending, based on style or symbolizer.

When applying CartoCSS syntax, it helps to understand how values are applied to your map:

- The source is where the style is applied (either as a value or as a symbolizer property)
- The destination is the effect on the rest of the map, underneath the source
- Any layers that appear above the source are unaffected by the applied style and are rendered normally 
- Typically, you apply CartoCSS properties to different layers on a map. You can add multiple styles and values for each layer

- Alternatively, you can apply CartoCSS by nesting categories and values. Categories contain multiple values listed under the same, single category using brackets `{ }`. This enables you visualize all of the styling elements applied to the overall map or to individual symbolizers, and avoid adding any redundant or unnecessary parameters. This is the suggested method if you are applying styles to a multi-scale map.

**Note:** Be mindful when applying styles to a map with multiple layers. Instead of applying an overall style to each map layer, apply the style to one layer on the map using this nested structure. For example, suppose you have a map with four layers, you can define zoom dependent styling as a nested value in one map layer. You do not have to go through each layer of the map to apply a [zoom style](#example-5-zoom-based-styling-with-cartocss). Using the nested structure allows you to apply all of the styling inside the brackets `{ }`. This is a more efficient method of applying overall map styling.

Each of the examples below produces the same visual effect. Note how the CartoCSS syntax is structured.

### Example 1: CartoCSS syntax structured by point

Marker fill values are applied to the overall style of the map. Each map point is labeled `#continent_points[continent="name"] {` and contains its own marker-fill style.

{% highlight scss %}
#continent_points {
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 1;
  marker-line-opacity: 1;
  marker-placement: point;
  marker-type: ellipse;
  marker-width: 10;
  marker-allow-overlap: true;
}
#continent_points[continent="Africa"] {
  marker-fill: #A6CEE3;
}
#continent_points[continent="Antarctica"] {
  marker-fill: #1F78B4;
}
#continent_points[continent="Asia"] {
  marker-fill: #B2DF8A;
}
#continent_points[continent="Australia"] {
  marker-fill: #33A02C;
}
#continent_points[continent="Europe"] {
  marker-fill: #FB9A99;
}
#continent_points[continent="North America"] {
  marker-fill: #E31A1C;
}
#continent_points[continent="Oceania"] {
  marker-fill: #FDBF6F;
}
#continent_points[continent="South America"] {
  marker-fill: #FF7F00;
}
{% endhighlight %}

### Example 2: CartoCSS syntax structured by category

Marker fill values are applied to the overall style of the map. `marker-line-opacity`, `marker-placement`, and `marker-type` are removed from the overall map style, since the default values for these properties do not render any styling effects, they are not necessary.

**Tip:** In some cases, default values for CartoCSS properties render no styling effects on your map. If you apply CartoCSS syntax with the default values `none``undefined`, the map appears the same with or without these properties. Ensure to define values for properties that apply no default styling.

Each point is categorized as `[continent="name"] {` and contains its own marker-fill style. 
*You do not need to preface each point with the `#continent_points` label.* Note how syntax highlighting is applied to clearly indicate the category.

{% highlight scss %}
#continent_points {
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 1;
  marker-width: 10;
  marker-allow-overlap: true;

  [continent="Africa"] {
    marker-fill: #A6CEE3;
  }
  [continent="Antarctica"] {
    marker-fill: #1F78B4;
  }
  [continent="Asia"] {
    marker-fill: #B2DF8A;
  }
  [continent="Australia"] {
    marker-fill: #33A02C;
  }
  [continent="Europe"] {
    marker-fill: #FB9A99;
  }
  [continent="North America"] {
    marker-fill: #E31A1C;
  }
  [continent="Oceania"] {
    marker-fill: #FDBF6F;
  }
  [continent="South America"] {
    marker-fill: #FF7F00;
  }
}
{% endhighlight %}

### Example 3: CartoCSS syntax structured by @ values

Apply the @ symbol to lists of all the color values for your categories. CartoCSS syntax is structured so that you can apply all your color changes in one section `@name: color;` and reference the point style within the category label `marker-fill: @name;`. This enables you to visualize exactly where your marker-fill values are located, in addition to the overall map styles.

{% highlight scss %}
@africa: #A6CEE3;
@antarctica: #1F78B4;
@asia: #B2DF8A;
@australia: #33A02C;
@europe: #FB9A99;
@northamerica: #E31A1C;
@oceania: #FDBF6F;
@southamerica:#FF7F00; 

#continent_points {
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 1;
  marker-width: 10;
  marker-allow-overlap: true;

  [continent="Africa"] {
   marker-fill: @africa;
  }
  [continent="Antarctica"] {
    marker-fill: @antarctica;
  }
  [continent="Asia"] {
    marker-fill: @asia;
  }
  [continent="Australia"] {
    marker-fill: @australia;
  }
  [continent="Europe"] {
    marker-fill: @europe;
  }
  [continent="North America"] {
    marker-fill: @northamerica;
  }
  [continent="Oceania"] {
    marker-fill: @oceania;
  }
  [continent="South America"] {
    marker-fill: @southamerica;
  }
}
{% endhighlight %}

### Example 4: Multiple Symbolizers for a Map Layer

In some cases, you may need to apply multiple symbolizers to one map layer. For example, a point layer typically contains marker syntax. You can also attach [other compatible symbolizer](#cartocss-symbolizer) properties, to achieve a desired styling effect.

Enter a double-colon symbol :: to indicate a duplicate map layer without actually adding a new layer to your map. This dummy layer created through CartoCSS styling acts as an attachment, enabling you to apply multiple symbolizers to the selected layer.

Suppose you have a point symbol and want to put a glowing halo around it. You need CartoCSS values for the point style and CartoCSS values for the glowing halo. 

- Add the styling for the points in your map layer
- Add a second, attachment, layer of the same data and create the styling for the halo

{% highlight scss %}
/** bottom attachment of the glowing halo **/

#layer {
 marker-width: 20;
 marker-fill: teal;
 marker-fill-opacity: 1;
 marker-line-color: #FFF;
 marker-line-width: 0;
 marker-line-opacity: 1;
 marker-placement: point;
 marker-type: ellipse;
 marker-allow-overlap: true;
}
{% endhighlight %}

{% highlight scss %}
/** top layer of the symbol**/

#layer {
 marker-width: 10;
 marker-fill: #FFB927 ;
 marker-fill-opacity: 0.9;
 marker-line-color: #FFF;
 marker-line-width: 0;
 marker-line-opacity: 1;
 marker-placement: point;
 marker-type: ellipse;
 marker-allow-overlap: true;
}
{% endhighlight %}

Alternatively, you can achieve the same effect by using a single map layer and inserting the double-colon symbol `::` You can type any text to describe the styling element that is being applied.

{% highlight scss %}
#layer {
  
 //bottom layer of symbol
  ::halo {
    marker-width: 20;
    marker-fill: teal;
    marker-fill-opacity: 1;
    marker-line-color: #FFF;
    marker-line-width: 0;
    marker-line-opacity: 1;
    marker-placement: point;
    marker-type: ellipse;
    marker-allow-overlap: true;
  }

//top layer of symbol  
   marker-width: 10;
   marker-fill: #FFB927 ;
   marker-fill-opacity: 0.9;
   marker-line-color: #FFF;
   marker-line-width: 0;
   marker-line-opacity: 1;
   marker-placement: point;
   marker-type: ellipse;
   marker-allow-overlap: true;  
}
{% endhighlight %}

- The ::halo describes the style elements that you are applying to the halo

- The default, top layer describes the style elements that you are applying to the point

**Note:** Similar to how map layers are rendered, symbolizers are rendered from bottom to top. To see an example, view this live map which is using [multiple symbolizers](https://mamataakella.carto.com/builder/36cb22c8-3334-11e6-ad49-0ecfd53eb7d3/embed) applied to point styles.

### Example 5: Zoom-Based Styling with CartoCSS

Zoom-based styling refers to the ability to change what is displayed on a map, or how it is visualized, based on the zoom-level. When you zoom in or out of the Map View, certain features or data (such as streets, waterways, or labels) appear or fade away.

For example, apply the _STAMEN TONER_ [basemap](https://carto.com/learn/guides/styling/basemaps-for-rendering-map-backgrounds) to your map and notice how buildings and features are shown or hidden, depending on the zoom level. You can apply the same functionality to your data by applying zoom-based styling with CartoCSS.

Whenever CartoCSS properties are enclosed in brackets `[zoom] { }`, this indicates that zoom-based styling should be activated when the map meets the specified zoom level. It enforces rules for when and how data appears on your map. For example, you can specify conditional styling to:

- Change the size of marker symbols at a specified zoom level.
- Show or hide text labels at a specified zoom level and/or define how labels appear. For more details about text labels and zoom-based styling, see the [_Applying Text Labels to your Data_](https://carto.com/learn/guides/styling/applying-text-labels-to-your-data) Guide in CARTO Builder documentation.

In the following example, the `[zoom]` value indicates that the size of the geometry should change when zoom level `4` is reached. [Square brackets] indicate zoom-based styling, while the {curly brackets} indicate styling conditions to be applied at that zoom level.

{% highlight scss %}
 [zoom = 4] {marker-width: 6}
{% endhighlight %}

**Tip:** You can specify the logical operator for the zoom level (greater than `>`, less than `<`, equal to `=` or a combination of those).

The following syntax displays how the entire layer is styled in CartoCSS. Layer styling shows that the default `marker-width` is `3`. When the zoom level is equal to `4`, or equal to/greater than `5`, the marker-width values change on your visualization. This styling increases the geometry size as the map is zoomed.

{% highlight scss %}
#layer{
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 0;
  marker-line-opacity: 1;
  marker-placement: point;
  marker-type: ellipse;
  marker-width: 3;
  marker-fill: #FF6600;
  marker-allow-overlap: true;
  [zoom = 4] {marker-width: 6}
  [zoom = 5] {marker-width: 12}
  [zoom > 5] {marker-width: 16}
}
{% endhighlight %}

Similarly, you can use the [attachment method](#example-4-multiple-symbolizers-for-a-map-layer) to apply multiple zoom-based styling parameters to a layer.

{% highlight scss %}
#layer[type='City'][zoom>=4]{
 ::inner{
   marker-fill-opacity: 1;
   marker-fill:#2b2b2b;
   marker-line-width: 0;
   marker-line-opacity: 0.65;
   marker-placement: point;
   marker-type: ellipse;
   marker-width: 5;
   marker-line-color: #2b2b2b;
   marker-allow-overlap: true;
 }
{% endhighlight %} 

### Adding Comments to your Code

If you are just learning CartoCSS, it might be useful to add comments next to lines of your CartoCSS code. For example, you can add comments to describe a specific hex color, the default value for a property, the available values, and so on. 

Enter comments by using the following format in your CartoCSS code. _Note the required spacing_:

`cartocss-property; /* comment */`

##### Example of Comments in CartoCSS

In the following example, there are user comments entered in the `marker-line-color`, `marker-placement`, `marker-width`, and `marker-fill` CartoCSS properties.

{% highlight scss %}
/** simple visualization */

#month_day{
  marker-fill-opacity: 0.9;
  marker-line-color: #FFF; /* white */
  marker-line-width: 1;
  marker-line-opacity: 1;
  marker-placement: point; /* options are point, line, interior */
  marker-type: ellipse;
  marker-width: 15; /* default value was 10 */
  marker-fill: #2E5387; /* hex color is St Tropaz */
  marker-allow-overlap: true;
  marker-comp-op: overlay;
}
{% endhighlight %}

As long as you are careful with the spacing, these comments will not interfere when applying CartoCSS style to your map.

**Tip:** You are notified if there any errors in the CartoCSS code.