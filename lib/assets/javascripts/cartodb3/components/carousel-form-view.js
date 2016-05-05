var cdb = require('cartodb.js');
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
    var carousel = new CarouselView({
      collection: this.collection
    });

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(carousel.render().el);
    this.addView(carousel);
  },

  _onChangeHighlighted: function () {
    var selected = this.collection.getSelected();
    var highlighted = this.collection.getHighlighted();
    var $el = this.$('.js-highlight');

    if ($el) {
      $el.text((highlighted || selected).getName());
    }
  }

});
