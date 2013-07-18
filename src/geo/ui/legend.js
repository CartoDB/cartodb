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
    this.model = new cdb.core.Model();
  },

  _renderGraph: function() {

  },

  render: function() {

    var min = this.items.at(0);
    var max = this.items.at(this.items.length - 1);

    this.model.set({ min: min.get("name"), max: max.get("name") });
    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph();

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

  },

  _renderItems: function() {

    var self = this;


    _.each(this.options.legends, function(item) {
      self.$el.append(item.render().$el);
    });

  },

  render: function() {

    this._renderItems();

    return this;

  }

});

cdb.geo.ui.LegendModel = cdb.core.Model.extend({

  defaults: {
    type: "custom"
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

    this.legend_name = this._capitalize(this.model.get("type")) + "Legend";

    if (!cdb.geo.ui[this.legend_name]) {
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

    this.view = new cdb.geo.ui[this.legend_name] ({
      items: self.items
    });

    // Set the type as the element class for styling
    this.$el.removeClass(this.model.previous("type"));
    this.$el.addClass(this.model.get("type"));

    this.render();

  },

  _setupItems: function() {

    var self = this;

    this.items = new cdb.geo.ui.LegendItems();

    _.each(this.options.data, function(item) {
      self.items.add(item);
    });

  },

  show: function() {
    this.$el.fadeIn(250);
  },

  hide: function() {
    this.$el.fadeOut(250);
  },

  _capitalize: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  render: function() {

    this.$el.append(this.view.render().$el);

    return this;
  }

});
