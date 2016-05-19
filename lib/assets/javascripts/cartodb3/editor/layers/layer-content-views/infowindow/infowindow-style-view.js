var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./infowindow-style.tpl');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var InfowindowStyleFormView = require('./infowindow-style-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.templateStyles) throw new Error('templateStyles is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._templateStyles = opts.templateStyles;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _renderCarousel: function () {
    var carouselCollection = new CarouselCollection(
      _.map(this._templateStyles, function (style) {
        return {
          selected: this._layerInfowindowModel.get('template_name') === style.label,
          val: style.value,
          label: style.label,
          template: function () {
            return style.label;
          }
        };
      }, this)
    );

    carouselCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        this._layerInfowindowModel.setTemplate(mdl.getValue());
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./infowindow-style-selector.tpl')
    });
    this.addView(view);
    this.$('.js-content').append(view.render().el);
  },

  _renderForm: function () {
    if (this._infowindowStyleFormView) {
      this.removeView(this._infowindowStyleFormView);
      this._infowindowStyleFormView.clean();
    }

    this._infowindowStyleFormView = new InfowindowStyleFormView({
      layerInfowindowModel: this._layerInfowindowModel,
      min: 0,
      max: 400
    });
    this.addView(this._infowindowStyleFormView);
    this.$('.js-content').append(this._infowindowStyleFormView.render().el);
  }

});
