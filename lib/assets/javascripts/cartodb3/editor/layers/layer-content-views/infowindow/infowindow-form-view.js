var cdb = require('cartodb.js');
var Backbone = require('backbone');
var template = require('./infowindow-form.tpl');
var InfowindowFormModel = require('./infowindow-form-model');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.infowindowSelectModel) throw new Error('infowindowSelectModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._infowindowSelectModel = opts.infowindowSelectModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();
    this._initBinds();

    return this;
  },

  _initBinds: function () {
    this._layerInfowindowModel.bind('change:template_name', this._generateForms, this);
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    this._formModel = new InfowindowFormModel({
      width: this._layerInfowindowModel.get('width') || '',
      headerColor: {
        color: {
          fixed: '#35AAE5;'
        }
      }
    }, {
      layerInfowindowModel: this._layerInfowindowModel,
      infowindowSelectModel: this._infowindowSelectModel
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
