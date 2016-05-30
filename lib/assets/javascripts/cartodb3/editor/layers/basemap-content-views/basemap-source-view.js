var cdb = require('cartodb.js');
var template = require('./basemap-source.tpl');
var CarouselFormView = require('../../../components/carousel-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.sourcesCollection) throw new Error('sourcesCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._sourcesCollection = opts.sourcesCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();

    return this;
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._sourcesCollection,
      template: require('./basemap-carousel.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
