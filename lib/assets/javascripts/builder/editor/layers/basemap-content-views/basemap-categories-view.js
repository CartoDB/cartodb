var CoreView = require('backbone/core-view');
var template = require('./basemap-categories.tpl');
var CarouselFormView = require('builder/components/carousel-form-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.categoriesCollection) throw new Error('categoriesCollection is required');

    this._categoriesCollection = opts.categoriesCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();

    return this;
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._categoriesCollection,
      template: require('./basemap-carousel.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
