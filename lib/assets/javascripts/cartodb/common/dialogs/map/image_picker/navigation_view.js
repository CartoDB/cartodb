var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 *  Listing datasets navigation.
 *
 *  - 'Filter by' datasets.
 *  - 'Search' any pattern within dataset collection.
 *
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-item':       '_onItemClick',
    'click .js-your-icons': '_onYourIconsClick'
  },

  initialize: function() {
    this.model = this.options.model;
    this.kind  = this.options.kind;
    this.collection = this.options.collection;
    this.template = cdb.templates.getTemplate('new_common/dialogs/map/image_picker/navigation_template');

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
      listing: this.model.get('listing'),
      kind: this.kind
    }));

    if (this.collection.where({ kind: this.kind }).length > 0) {
      var type = "your_icons";
      this.$el.find('[data-type="' + type + '"]').removeClass("is-disabled");
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:listing', this.render, this);
    this.model.bind('change:listing', this._enableFilter, this);
    this.add_related_model(this.model);
  },

  _onYourIconsClick: function(e) {
    if (this.collection.where({ kind: this.kind }).length > 0) {
      var type = $(e.target).data("type")
      this.model.set('listing', type);
    }
  },

  _onItemClick: function(e) {
    var type = $(e.target).data("type")
    this.model.set('listing', type);
  },

  _enableFilter: function(e) {
    var type = this.model.get('listing');
    var $el = this.$el.find('[data-type="' + type + '"]');
    $el.removeClass("is-disabled");
  }

});



