# Specific UI functions

There are a few functions in CartoDB.js for creating, enabling, and disabling pieces of the user interface.

## cartodb.geo.ui.Tooltip

Shows a small tooltip on hover:

<div class="code-title">cartodb.geo.ui.Tooltip</div>
{% highlight javascript %}
var tooltip = vis.addOverlay({
  type: 'tooltip',
  template: '<p>{% raw %}{{variable}}{% endraw %}</p>' // mustache template
});
{% endhighlight %}

### cartodb.geo.ui.Tooltip.enable()

The tooltip is shown when hover on feature when is called.

### cartodb.geo.ui.Tooltip.disable()

The tooltip is not shown when hover on feature.

## cartodb.geo.ui.InfoBox

Shows a small box when the user hovers on a map feature. The position is fixed:

<div class="code-title">cartodb.geo.ui.InfoBox</div>
{% highlight javascript %}
var box = vis.addOverlay({
  type: 'infobox',
  template: '<p>{% raw %}{{name_to_display}}{% endraw %}</p>',
  width: 200, // width of the box
  position: 'bottom|right' // top, bottom, left and right are available
});
{% endhighlight %}

### cartodb.geo.ui.InfoBox.enable()

The tooltip is shown when hover on feature.

### cartodb.geo.ui.InfoBox.disable()

The tooltip is not shown when hover on feature.

## cartodb.geo.ui.Zoom

Shows the zoom control:

<div class="code-title">cartodb.geo.ui.Zoom</div>
{% highlight javascript %}
vis.addOverlay({ type: 'zoom' });
{% endhighlight %}

### cartodb.geo.ui.Zoom.show()

### cartodb.geo.ui.Zoom.hide()
