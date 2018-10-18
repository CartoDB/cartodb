var CoreView = require('backbone/core-view');
var template = require('./infowindow-select.tpl');
var CarouselFormView = require('builder/components/carousel-form-view');
var InfowindowFormView = require('./infowindow-form-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.templatesCollection) throw new Error('templatesCollection is required');
    this._templatesCollection = opts.templatesCollection;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:headerColor', this._onColorChange, this);
  },

  _onColorChange: function () {
    this._setTemplate(this.model.get('template_name'));
  },

  _checkValidTemplate: function () {
    var template = this._templatesCollection.find(function (mdl) {
      return this.model.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  },

  _setNoneTemplate: function () {
    var noneTemplate = this._templatesCollection.find(function (mdl) {
      return mdl.get('val') === '';
    }, this);

    noneTemplate.set('selected', true);
  },

  _setTemplate: function (template_name) {
    this.model.setTemplate(template_name);
  },

  _renderCarousel: function () {
    if (!this._checkValidTemplate()) {
      this._setNoneTemplate();
    }

    this._templatesCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();
        this._setTemplate(value);
      }
    }, this);
    this.add_related_model(this._templatesCollection);

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
      model: this.model
    });
    this.addView(this._infowindowFormView);
    this.$('.js-select').append(this._infowindowFormView.render().el);
  }

});
