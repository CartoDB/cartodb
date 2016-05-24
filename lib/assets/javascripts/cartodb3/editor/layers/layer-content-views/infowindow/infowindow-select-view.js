var cdb = require('cartodb.js');
var template = require('./infowindow-select.tpl');
var CarouselFormView = require('../../../../components/carousel-form-view');
var InfowindowFormView = require('./infowindow-form-view');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.templatesCollection) throw new Error('templatesCollection is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._templatesCollection = opts.templatesCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _checkValidTemplate: function () {
    var template = this._templatesCollection.find(function (mdl) {
      return this._layerInfowindowModel.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  },

  _setNoneTemplate: function () {
    var noneTemplate = this._templatesCollection.find(function (mdl) {
      return mdl.get('val') === '';
    }, this);

    noneTemplate.set('selected', true);
  },

  _isValidURL: function (url) {
    if (url) {
      var urlPattern = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-|]*[\w@?^=%&amp;\/~+#-])?$/;
      return String(url).match(urlPattern);
    }

    return false;
  },

  _prepareTemplate: function (value) {
    return '';
  },

  _renderCarousel: function () {
    if (!this._checkValidTemplate()) {
      this._setNoneTemplate();
    }

    this._templatesCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._layerInfowindowModel.setTemplate(value, this._prepareTemplate(value));
      }
    }, this);

    var view = new CarouselFormView({
      collection: this._templatesCollection,
      template: require('./infowindow-carousel.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderForm: function () {
    if (this._infowindowFormView) {
      this.removeView(this._infowindowFormView);
      this._infowindowFormView.clean();
    }

    this._infowindowFormView = new InfowindowFormView({
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(this._infowindowFormView);
    this.$('.js-select').append(this._infowindowFormView.render().el);
  }
});
