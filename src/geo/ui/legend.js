cdb.geo.ui.LegendItemModel = cdb.core.Model.extend({

  defaults: {
    name: "Untitled",
    value: ""
  }

});

cdb.geo.ui.LegendItems = Backbone.Collection.extend({
  model: cdb.geo.ui.LegendItemModel
});

cdb.geo.ui.LegendItem = cdb.core.View.extend({

  tagName: "li",

  initialize: function() {

    _.bindAll(this, "render");

    this.template = this.options.template ? _.template(this.options.template) : cdb.templates.getTemplate('geo/legend');

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    return this.$el;

  }

});

/*
 * ChoroplethLegend
 *
 * */
cdb.geo.ui.ChoroplethLegend = cdb.core.View.extend({

  tagName: "ul",
  initialize: function() {

    this.items    = this.options.items;
    this.template = _.template('<li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph count_<%= buckets_count %>"><div class="colors"><%= colors %></div></li>');
    this.model    = new cdb.core.Model();

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

      this.model.set({ leftLabel: leftLabel, rightLabel: rightLabel, colors: colors, buckets_count: this.items.length - 2 });

      this.$el.html(this.template(this.model.toJSON()));
    }

    return this;

  }

});

/*
 * DensityLegend
 *
 * */
cdb.geo.ui.DensityLegend = cdb.core.View.extend({

  tagName: "ul",
  initialize: function() {

    this.items    = this.options.items;
    this.template = _.template('<li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph count_<%= buckets_count %>"><div class="colors"><%= colors %></div></li>');
    this.model    = new cdb.core.Model();

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

      this.model.set({ leftLabel: leftLabel, rightLabel: rightLabel, colors: colors, buckets_count: this.items.length - 2 });

      this.$el.html(this.template(this.model.toJSON()));
    }

    return this;

  }

});

/*
 * IntensityLegend
 *
 * */
cdb.geo.ui.IntensityLegend = cdb.core.View.extend({

  tagName: "ul",
  initialize: function() {

    this.items    = this.options.items;
    this.template = _.template('<li class="min"><%= leftLabel %></li><li class="max"><%= rightLabel %></li><li class="graph"></li>');
    this.model    = new cdb.core.Model();

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

  _renderGraph: function() {

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

    var baseColor       = this.color.get("value");
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

      this.model.set({ leftLabel: leftLabel, rightLabel: rightLabel });

      this.$el.html(this.template(this.model.toJSON()));

      this._renderGraph();
    }

    return this;

  }

});

cdb.geo.ui.DebugLegend = cdb.core.View.extend({
});

/*
 * BubbleLegend
 *
 * */
cdb.geo.ui.BubbleLegend = cdb.core.View.extend({

  tagName: "ul",

  initialize: function() {

    this.items = this.options.items;
    this.template = _.template('<li><%= min %></li><li class="graph"><div class="bubbles"></div></li><li><%= max %></li>');
    this.model    = new cdb.core.Model();

    this.add_related_model(this.model);

  },

  _renderGraph: function() {
    if (this.items.length >= 3) {
      this.$el.find(".graph").css("background", this.items.at(2).get("value"));
    }
  },

  render: function() {

    if (this.items.length >= 3) {

      var min = this.items.at(0);
      var max = this.items.at(1);

      this.model.set({ min: min.get("value"), max: max.get("value") });
      this.$el.html(this.template(this.model.toJSON()));

    }

    this._renderGraph();

    return this;

  }

});

/*
 * ColorLegend
 *
 * */
cdb.geo.ui.ColorLegend = cdb.core.View.extend({

  tagName: "ul",

  initialize: function() {

    this.items = this.options.items;
    this.template = _.template("");
    this.model = new cdb.core.Model({
      type: "custom"
    });

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new cdb.geo.ui.LegendItem({
      model: item,
      template: '<div class="bullet" style="background:<%= value %>"></div><%= name || "null" %>'
    });

    this.$el.append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<li class="warning">The color legend is empty</li>');
    }

    return this;

  }

});

/*
 * CustomLegend
 *
 * */
cdb.geo.ui.CustomLegend = cdb.core.View.extend({

  tagName: "ul",

  initialize: function() {

    this.items = this.options.items;
    this.template = _.template("");
    this.model = new cdb.core.Model({
      type: "custom"
    });

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new cdb.geo.ui.LegendItem({
      model: item,
      template: '<div class="bullet" style="background:<%= value %>"></div><%= name || "null" %>'
    });

    this.$el.append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<li class="warning">The legend is empty</li>');
    }

    return this;

  }

});

/*
 *    var legendA = new cdb.geo.ui.Legend({
 *      type: "custom",
 *      data: [
 *        { name: "Category 1", value: "#FFC926" },
 *        { name: "Category 2", value: "#76EC00" },
 *        { name: "Category 3", value: "#00BAF8" },
 *        { name: "Category 4", value: "#D04CFD" }
 *      ]
 *    });
 *
 *    var legendB = new cdb.geo.ui.Legend({
 *      type: "bubble",
 *      data: [
 *        { name: "21,585",     value: "#FFC926" },
 *        { name: "91,585",     value: "#D04CFD" }
 *      ]
 *    });
 *
 *    var stackedLegend = new cdb.geo.ui.StackedLegend({
 *      legends: [legendA, legendB, …]
 *    });
 *
 *    $("#overlay").append(stackedLegend.render().$el);
 *
 *
 * */

cdb.geo.ui.StackedLegend = cdb.core.View.extend({

  className: "cartodb-legend-stack",

  initialize: function() {

    _.each(this.options.legends, this._setupBinding, this);

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

      if (item.model.get("type")) {
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

cdb.geo.ui.LegendModel = cdb.core.Model.extend({

  defaults: {
    type: null
  },

  initialize: function() {

    this.items = new cdb.geo.ui.LegendItems(this.get("items"));

    this.items.bind("add remove reset change", function() {
      this.set("items", this.items.toJSON());
    }, this);

    this.bind("change:items", this._onUpdateItems, this);

  },

  _onUpdateItems: function() {
    var items = this.get("items");
    this.items.reset(items);
  }

});

/*
 * Legend
 *
 */

cdb.geo.ui.Legend = cdb.core.View.extend({

  className: "cartodb-legend",

  initialize: function() {

    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    this.map = this.options.map;

    this._setupModel();
    this._setupItems();

    this._updateLegendType();

  },

  _setupModel: function() {

    if (!this.model) {

      this.model = new cdb.geo.ui.LegendModel({
        type: this.options.type || cdb.geo.ui.LegendModel.prototype.defaults.type
      });

    }

    this.add_related_model(this.model);
    this.model.bind("change:type",  this._updateLegendType, this);
    this.model.bind("change:items", this._updateLegendType, this);

  },

  _updateLegendType: function() {

    var type = this.model.get("type");

    this.legend_name = this._capitalize(type) + "Legend";

    if (type == 'none' || type == null) {

      this.legend_name = null;
      this.model.set({ type: null}, { silent: true });

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

    var type = this.model.get("type");

    if (type) {

      this.view = new cdb.geo.ui[this.legend_name] ({
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
