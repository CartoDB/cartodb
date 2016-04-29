var cdb = require('cartodb.js');
var template = require('./infowindow-style.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'change .js-select': '_onChangeStyle'
  },

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;

    // TODO: move to view
    this._layerInfowindowModel.bind("change:" + this.options.property, this._onUpdate, this);
  },

  render: function () {
    this.$el.html(template({
      title: _t('editor.layers.infowindow.style.title-label'),
      description: _t('editor.layers.infowindow.style.description')
    }));
    return this;
  },

  _onChangeStyle: function (ev) {
    var newStyle = this.$('.js-select').val();
    this._layerInfowindowModel.setTemplate(newStyle);
  }

});
