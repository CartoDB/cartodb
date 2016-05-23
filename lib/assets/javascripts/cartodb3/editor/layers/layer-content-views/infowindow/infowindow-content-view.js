var cdb = require('cartodb.js');
var InfowindowContentSelectView = require('./infowindow-select-view');
var InfowindowContentItemsView = require('./infowindow-items-view');
var _ = require('underscore');

/**
 * Select for an Infowindow select type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    this._initCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._layerInfowindowModel.bind('change:template_name', this._renderItems, this);
  },

  _initViews: function () {
    var styleView = new InfowindowContentSelectView({
      layerInfowindowModel: this._layerInfowindowModel,
      templateStyles: this._templateStyles
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    this._renderItems();
  },

  _renderItems: function () {
    if (this._itemsView) {
      this.removeView(this._itemsView);
      this._itemsView.clean();
    }

    this._itemsView = new InfowindowContentItemsView({
      querySchemaModel: this._querySchemaModel,
      layerInfowindowModel: this._layerInfowindowModel,
      layerDefinitionModel: this._layerDefinitionModel,
      hasValidTemplate: !!this._checkValidTemplate()
    });
    this.addView(this._itemsView);
    this.$el.append(this._itemsView.render().el);
  },

  _checkValidTemplate: function () {
    var template = _.find(this._templateStyles.models, function (mdl) {
      return this._layerInfowindowModel.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  }

});
