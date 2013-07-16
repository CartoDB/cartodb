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

cdb.geo.ui.Legend = cdb.core.View.extend({

  className: "cartodb-legend",

  default_options: {

  },

  _updateLegendType: function() {
    var self = this;

    var legend_name = this._capitalize(this.model.get("type")) + "Legend";

    if (!cdb.geo.ui[legend_name]) return;

    if (this.view) this.view.clean();

      this.view = new cdb.geo.ui[legend_name] ({
        items: self.items
      });

    // Sets the type as the element class for styling
    this.$el.removeClass(this.model.previous("type"));
    this.$el.addClass(this.model.get("type"));

    this.render();

  },

  initialize: function() {

    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    this.map = this.options.map;

    this._setupModel();
    this._setupItems();

    this._updateLegendType();

  },

  _setupModel: function() {

    this.model = new cdb.core.Model({
      type: this.options.type || "custom"
    });

    this.add_related_model(this.model);

    this.model.bind("change:type", this._updateLegendType, this);

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
