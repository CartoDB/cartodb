var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-item':       '_onItemClick',
    'click .js-your-icons': '_onYourIconsClick'
  },

  initialize: function() {
    this.model = this.options.model;
    this.kind  = this.options.kind;
    this.collection = this.options.collection;
    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/navigation_template');

    this._preRender();
    this._initBinds();
  },

  // It is necessary to add two static elements because
  // they can't be removed/replaced using render method
  // each time a change (in a model or a collection) happens.
  // This is due to the behaviour of the CSS animations.
  _preRender: function() {
    var $uInner = $('<div>').addClass('u-inner');
    var $filtersInner = $('<div>').addClass('Filters-inner');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function(m, c) {
    this.clearSubViews();

    this.$('.Filters-inner').html(
      this.template({
      dropbox_enabled: this.model.get("dropbox_enabled"),
      box_enabled: this.model.get("box_enabled"),
      pane: this.model.get('pane'),
      kind: this.kind
    }));

    if (this.collection.where({ kind: this.kind }).length > 0) {
      var type = "your_icons";
      this.$el.find('[data-type="' + type + '"]').removeClass("is-disabled");
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:pane', this.render, this);
    this.model.bind('change:pane', this._enableFilter, this);
    this.add_related_model(this.model);
  },

  _onYourIconsClick: function(e) {
    if (this.collection.where({ kind: this.kind }).length > 0) {
      var type = $(e.target).data("type")
      this.model.set('pane', type);
    }
  },

  _onItemClick: function(e) {
    var type = $(e.target).data("type")
    this.model.set('pane', type);
  },

  _enableFilter: function(e) {
    var type = this.model.get('pane');
    var $el = this.$el.find('[data-type="' + type + '"]');
    $el.removeClass("is-disabled");
  }
});



