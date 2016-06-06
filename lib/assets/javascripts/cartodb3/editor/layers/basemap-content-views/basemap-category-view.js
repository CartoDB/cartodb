var cdb = require('cartodb.js');
var template = require('./basemap-category.tpl');
var CarouselFormView = require('../../../components/carousel-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.categoriesCollection) throw new Error('categoriesCollection is required');

    this._categoriesCollection = opts.categoriesCollection;

    this._initBinds();
  },

  _initBinds: function () {
    this.add_related_model(this._categoriesCollection);
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
