var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CarouselView = require('./custom-carousel/custom-carousel-view');

/**
 *  Carousel form view
 */

module.exports = CoreView.extend({
  module: 'components:carousel-form-view',

  className: 'js-aggregationTypes',

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Carousel collection is required');
    if (!opts.template) throw new Error('template is required');
    this.template = opts.template;
    this._initBinds();
  },

  render: function () {
    var selectedItem = this.collection.getSelected();
    var selectedName = selectedItem && selectedItem.getName();
    this.$el.html(
      this.template({
        name: selectedName
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:highlighted', this._onChangeHighlighted, this);
  },

  _initViews: function () {
    var carousel = new CarouselView(_.extend(this.options, {
      collection: this.collection
    }));

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(carousel.render().el);
    carousel.initScroll();
    this.addView(carousel);
  },

  _onChangeHighlighted: function () {
    var item = this.collection.getHighlighted() || this.collection.getSelected();
    if (item) {
      var $el = this.$('.js-highlight');
      if ($el) {
        $el.text(item.getName());
      }
    }
  }

});
