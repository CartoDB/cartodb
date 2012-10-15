cdb.geo.ui.LegendItemModel = cdb.core.Model.extend({ });

cdb.geo.ui.LegendItems = Backbone.Collection.extend({
  model: cdb.geo.ui.LegendItemModel
});

cdb.geo.ui.LegendItem = cdb.core.View.extend({

  tagName: "li",

  initialize: function() {

    _.bindAll(this, "render");
    this.template = cdb.templates.getTemplate('templates/map/legend/item');

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));
    return this.$el;

  }

});

cdb.geo.ui.Legend = cdb.core.View.extend({

  id: "legend",

  default_options: {

  },

  initialize: function() {

    this.map = this.model;

    this.add_related_model(this.model);

    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    if (this.collection) {
      this.model.collection = this.collection;
    }

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/legend');
  },

  show: function() {
    this.$el.fadeIn(250);
  },

  hide: function() {
    this.$el.fadeOut(250);
  },

  render: function() {
    var self = this;

    if (this.model != undefined) {
      this.$el.html(this.template(this.model.toJSON()));
    }

    if (this.collection) {

      this.collection.each(function(item) {

        var view = new cdb.geo.ui.LegendItem({ className: item.get("className"), model: item });
        self.$el.find("ul").append(view.render());

      });
    }

    return this;
  }

});
