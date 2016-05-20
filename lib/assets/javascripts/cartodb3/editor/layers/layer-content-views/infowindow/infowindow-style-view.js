var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./infowindow-style.tpl');
var CarouselFormView = require('../../../../components/carousel-form-view');
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

  _checkValidTemplate: function () {
    var template = this._templateStyles.find(function (mdl) {
      return this._layerInfowindowModel.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  },

  _setNoneTemplate: function () {
    var noneTemplate = this._templateStyles.find(function (mdl) {
      return mdl.get('val') === '';
    }, this);

    noneTemplate.set('selected', true);
  },

  _renderCarousel: function () {
    if (!this._checkValidTemplate()) {
      this._setNoneTemplate();
    }

    this._templateStyles.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        this._layerInfowindowModel.setTemplate(mdl.getValue());
      }
    }, this);

    var view = new CarouselFormView({
      collection: this._templateStyles,
      template: require('./infowindow-style-selector.tpl')
    });
    this.addView(view);
    this.$('.js-style').append(view.render().el);
  },

  _renderForm: function () {
    if (this._infowindowStyleFormView) {
      this.removeView(this._infowindowStyleFormView);
      this._infowindowStyleFormView.clean();
    }

    this._infowindowStyleFormView = new InfowindowStyleFormView({
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(this._infowindowStyleFormView);
    this.$('.js-style').append(this._infowindowStyleFormView.render().el);
  }
});
