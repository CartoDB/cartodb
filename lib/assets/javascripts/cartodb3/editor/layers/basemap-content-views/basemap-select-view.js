var cdb = require('cartodb.js');
var template = require('./basemap-select.tpl');
var CarouselFormView = require('../../../components/carousel-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();

    return this;
  },

  _checkValidBasemap: function () {
    // var template = this._templatesCollection.find(function (mdl) {
    //   return this.model.get('template_name') === mdl.get('val');
    // }, this);

    return false;
  },

  _setDefaultBasemap: function () {
    var defaultBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('default');
    }, this);

    defaultBasemap.set('selected', true);
  },

  _setBasemap: function (basemap) {
    this._layerDefinitionsCollection.setBaseLayer(basemap);
  },

  _renderCarousel: function () {
    if (!this._checkValidBasemap()) {
      this._setDefaultBasemap();
    }

    this._basemapsCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._setBasemap(value);
      }
    }, this);

    var view = new CarouselFormView({
      collection: this._basemapsCollection,
      template: require('./basemap-carousel.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
