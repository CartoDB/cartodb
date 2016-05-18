var cdb = require('cartodb.js');
var Template = require('./infowindow-style-form-view.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(Template({
      label: _t('editor.layers.infowindow.style.window-size')
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    // if (this._widgetFormView) {
    //   this._widgetFormView.remove();
    // }

    // this._widgetFormView = new Backbone.Form({
    //   model: this._widgetFormModel
    // });

    // this._widgetFormView.bind('change', function () {
    //   this.commit();
    // });

    // this.$('.js-content').html(this._widgetFormView.render().$el);

    // return this;
  }

});

