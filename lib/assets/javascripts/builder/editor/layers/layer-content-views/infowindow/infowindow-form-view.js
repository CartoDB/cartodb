var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./infowindow-form.tpl');
var InfowindowFormModel = require('./infowindow-form-model');

module.exports = CoreView.extend({

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();
    this._initBinds();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:template_name', this._generateForms, this);
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    this._formModel = new InfowindowFormModel({
      width: this.model.get('width'),
      headerColor: this.model.get('headerColor')
    }, {
      layerInfowindowModel: this.model
    });

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-form').append(this._formView.render().$el);
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }
});
