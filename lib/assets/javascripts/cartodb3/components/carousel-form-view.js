var cdb = require('cartodb.js');
var _ = require('underscore');
var CarouselView = require('./custom-carousel/custom-carousel-view');

/**
 *  Carousel form view
 */

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Carousel collection is required');
    if (!opts.template) throw new Error('template is required');
    this.template = opts.template;
    this._initBinds();
  },

  render: function () {
    var selectedName = this.collection.getSelected() && this.collection.getSelected().getName();
    this.$el.html(
      this.template({
        selectedName: selectedName
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:highlighted', this._onChangeHighlighted, this);
  },

  _initViews: function () {
    var carousel = new CarouselView({
      collection: this.collection
    });

    this.$('.js-selector').append(carousel.render().el);
    this.addView(carousel);
  },

  _onChangeHighlighted: function () {
    var selected = this.collection.getSelected();
    var highlighted = this.collection.getHighlighted();
    var $el = this.$('.js-highlight');

    if (highlighted) {
      $el.text(highlighted.getName());
    } else {
      $el.text(selected.getName());
    }
  }

});
