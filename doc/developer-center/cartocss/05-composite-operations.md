## CartoCSS Composite Operations

Composite operations style the way colors of overlapping geometries interact with each other. Similar to blend operations in Photoshop, these composite operations style the blend modes on your map. The main reason to use composite operations is to fine-tune how much some features in your map stand out compared to others. They are a great way to control your maps legibility.

- There is a shortcut for selecting the _BLENDING_ composite operation value, directly from the STYLE options of a selected map layer

	**Tip:** <a href="../img/cartocss/select_BLENDING_option.gif" target="_blank">See how to select a BLENDING `comp-op` value through the STYLE options</a>.

- You can also enter CartoCSS syntax to apply the `comp-op` property with additional values

	**Tip:** <a href="../img/cartocss/cartocss_comp_op.gif" target="_blank">See how to apply a `comp-op` value with CartoCSS</a>.

### Effects of Composite Operations

Composite operations are blending modes for your map layers. They fall into two main categories: [color](#color-blending-values) and [alpha](#alpha-blending-values), and can be applied to all non-basemap elements in your CARTO map by adding the `comp-op` value to your CartoCSS code. 

Composite operations can be applied as an overall style effect, as shown in the following code:

{% highlight css %}
comp-op: multiply;
{% endhighlight %}

Or, it can be applied to the specific symbolizer property, depending on the color blending operation you are trying to achieve. For example:

{% highlight css %}
marker-comp-op: multiply;
polygon-comp-op: color-burn;
text-comp-op: screen;
{% endhighlight %}

- The layer (or text) that you choose the composite operation in is called the source

- Its composite operation is applied to each layer beneath, which are called destination layers. In CARTO, the source layer itself needs to have a color fill, but its composite operations apply to destination layers with color or texture fills (even raster layers)

	**Note:** Any layers that appear above the source are unaffected by the `comp-op` value and are rendered normally.

### CartoCSS Symbolizer Values

The following CartoCSS properties can be used as a blending effect on a map layer. Alternatively, these properties can be applied to invoke a composite operation effect on a particular symbolizer. For details, see [Effects of Composite Operations](#effects-of-composite-operations). Click a link to view the CartoCSS property description.

[line-comp-op](#line-comp-op-keyword) | [line-pattern-comp-op](#line-pattern-comp-op-keyword)| [marker-comp-op](#marker-comp-op-keyword)
[point-comp-op](#point-comp-op-keyword) | [polygon-comp-op](#polygon-comp-op-keyword) | [polygon-pattern-comp-op](#polygon-pattern-comp-op-keyword)
[raster-comp-op](#raster-comp-op-keyword) | [shield-comp-op](#shield-comp-op-keyword) | [text-comp-op](/#text-comp-op-keyword)

### Color Blending Values

The following color blending operations can be applied with the `comp-op` property.

[overlay](#overlay) | [multiply](#multiply) | [color-dodge](#color-dodge)
[plus](#plus) | [minus](#minus) | [screen](#screen)
[darken](#darken) | [lighten](#lighten) | [hard-light](#hard-light)
[soft-light](#soft-light) | [grain-merge](#grain-merge) | [grain-extract](#grain-extract)
[hue](#hue) | [saturation](#saturation) | [color](#color)
[value](#value) | [color-burn](#color-burn) | [difference](#difference)
[exclusion](#exclusion) | [contrast](#contrast) | [invert](#invert)
[invert-rgb](#invert-rgb) | clear | 

#### Overlay

Overlay is a color blend mode that combines [multiply](#multiply) and [screen](#screen) composite operations. Black appears as dark, as it originally is in its layer; white appears as bright, as it originally is in its layer. How purely other colors are rendered depends on how close they are to white or black. The closer a color is in value to pure midtone gray, the less it will appear. Use this when you want to show both light and dark in your overlapping layers, for example if you are using a textured polygon fill and want the highlights and shadows to appear through another layer. Notice in the example below how the gray-equivalent areas take on the color of the source layer.

{% highlight css %}
marker-comp-op: overlay;
{% endhighlight %}

![overlay](../img/cartocss//overlay.jpg)

#### Multiply

Multiply literally multiplies the color of the top layer by the color of each layer beneath, which typically results in the overlapping areas become darker.

A layers color is made of a mix of red, green and blue color channels. Each channel is assigned a percentage decimal value from 0 to 1. If all channels had a 0 value, the color is completely black; if the value is 1, the color is completely white. Multiply takes these channel numbers for one layer and multiplies them with the channel numbers of another. Your colors will often get darker which multiplying two decimal numbers together gives you a smaller decimal. The result is closer to 0 (black). Multiplying 1 (white) by another value will give you that other value, so the area where white mixes with another color will become that other color. Multiplying any color by 0 (black) will always render black.

Imagine it like layering colored sheets of cellophane over one another; white disappears, black stays black. Use this when you want to darken overlapping areas in your map.

![multiply](../img/cartocss/multiply.jpg)

Choosing multiply as the Blending option adds the following CartoCSS code:

{% highlight css %}
marker-comp-op: multiply;
{% endhighlight %}

#### Color-Dodge

The color-dodge color blend mode is similar to screen but the overall effect is more extreme. Your elements become much brighter (except if your source layer is black). Darker areas are tinted towards the source color. Use this when you want to have a major lightening effect with extreme contrast between your layers, without much detail showing.

{% highlight css %}
marker-comp-op: color-dodge;
{% endhighlight %}

![color-dodge](../img/cartocss/color_dodge.jpg)

A good reason to lighten a map element is to reduce how much it visually competes with more important map features. For example, see what graticules look like over polygons in [this map,](http://bit.ly/1Y75upF) when _Screen_ is applied:

![screen-use-case](../img/cartocss/screen-use-case.png)

#### Plus

The plus composite operation adds the color channel values of the source with the destinations. Visually, it adds the sources color to the darkest parts of the destination, and brightens the lighter parts, but tinted towards the source color. If you add a source color where red is the dominant color channel to the destinations red green and blue color channels, the dominant color in the result will be red. The overall effect is brighter than color-dodge. Lighter source colors effect the destination layer more than dark ones. A black source layer will have no effect; a white one will paint the whole destination layer white in the area of overlap.

{% highlight css %}
marker-comp-op: plus;
{% endhighlight %}

![plus](../img/cartocss/plus.jpg)

#### Minus

Minus works the same way as plus, but instead of adding the color channel values it subtracts them. For example, if your source layer is mostly red, it will subtract this from the destination layers so the overall color is mostly blue and green. This darkens the destination layer more extremely than color-burn, and is also more tinted towards the source color.

{% highlight css %}
marker-comp-op: minus;
{% endhighlight %}

![minus](../img/cartocss/minus.jpg)

#### Screen

Similar to [Multiply](#multiply), screen multiplies the overlapping areas. Unlike multiply, it subtracts the multiplied color channel numbers from their added value to invert them. This makes the overlapping areas brighter. If white is used, it will not change appearance. Black areas will disappear. Use this when you want to lighten overlapping areas in your map.

{% highlight css %}
marker-comp-op: screen;
{% endhighlight %}

![screen](../img/cartocss/screen.jpg)

#### Darken

Darken has a similar effect to multiply, but is more extreme. As it applies the color from the source layer to the destination layers, it compares each to find the darkest-colored pixels and keeps those. In the example below displays the **darken** composite operation in the top circle layer. Notice how only the hillshade shadows and black line show through from the destination layers, because all other elements have lighter-colored pixels than the circle. All pixel colors that are lighter than the top circle take on the circle's color. Use this when you want a darken effect that shows original color in the darkest areas of overlap, or when you want less detail than is shown in multiply.

{% highlight css %}
marker-comp-op: darken;
{% endhighlight %}

![darken](../img/cartocss/darken.jpg)

#### Lighten

Lighten works the same way as darken, but inversely. The lightest-colored pixels from each layer are kept, and if pixels are darker than the source layer, then the source layer color replaces them. This can be useful when you want to change the color of your overlapping area's shadows.

{% highlight css %}
marker-comp-op: lighten;
{% endhighlight %}

![lighten](../img/cartocss/lighten.jpg)

#### Hard Light

Hard Light is another color comp-op that you can use with CartoCSS:

{% highlight css %}
marker-comp-op: hard-light;
{% endhighlight %}

It works similarly to soft light, but is more extreme. Instead of using screen and multiply it uses color-dodge and color-burn, although not applied as strongly as with those comp-ops.

![hard-light](../img/cartocss/hard-light.jpg)

#### Soft Light

Soft Light will either screen or multiply the destination layer colors, depending on the color of the source layer. If the source color is darker than 50% gray, the multiply effect will be used. If it is lighter than 50%, then screen will be used. Soft-light's effects are not applied as strongly as multiply's or screen's though, so the resulting colors are less extremely tinted. Usually darks will not be pure black and highlights are not pure white.

{% highlight css %}
marker-comp-op: soft-light;
{% endhighlight %}

![soft-light](../img/cartocss/soft-light.jpg)

#### Grain-Merge

Grain-merge is the opposite of grain-extract. It adds the source and destination layer color channel values together, then subtracts 128. When used with textured destination layers, the overall visual effect shows the destination layers texture in the source layer overlap area, but with colors tinted towards the source layers.

{% highlight css %}
marker-comp-op: grain-merge;
{% endhighlight %}

![grain-merge](../img/cartocss/grain-merge.jpg)

#### Grain-Extract

Grain-extract subtracts destination layer color channel values from the source layer, and then adds 128. When used with textured destination layers, the overall visual effect shows the destination layers texture in the source layer overlap area, but with a brightened film-negative effect.

{% highlight css %}
marker-comp-op: grain-extract;
{% endhighlight %}

![grain-extract](../img/cartocss/grain-extract.jpg)

#### Hue

Hue keeps the color brightness and saturation levels of the destination layers, but renders a result with the same hue as the source layer.

{% highlight css %}
marker-comp-op: hue;
{% endhighlight %}

![hue](../img/cartocss/hue.jpg)

#### Saturation

Saturation keeps the hue and brightness levels of the destination layers, but renders a result with the same level of saturation as the source layer. If you are using white in the source layer, there will be less saturation in the result. Black will render the highest level of saturation. Color half way between them, gray, will not have an effect.

{% highlight css %}
marker-comp-op: saturation;
{% endhighlight %}

![saturation](../img/cartocss/saturation.jpg)

#### Color

Color keeps the source layer's hue and saturation levels, but renders a result with the brightness of the destination layers.

{% highlight css %}
marker-comp-op: color;
{% endhighlight %}

![color](../img/cartocss/color.jpg)

#### Value

Value keeps the brightness levels of the source, but renders a result with the hue and saturation levels of the destination layers.

{% highlight css %}
marker-comp-op: value;
{% endhighlight %}

![value](../img/cartocss/value.jpg)

#### Color-Burn

Color-burn works similarly to color-dodge, but has a darkening effect. It increases the contrast between source and destination layers, with pixels in your overlapping area tinted towards the source color. Use this when you want a darkening effect with more contrast than multiply or darken.

{% highlight css %}
marker-comp-op: color-burn;
{% endhighlight %}

![color-burn](../img/cartocss/color-burn.jpg)

For a good example of using darkening effects, view [this election map](https://team.carto.com/u/stuartlynn/viz/ab4541a4-767b-11e5-b637-0ea31932ec1d/public_map). Its lower layer shows population density with gray scale colors, and its upper layer shows U.S. political parties in red and blue. When you use a darkening composite operation, the polygons show voting results by political party, modulated by the population density.

![darken-use-case](../img/cartocss/darken-use-case.png)

#### Difference

The difference blending mode compares the source to the destination layers and finds the brightest color areas for each color channel. It gets the difference between color channel numbers by subtracting them from each other, and taking that absolute value. Using pure white inverts the colors it is blending with; black has no effect. In areas where the colors being compared are very close in value, the result is black.

{% highlight css %}
marker-comp-op: difference;
{% endhighlight %}

![difference](../img/cartocss/difference.jpg)

#### Exclusion

Exclusion is similar to difference, but less extreme. In areas where the colors being compared are very close in value, the result is lighter than black. For example, notice the gray areas where the circle is the same color as the layers beneath, in following map:

{% highlight css %}
marker-comp-op: exclusion;
{% endhighlight %}

![exclusion](../img/cartocss/exclusion.jpg)

#### Contrast

Contrast magnifies the difference between the dark and light areas of your overlapping layers. If the source layer color is lighter than 50% gray, the destination layers will show through the source layer with decreased contrast. If the source is darker than 50% gray, the destination layers will show through the source layer with increased contrast. Besides making lighter areas brighter and darker areas darker, this has the visual effect of erasing fine detail.

{% highlight css %}
marker-comp-op: contrast;
{% endhighlight %}

![contrast](../img/cartocss/contrast.jpg)

Use contrast effects when you are trying to control how both dark and light elements in your map stand out from the other elements, or blend in with them better. For example, compare the dark red and blue areas to the lighter colored areas in the [the map](http://bit.ly/1M4v9tW) below. Notice how the gray county outlines do not stand out as well against the darker red and blue backgrounds.  

![overlay-use-case-1](../img/cartocss/overlay-use-case-1.png)

Now, look how much more evenly the county lines blend with background colors in [this map](http://bit.ly/1M4v9tW). We have also kept the white state outlines.

![overlay-use-case-2](../img/cartocss/overlay-use-case-2.png)

#### Invert

Invert turns each RGB channel color into its opposite. Areas that look black originally will turn white, areas that look red will turn green, blues will turn orange, yellows will turn purple.

{% highlight css %}
marker-comp-op: invert;
{% endhighlight %}

![invert](../img/cartocss/invert.jpg)

#### Invert-RGB

Invert-rgb also inverts color channel colors, but then tints them towards the source color.

{% highlight css %}
marker-comp-op: invert-rgb;
{% endhighlight %}

![invert-rgb](../img/cartocss/invert-rgb.jpg)

### Alpha Blending Values

The following alpha blending values can be applied with the `comp-op` property and combine different levels of source transparency with destination layers. These are useful for masking parts of one layer with another. They use the shape of the layer to show or hide the rest of the rendered map, as opposed to altering the color of a layer.

**Tip:** Alpha values are useful when applying the `comp-op` property to the overall map style [effect](#composite-operation-effects). As an additional resource for working with alpha composition methods, see [Duff-Porter Alpha Composition Methods](http://www.imagemagick.org/Usage/compose/#duff-porter).

[src](#src) | [dst](#dst) | [src-over](#src-over)
[dst-over](#dst-over) | [src-in](#src-in) | [dst-in](#dst-in)
[src-out](#src-out) | [dst-out](#dst-out) | [src-atop](#src-atop)
[dst-atop](#dst-atop) | [xor](#xor) | [clear](#clear)

#### Src

Src is an alpha composite operation that keeps the full transparency of the source layer. Whether the source layer is above or below layers using other composite operations, it will show through completely opaque.

{% highlight css %}
marker-comp-op: src;
{% endhighlight %}

![src](../img/cartocss/src.jpg)

#### Dst

Dst is an alpha composite operation that keeps the full transparency of the destination layers. The source layer becomes invisible in areas where it is overlapping with the destination layers.

{% highlight css %}
marker-comp-op: dst;
{% endhighlight %}

![dst](../img/cartocss/dst.jpg)

#### Src-over

Src-over keeps the full transparency of both the source and destination layers. The visual effect is that the source layer shows on top of all layers involved in the overlap area.

{% highlight css %}
marker-comp-op: src-over;
{% endhighlight %}

![src-over](../img/cartocss/src-over.jpg)

#### Src-in

Src-in only shows the part of the source layer that intersects with the destination layer.

{% highlight css %}
marker-comp-op: src-in;
{% endhighlight %}

![src-in](../img/cartocss/src-in.jpg)

#### Src-out

Src-out only shows the part of the source layer that does not intersect with the destination layer. The destination layers are also not drawn within the area of overlap.

{% highlight css %}
marker-comp-op: src-out;
{% endhighlight %}

![src-out](../img/cartocss/src-out.jpg)

#### Src-atop

Src-atop makes sure that the source layer is shown at the top of all layers involved in the composite operation, within the area of overlap.

{% highlight css %}
marker-comp-op: src-atop;
{% endhighlight %}

![src-atop](../img/cartocss/src-atop.jpg)

#### Dst-over

Dst-over also keeps the full transparency of the source and destination layers, but its effect is that the source is shown beneath all destination layers.

{% highlight css %}
marker-comp-op: dst-over;
{% endhighlight %}

![dst-over](../img/cartocss/dst-over.jpg)

#### Dst-in

Inside the overlap area, dst-in only shows the destination layer.

{% highlight css %}
marker-comp-op: dst-in;
{% endhighlight %}

![dst-in](../img/cartocss/dst-in.jpg)

#### Dst-out

Dst-out only shows the part of the destination layer that does not overlap with the source layer. It also removes the source layer's color.

{% highlight css %}
marker-comp-op: dst-out;
{% endhighlight %}

![dst-out](../img/cartocss/dst-out.jpg)

#### Dst-atop

Dst-atop shows the destination layers on top of the source layer, in the places where they overlap.

{% highlight css %}
marker-comp-op: dst-atop;
{% endhighlight %}

![dst-atop](../img/cartocss/dst-atop.jpg)

#### Xor

Xor shows both the source and destination layers, but only the parts that do not overlap each other.

{% highlight css %}
marker-comp-op: xor;
{% endhighlight %}

![xor](../img/cartocss/xor.jpg)

#### Clear

The clear composite operation acts as an eraser. It makes all pixels transparent in the area where source and destination layers overlap.

{% highlight css %}
marker-comp-op: clear;
{% endhighlight %}

![clear](../img/cartocss/clear.jpg)

*[Contains public sector information licensed under the Open Government Licence v3.0.](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
* Null Island topography taken from USGS National Map. [Map services and data available from U.S. Geological Survey, National Geospatial Program.](http://viewer.nationalmap.gov/basic/?basemap=b1&category=ned,nedsrc&title=3DEP%20View)