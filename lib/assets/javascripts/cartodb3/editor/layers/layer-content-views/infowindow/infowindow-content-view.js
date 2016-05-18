var cdb = require('cartodb.js');
var InfowindowContentStyleView = require('./infowindow-style-view');
var InfowindowContentItemsView = require('./infowindow-items-view');
var _ = require('underscore');

/**
 * Select for an Infowindow style type.
 */
module.exports = cdb.core.View.extend({

  _DEFAULT_TEMPLATE: 'infowindow_light',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.templateStyles) throw new Error('templateStyles is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._templateStyles = opts.templateStyles;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    this._resetTemplate();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var infowindow_template = _.find(this._templateStyles, function (style) {
      return this._layerInfowindowModel.get('template_name') === style.value;
    }, this);

    var styleView = new InfowindowContentStyleView({
      layerInfowindowModel: this._layerInfowindowModel,
      templateStyles: this._templateStyles,
      infowindowTemplate: infowindow_template
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    var itemsView = new InfowindowContentItemsView({
      querySchemaModel: this._querySchemaModel,
      layerInfowindowModel: this._layerInfowindowModel,
      layerDefinitionModel: this._layerDefinitionModel,
      infowindowTemplate: infowindow_template
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  },

  _resetTemplate: function () {
    if (!this._layerInfowindowModel.get('template_name')) {
      this._layerInfowindowModel.set('template_name', this._DEFAULT_TEMPLATE);
    }
  },

  _setTemplate: function () {
    if (this._layerInfowindowModel.get('template_name')) {
      this.template = cdb.templates.getTemplate(this._getModelTemplate());
    }
  }

});
