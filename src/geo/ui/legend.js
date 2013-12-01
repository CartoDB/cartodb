/*
 * Model for the legend item
 *
 * */

cdb.geo.ui.LegendItemModel = cdb.core.Model.extend({

  defaults: {
    name: "Untitled",
    value: ""
  }

});

/*
 * Collection of items for a legend
 *
 * */

cdb.geo.ui.LegendItems = Backbone.Collection.extend({
  model: cdb.geo.ui.LegendItemModel
});

/*
 * Legend item
 *
 * */

cdb.geo.ui.LegendItem = cdb.core.View.extend({

  tagName: "li",

  initialize: function() {

    _.bindAll(this, "render");

    this.template = this.options.template ? _.template(this.options.template) : cdb.templates.getTemplate('geo/legend');

  },

  render: function() {

    var value;

    if (this.model.get("type") == 'image' && this.model.get("value")) {
      value = "url( " + this.model.get("value") + ")";
    } else {
      value = this.model.get("value");
    }

    var options = _.extend( this.model.toJSON(), { value: value });

    this.$el.html(this.template(options));

    return this.$el;

  }

});

/*
 * Legend View: wrapper for the different types of lengeds
 *
 * */

cdb.geo.ui.Legend = cdb.core.View.extend({

  className: "cartodb-legend",

  events: {

    "dragstart":            "_stopPropagation",
    "mousedown":            "_stopPropagation",
    "touchstart":           "_stopPropagation",
    "MSPointerDown":        "_stopPropagation",
    "dblclick":             "_stopPropagation",
    "mousewheel":           "_stopPropagation",
    "DOMMouseScroll":       "_stopPropagation",
    "dbclick":              "_stopPropagation",
    "click":                "_stopPropagation"

  },

  initialize: function() {

    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    this.map = this.options.map;

    this._setupModel();
    this._setupItems();

    this._updateLegendType();

  },

  _stopPropagation: function(ev) {

    ev.stopPropagation();

  },

  _setupModel: function() {

    if (!this.model) {

      this.model = new cdb.geo.ui.LegendModel({
        type: this.options.type || cdb.geo.ui.LegendModel.prototype.defaults.type,
        title: this.options.title || cdb.geo.ui.LegendModel.prototype.defaults.title,
        show_title: this.options.show_title || cdb.geo.ui.LegendModel.prototype.defaults.show_title
      });

    }

    this.add_related_model(this.model);

    this.model.bind("change:type change:items change:title change:show_title",  this._updateLegendType, this);

  },

  _updateLegendType: function() {

    var type = this.model.get("type");

    this.legend_name = this._capitalize(type) + "Legend";

    if (type == 'none' || type == null) {

      this.legend_name = null;
      this.model.set({ type: "none" }, { silent: true });

    } else if (!cdb.geo.ui[this.legend_name]) {

      // set the previous type
      this.legend_name = null;
      this.model.set({ type: this.model.previous("type") }, { silent: true });
      return;

    }

    this._refresh();

  },

  _refresh: function() {

    var self = this;

    if (this.view) this.view.clean();

    var type  = this.model.get("type");
    var title = this.model.get("title");
    var show_title = this.model.get("show_title");

    if (type && this.legend_name) {

      this.view = new cdb.geo.ui[this.legend_name] ({
        title: title,
        show_title: show_title,
        items: self.items
      });

      // Set the type as the element class for styling
      this.$el.removeClass();
      this.$el.addClass(this.className + " " + this.model.get("type"));

      this.show();

    } else {

      this.hide();

      this.$el.removeClass();
      this.$el.addClass(this.className + " none");

    }

    this.render();

  },

  _setupItems: function() {

    var self = this;

    this.items = this.model.items;

    if (this.options.data) {
      this.items.reset(this.options.data);
    }

    this.items.bind("add remove change:value change:name", this.render, this);

  },

  show: function(callback) {
    if (this.model.get("type")) this.$el.show();
  },

  hide: function(callback) {
    if (this.model.get("type")) this.$el.hide();
  },

  _capitalize: function(string) {
    if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  },

  render: function() {

    if (this.view) {
      this.$el.append(this.view.render().$el);
    }

    return this;
  }

});


/*
 * DebugLegend
 *
 * */
cdb.geo.ui.DebugLegend = cdb.core.View.extend({ });

/*
 * BaseLegend: common methods for all the legends
 *
 * */
cdb.geo.ui.BaseLegend = cdb.core.View.extend({

  _bindModel: function() {

    this.model.bind("change:title change:show_title", this.render, this);

  },

  setTitle: function(title) {
    this.model.set("title", title);
  },

  showTitle: function() {
    this.model.set("show_title", true);
  },

  hideTitle: function() {
    this.model.set("show_title", false);
  }

});

/*
 * ChoroplethLegend
 *
 * */
cdb.geo.ui.ChoroplethLegend = cdb.geo.ui.BaseLegend.extend({

  className: "choropleth-legend",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul><li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph count_<%= buckets_count %>"><div class="colors"><%= colors %></div></li></ul>'),

  initialize: function() {

    this.title        = this.options.title;
    this.show_title   = this.options.show_title;

    this.items    = this.options.items;
    this.model    = new cdb.core.Model();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:colors change:leftLabel change:rightLabel", this.render, this);

  },

  setLeftLabel: function(text) {

    this.model.set("leftLabel", text);

  },

  setRightLabel: function(text) {

    this.model.set("rightLabel", text);

  },

  setColors: function(colors) {

    this.model.set("colors", colors);

  },

  render: function() {

    if (this.items.length >= 2) {

      this.leftLabel  = this.items.at(0);
      this.rightLabel = this.items.at(1);

      var leftLabel   = this.leftLabel.get("value");
      var rightLabel  = this.rightLabel.get("value");

      var colors = "";

      for (var i = 2; i < this.items.length; i++) {
        var color = this.items.at(i).get("value");
        colors += '<div class="quartile" style="background-color:'+color+'"></div>';
      }

      this.model.set({ title: this.title, show_title: this.show_title, leftLabel: leftLabel, rightLabel: rightLabel, colors: colors, buckets_count: this.items.length - 2 });

      this.$el.html(this.template(this.model.toJSON()));
    }

    return this;

  }

});

/*
 * DensityLegend
 *
 * */
cdb.geo.ui.DensityLegend = cdb.geo.ui.BaseLegend.extend({

  className: "density-legend",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul><li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph count_<%= buckets_count %>"><div class="colors"><%= colors %></div></li></ul>'),

  initialize: function() {

    this.title       = this.options.title;
    this.show_title  = this.options.show_title;

    this.items    = this.options.items;
    this.model    = new cdb.core.Model();

    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:colors change:leftLabel change:rightLabel", this.render, this);
    this.model.bind("change:colors", this.render, this);
    this.model.bind("change:leftLabel change:rightLabel", this.render, this);

  },

  setLeftLabel: function(text) {

    this.model.set("leftLabel", text);

  },

  setRightLabel: function(text) {

    this.model.set("rightLabel", text);

  },

  setColors: function(colors) {

    this.model.set("colors", colors);

  },

  render: function() {

    if (this.items.length >= 2) {

      this.leftLabel  = this.items.at(0);
      this.rightLabel = this.items.at(1);

      var leftLabel   = this.leftLabel.get("value");
      var rightLabel  = this.rightLabel.get("value");

      var colors = "";

      for (var i = 2; i < this.items.length; i++) {
        var color = this.items.at(i).get("value");
        colors += '<div class="quartile" style="background-color:'+color+'"></div>';
      }

      this.model.set({ title: this.title, show_title: this.show_title, leftLabel: leftLabel, rightLabel: rightLabel, colors: colors, buckets_count: this.items.length - 2 });

      this.$el.html(this.template(this.model.toJSON()));
    }

    return this;

  }

});

/*
 * Density Legend public interface
 *
 * */
cdb.geo.ui.Legend.Density = cdb.geo.ui.DensityLegend.extend({

  type: "density",

  className: "cartodb-legend density",

  initialize: function() {

    this.items    = this.options.items;

    this.model = new cdb.geo.ui.LegendModel({
      type:          this.type,
      title:         this.options.title,
      show_title:    this.options.title ? true : false,
      leftLabel:     this.options.left,
      rightLabel:    this.options.right,
      colors:        this.options.colors,
      buckets_count: this.options.colors ? this.options.colors.length : 0
    });

    this.add_related_model(this.model);
    this._bindModel();

  },

  _generateColorList: function() {

    return _.map(this.model.get("colors"), function(color) {
      return '<div class="quartile" style="background-color:' + color + '"></div>';
    }).join("");

  },

  render: function() {

    var options = _.extend(this.model.toJSON(), { colors: this._generateColorList() });

    this.$el.html(this.template(options));

    return this;

  }

});




/*
 * IntensityLegend
 *
 * */
cdb.geo.ui.IntensityLegend = cdb.geo.ui.BaseLegend.extend({

  className: "intensity-legend",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul><li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph"></li></ul>'),

  initialize: function() {

    this.title       = this.options.title;
    this.show_title  = this.options.show_title;
    this.items       = this.options.items;
    this.model       = new cdb.core.Model();

  },

  _hexToRGB: function(hex) {

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;

  },

  _rgbToHex: function(r, g, b) {

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  },

  _calculateMultiply: function(color, steps) {

    var colorHex = this._hexToRGB(color);

    if (colorHex) {

      var r = colorHex.r;
      var g = colorHex.g;
      var b = colorHex.b;

      for (var i = 0; i <= steps; i++) {
        r = Math.round(r * colorHex.r/255);
        g = Math.round(g * colorHex.g/255);
        b = Math.round(b * colorHex.b/255);
      }

      return this._rgbToHex(r,g,b);

    }

    return "#ffffff";

  },

  _renderGraph: function(baseColor) {

    var s = "";

    s+= "background: <%= color %>;";
    s+= "background: -moz-linear-gradient(left, <%= color %> 0%, <%= right %> 100%);";
    s+= "background: -webkit-gradient(linear, left top, right top, color-stop(0%,<%= color %>), color-stop(100%,<%= right %>));";
    s+= "background: -webkit-linear-gradient(left, <%= color %> 0%,<%= right %> 100%);";
    s+= "background: -o-linear-gradient(left, <%= color %> 0%,<%= right %> 100%);";
    s+= "background: -ms-linear-gradient(left, <%= color %> 0%,<%= right %> 100%)";
    s+= "background: linear-gradient(to right, <%= color %> 0%,<%= right %> 100%);";
    s+= "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='<%= color %>', endColorstr='<%= right %>',GradientType=1 );";
    s+= "background-image: -ms-linear-gradient(left, <%= color %> 0%,<%= right %> 100%)";

    var backgroundStyle = _.template(s);

    var multipliedColor = this._calculateMultiply(baseColor, 4);

    this.$el.find(".graph").attr("style", backgroundStyle({ color: baseColor, right: multipliedColor }));

  },

  render: function() {

    if (this.items.length >= 3) {

      this.leftLabel  = this.items.at(0);
      this.rightLabel = this.items.at(1);
      this.color      = this.items.at(2);

      var leftLabel   = this.leftLabel.get("value");
      var rightLabel  = this.rightLabel.get("value");

      this.model.set({ title: this.title, show_title: this.show_title, leftLabel: leftLabel, rightLabel: rightLabel });

      this.$el.html(this.template(this.model.toJSON()));

      this._renderGraph(this.color.get("value"));
    }

    return this;

  }

});

/*
 * CategoryLegend
 *
 * */
cdb.geo.ui.CategoryLegend = cdb.geo.ui.BaseLegend.extend({

  className: "category-legend",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul></ul>'),

  initialize: function() {

    this.title       = this.options.title;
    this.show_title  = this.options.show_title;

    this.items = this.options.items;
    this.model = new cdb.core.Model({
      type: "custom",
      title: this.title,
      show_title: this.show_title
    });

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new cdb.geo.ui.LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0 || item.get("type") && item.get("type") == 'image') ? "bkg" : "",
      template: '<div class="bullet" style="background: <%= value %>"></div><%= name || ((name === false) ? "false": "null") %>'
    });

    this.$el.find("ul").append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<div class="warning">The category legend is empty</div>');
    }

    return this;

  }

});

/*
 * Category Legend public interface
 *
 * */
cdb.geo.ui.Legend.Category = cdb.geo.ui.CategoryLegend.extend({

  className: "cartodb-legend category",

  type: "category",

  initialize: function() {

    this.items = new cdb.geo.ui.LegendItems(this.options.data);

    this.model = new cdb.geo.ui.LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false
    });

    this._bindModel();

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderItems();

    return this;

  }

});



/*
 * ColorLegend
 *
 * */
cdb.geo.ui.ColorLegend = cdb.geo.ui.BaseLegend.extend({

  className: "color-legend",

  type: "color",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul></ul>'),

  initialize: function() {

    this.title       = this.options.title;
    this.show_title  = this.options.show_title;

    this.items = this.options.items;

    this.model = new cdb.core.Model({
      type: this.type,
      title: this.title,
      show_title: this.show_title
    });

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new cdb.geo.ui.LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0) ? "bkg" : "",
      template: '<div class="bullet" style="background: <%= value %>"></div><%= name || ((name === false) ? "false": "null") %>'
    });

    this.$el.find("ul").append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<div class="warning">The color legend is empty</div>');
    }

    return this;

  }

});

/*
 * Color Legend public interface
 *
 * */
cdb.geo.ui.Legend.Color = cdb.geo.ui.Legend.Category.extend({ });

/*
 * StackedLegend
 *
 * */
cdb.geo.ui.StackedLegend = cdb.core.View.extend({

  events: {

    "dragstart":            "_stopPropagation",
    "mousedown":            "_stopPropagation",
    "touchstart":           "_stopPropagation",
    "MSPointerDown":        "_stopPropagation",
    "dblclick":             "_stopPropagation",
    "mousewheel":           "_stopPropagation",
    "DOMMouseScroll":       "_stopPropagation",
    "dbclick":              "_stopPropagation",
    "click":                "_stopPropagation"

  },

  className: "cartodb-legend-stack",

  initialize: function() {

    _.each(this.options.legends, this._setupBinding, this);

  },

  _stopPropagation: function(ev) {

    ev.stopPropagation();

  },

  //TODO: change this method to
  // getLegendByIndex
  getLayerByIndex: function(index) {
    if (!this._layerByIndex) {
      this._layerByIndex = {};
      var legends = this.options.legends;
      for (var i = 0; i < legends.length; ++i) {
        var legend = legends[i];
        this._layerByIndex[legend.options.index] = legend;
      }
    }
    return this._layerByIndex[index];
  },

  _setupBinding: function(legend) {

    legend.model.bind("change:type", this._checkVisibility, this);
    this.add_related_model(legend.model);

  },

  _checkVisibility: function() {

    var visible = _.some(this.options.legends, function(legend) {
      return legend.model.get("type")
    }, this);

    if (visible) {
      this.show();
    } else {
      this.hide();
    }

    _.each(this.options.legends, function(item) {

      var type = item.model.get("type");

      if (type != "none") {
        item.show();
      } else {
        item.hide();
      }

    }, this);


  },

  _renderItems: function() {

    _.each(this.options.legends, function(item) {
      this.$el.append(item.render().$el);
    }, this);

  },

  show: function() {
    this.$el.show();
  },

  hide: function() {
    this.$el.hide();
  },

  render: function() {

    this._renderItems();
    this._checkVisibility();

    return this;

  }

});

cdb.geo.ui.Legends = Backbone.Collection.extend({
  model: cdb.geo.ui.LegendModel
});

/*
 * Stacked Legend public interface
 *
 * */
cdb.geo.ui.Legend.Stacked = cdb.geo.ui.StackedLegend.extend({

  initialize: function() {

    var legendModels = _.map(this.options.legends, function(legend) {
      return new cdb.geo.ui.LegendModel(legend);
    });

    this.legendItems = new cdb.geo.ui.Legends(legendModels);

    this.legendItems.bind("add remove change", this.render, this);

  },

  render: function() {

    this.$el.empty();

    this.legends = [];

    this.legendItems.each(function(model) {

      var type = model.get("type");

      if (!type) type = "custom";

      type = type.charAt(0).toUpperCase() + type.slice(1);

      var view = new cdb.geo.ui.Legend[type](model.attributes);
      this.legends.push(view);

      this.$el.append(view.render().$el);

    }, this);

    return this;

  },

  getLegendAt: function(n) {

    return this.legends[n];

  },

  addLegend: function(attributes) {

    var legend = new cdb.geo.ui.LegendModel(attributes);
    this.legendItems.push(legend);

  },

  removeLegendAt: function(n) {

    var legend = this.legendItems.at(n);
    this.legendItems.remove(legend);

  }

});


/*
 * Legend Model
 *
 * */
cdb.geo.ui.LegendModel = cdb.core.Model.extend({

  defaults: {
    type: null,
    show_title: false,
    title: ""
  },

  initialize: function() {

    this.items = new cdb.geo.ui.LegendItems(this.get("items"));

    this.items.bind("add remove reset change", function() {
      this.set({ items: this.items.toJSON() });
    }, this);

    this.bind("change:items", this._onUpdateItems, this);
    this.bind("change:title change:show_title", this._onUpdateTitle, this);

  },

  _onUpdateTitle: function() {
    this.title = this.get("title");
    this.show_title = this.get("show_title");
  },

  _onUpdateItems: function() {
    var items = this.get("items");
    this.items.reset(items);
  }

});






/*
 * CustomLegend
 *
 * */
cdb.geo.ui.CustomLegend = cdb.geo.ui.BaseLegend.extend({

  className: "custom-legend",
  type: "custom",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul></ul>'),

  initialize: function() {

    this.items = this.options.items;

    this.model = new cdb.core.Model({
      type:  this.type,
      title: this.options.title,
      show_title: this.options.show_title
    });

    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title", this.render, this);
    this.model.bind("change:data", this._updateData, this);

  },

  _updateData: function() {

    this.items = new cdb.geo.ui.LegendItems(this.model.get("data"));
    this.render();

  },

  setData: function(data) {

    this.model.set("data", data);

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new cdb.geo.ui.LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0) ? "bkg" : "",
      template: '<div class="bullet" style="background:<%= value %>"></div><%= name || "null" %>'
    });

    this.$el.find("ul").append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<div class="warning">The legend is empty</div>');
    }

    return this;

  }

});

/*
 * Custom Legend public interface
 *
 * */
cdb.geo.ui.Legend.Custom = cdb.geo.ui.CustomLegend.extend({

  className: "cartodb-legend custom",

  type: "custom",

  initialize: function() {

    this.items = new cdb.geo.ui.LegendItems(this.options.data);

    this.model = new cdb.geo.ui.LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false
    });

    this._bindModel();

  }

});

/*
 * BubbleLegend
 *
 * */
cdb.geo.ui.BubbleLegend = cdb.geo.ui.BaseLegend.extend({

  className: "bubble-legend",

  template: _.template('<% if (title && show_title) { %><div class="legend-title"><%= title %></div><% } %><ul><li><%= min %></li><li class="graph"><div class="bubbles"></div></li><li><%= max %></li></ul>'),

  initialize: function() {

    this.items = this.options.items;

    this.model = new cdb.core.Model();

    this.add_related_model(this.model);

    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:color change:min change:max", this.render, this);

  },

  setColor: function(color) {
    this.model.set("color", color);
  },

  setMinValue: function(value) {
    this.model.set("min", value);
  },

  setMaxValue: function(value) {
    this.model.set("max", value);
  },

  _renderGraph: function(color) {
    this.$el.find(".graph").css("background", color);
  },

  render: function() {

    var color = this.items.length >= 3 ? this.items.at(2).get("value") : "";

    if (this.items.length >= 3) {

      var min = this.items.at(0);
      var max = this.items.at(1);

      this.model.set({ title: this.options.title, show_title: this.options.show_title, min: min.get("value"), max: max.get("value") });

      this.$el.html(this.template(this.model.toJSON()));

    }

    this._renderGraph(color);

    return this;

  }

});


/*
 * Bubble Legend public interface
 *
 * */
cdb.geo.ui.Legend.Bubble = cdb.geo.ui.BubbleLegend.extend({

  className: "cartodb-legend bubble",

  type: "bubble",

  initialize: function() {

    this.model = new cdb.geo.ui.LegendModel({
      type:  this.type,
      title: this.options.title,
      min:   this.options.min,
      max:   this.options.max,
      color: this.options.color,
      show_title: this.options.title ? true : false
    });

    this.add_related_model(this.model);

    this._bindModel();

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph(this.model.get("color"));

    return this;

  }

});

/*
 * Choropleth Legend public interface
 *
 * */
cdb.geo.ui.Legend.Choropleth = cdb.geo.ui.ChoroplethLegend.extend({

  type: "choropleth",

  className: "cartodb-legend choropleth",

  initialize: function() {

    this.items    = this.options.items;

    this.model = new cdb.geo.ui.LegendModel({
      type:          this.type,
      title:         this.options.title,
      show_title:    this.options.title ? true : false,
      leftLabel:     this.options.left,
      rightLabel:    this.options.right,
      colors:        this.options.colors,
      buckets_count: this.options.colors ? this.options.colors.length : 0
    });

    this.add_related_model(this.model);
    this._bindModel();

  },

  _generateColorList: function() {

    return _.map(this.model.get("colors"), function(color) {
      return '<div class="quartile" style="background-color:' + color + '"></div>';
    }).join("");

  },

  render: function() {

    var options = _.extend(this.model.toJSON(), { colors: this._generateColorList() });

    this.$el.html(this.template(options));

    return this;

  }

});


/*
 * Intensity Legend public interface
 *
 * */
cdb.geo.ui.Legend.Intensity = cdb.geo.ui.IntensityLegend.extend({

  className: "cartodb-legend intensity",
  type: "intensity",

  initialize: function() {

    this.items = this.options.items;

    this.model = new cdb.geo.ui.LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false,
      color: this.options.color,
      leftLabel: this.options.left,
      rightLabel: this.options.right
    });

    this.add_related_model(this.model);
    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:color change:leftLabel change:rightLabel", this.render, this);

  },

  setColor: function(color) {

    this.model.set("color", color);

  },

  setLeftLabel: function(text) {

    this.model.set("leftLabel", text);

  },

  setRightLabel: function(text) {

    this.model.set("rightLabel", text);

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph(this.model.get("color"));

    return this;

  }

});
