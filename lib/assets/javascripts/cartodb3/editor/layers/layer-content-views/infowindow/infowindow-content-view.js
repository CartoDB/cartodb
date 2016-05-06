var cdb = require('cartodb.js');
var InfowindowContentStyleView = require('./infowindow-style-view');
var InfowindowContentItemsView = require('./infowindow-items-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerTableModel = opts.layerTableModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    // TODO: carousel
    var styleView = new InfowindowContentStyleView({
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    var itemsView = new InfowindowContentItemsView({
      layerTableModel: this._layerTableModel,
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  },

  _getModelTemplate: function () {
    return this._layerInfowindowModel.get('template_name');
  },

  _setTemplate: function () {
    if (this._layerInfowindowModel.get('template_name')) {
      this.template = cdb.templates.getTemplate(this._getModelTemplate());
    }
  },

  _compileTemplate: function () {
    var template = this._layerInfowindowModel.get('template') ? this._layerInfowindowModel.get('template') : cdb.templates.getTemplate(this._getModelTemplate());

    if (typeof (template) !== 'function') {
      this.template = new cdb.core.Template({
        template: template,
        type: this._layerInfowindowModel.get('template_type') || 'mustache'
      }).asfunction();
    } else {
      this.template = template;
    }
  }

});
