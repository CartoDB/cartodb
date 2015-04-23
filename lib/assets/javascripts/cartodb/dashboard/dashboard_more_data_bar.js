
/**
 *  Show some data when user don't have
 *  enough tables in his/her account
 *
 */


cdb.admin.MoreDataBarItem = cdb.core.View.extend({

  tagName: "li",

  initialize: function() {

    this.template = _.template('<a class="population import_example" href="<%- url %>"><%- title %></a>');

  },

  render: function() {

    var template = this.template(this.model.toJSON());

    this.$el.html(template);

    return this.$el;
  }

});


cdb.admin.dashboard.MoreDataBar = cdb.core.View.extend({

  // Number of items to render
  _TOTAL_ITEMS: 4,

  tagName: "article",
  className: "more_data",

  events: {
    'click ul li a': '_onClickDataset'
  },

  initialize: function() {
    _.bindAll(this, '_onClickDataset');

    this.model      = new cdb.core.Model();
    this.model.bind('change:visible', this._toggleVisibility, this);

    this.data = _.shuffle([
      { title: "Import a dataset of World Countries Borders",      url: "http://cartodb.s3.amazonaws.com/static/TM_WORLD_BORDERS_SIMPL-0.3.zip" },
      { title: "Import a dataset of Areas of Human Habitation",        url: "http://cartodb.s3.amazonaws.com/static/50m-urban-area.zip" },
      { title: "Import a dataset of European Countries", url: "http://cartodb.s3.amazonaws.com/static/european_countries.zip" },
      { title: "Import a dataset of World Populated Places",   url: "http://cartodb.s3.amazonaws.com/static/10m-populated-places-simple.zip" },
      { title: "Import a dataset of World Rivers",  url: "http://cartodb.s3.amazonaws.com/static/50m-rivers-lake-centerlines-with-scale-ranks.zip" },
      { title: "Import a dataset of New York City Counties",  url: "http://cartodb.s3.amazonaws.com/static/counties_ny.zip" },
      { title: "Import a dataset of New York City Subways",        url: "http://cartodb.s3.amazonaws.com/static/nyc_subway_entrance.zip" }
    ]);

    this.template = cdb.templates.getTemplate('common/views/dashboard_more_data_bar');

    this.items = new Backbone.Collection();
    this.items.bind("add", this._addItem, this);

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._addItems(this._TOTAL_ITEMS);

    return this;

  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  show: function() {
    this.model.set("visible", true);
  },

  hide: function() {
    this.model.set("visible", false);
  },

  _show: function() {
    this.$el.show();
  },

  _hide: function() {
    this.$el.hide();
  },

  _addItem: function(model) {

    var item = new cdb.admin.MoreDataBarItem({ model: model });

    this.$el.find("ul").append(item.render());

  },

  _addItems: function(n) {

    for (var i = 0; i<n; i++) {
      var item = new cdb.core.Model(this.data[i]);
      this.items.add(item);
    }

  },

  _onClickDataset: function(e) {
    this.killEvent(e);
    var url = $(e.target).attr('href');
    this.trigger('openCreateTableDialog', url, this);
  }

});
