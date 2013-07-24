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

    this.items = this.options.items;
    this.template = _.template('<li class="min"><%= min %></li><li class="max"><%= max %></li><li class="graph"></li>');
    this.model = new cdb.core.Model();

  },

  _renderGraph: function() {

    var s = "";

    s+= "background: <%= left %>;";
    s+= "background: -moz-linear-gradient(left, <%= left %> 0%, <%= right %> 100%);";
    s+= "background: -webkit-gradient(linear, left top, right top, color-stop(0%,<%= left %>), color-stop(100%,<%= right %>));";
    s+= "background: -webkit-linear-gradient(left, <%= left %> 0%,<%= right %> 100%);";
    s+= "background: -o-linear-gradient(left, <%= left %> 0%,<%= right %> 100%);";
    s+= "background: -ms-linear-gradient(left, <%= left %> 0%,<%= right %> 100%)";
    s+= "background: linear-gradient(to right, <%= left %> 0%,<%= right %> 100%);";
    s+= "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='<%= left %>', endColorstr='<%= right %>',GradientType=1 );";

    var backgroundStyle = _.template(s);

    this.$el.find(".graph").attr("style", backgroundStyle({ left: this.min.get("value"), right: this.max.get("value") }));
  },

  render: function() {

    this.min = this.items.at(0);
    this.max = this.items.at(this.items.length - 1);

    this.model.set({ min: this.min.get("name"), max: this.max.get("name") });
    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph();

    return this;

  }

});

/*
 * BubbleLegend
 *
 * */
cdb.geo.ui.BubbleLegend = cdb.core.View.extend({

  tagName: "ul",

  initialize: function() {

    this.items = this.options.items;
    this.template = _.template('<li><%= min %></li><li class="graph"></li><li><%= max %></li>');
    this.model    = new cdb.core.Model();

    this.add_related_model(this.model);

  },

  _renderGraph: function() {
    this.$el.find(".graph").css("background", this.items.at(0).get("value"));
    // TODO
  },

  render: function() {

    var min = this.items.at(1);
    var max = this.items.at(this.items.length - 1);

    this.model.set({ min: min.get("value"), max: max.get("value") });
    this.$el.html(this.template(this.model.toJSON()));

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

    var self = this;

    this.items.each(function(item) {

      view = new cdb.geo.ui.LegendItem({
        model: item,
        template: '<div class="bullet" style="background:<%= value %>"></div><%= name || "null" %>'
      });

      self.$el.append(view.render());

    });

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));
    this._renderItems();

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

    var self = this;

    this.items.each(function(item) {

      view = new cdb.geo.ui.LegendItem({
        model: item,
        template: '<div class="bullet" style="background:<%= value %>"></div><%= name %>'
      });

      self.$el.append(view.render());

    });

    //if (this.items.length == 0) this.hide();
    //else this.show();

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));
    this._renderItems();

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

    this.bind("change:items", function() {
      this.items.reset(this.get("items"));
    }, this);

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
    this.model.bind("change:type", this._updateLegendType, this);

  },

  _updateLegendType: function() {

    var type = this.model.get("type");

    this.legend_name = this._capitalize(type) + "Legend";

    if (type == 'none') {

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

      this.hide(function() {
        self.$el.removeClass();
        self.$el.addClass(this.className + " none");
      });

    }

    this.render();

  },

  _setupItems: function() {

    var self = this;

    this.items = this.model.items;

    this.items.bind("add remove change:value change:name", this.render, this);

  },

  show: function(callback) {
    this.$el.fadeIn(250, function() {
      callback && callback();
    });
  },

  hide: function(callback) {

    this.$el.fadeOut(250, function() {
      callback && callback();
    });

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

    console.log(this.model.get("type"));

    //if (this.model.get("type")) this.show();
    //else this.hide();

    return this;
  }

});
