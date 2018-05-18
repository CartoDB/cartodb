var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var FillConstants = require('builder/components/form-components/_constants/_fill');

module.exports = {
  generate: function (params) {
    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var self = this;
    var size = this._buildSize(params, {
      options: options,
      title: _t('editor.style.components.point-size.label'), // TODO: add resource at en.json for each one
      editorAttrs: self._buildFillSizeAttrs(params)
    });

    return size;
  },

  _buildSize: function (params, customOptions) {
    this._checkForParams(params);

    var size = {
      type: 'Size',
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals,
      validators: ['required']
    };

    size = _.extend(size, customOptions);

    return size;
  },

  _checkForParams: function (params) {
    if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!params.configModel) throw new Error('configModel is required');
    if (!params.styleType) throw new Error('styleType is required');
    if (!params.userModel) throw new Error('userModel is required');
    if (!params.modals) throw new Error('modals is required');
  },

  _buildFillSizeAttrs: function (params) {
    var size = _.extend({}, FillConstants.Size.DEFAULT);

    this._setDefaultRangeIfNeeded(params, size);
    this._hideByValuePaneIfNotAllowed(params, size);

    return size;
  },

  _setDefaultRangeIfNeeded: function (params, size) {
    if (params.styleType === StyleConstants.Type.SIMPLE && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      size.defaultRange = [5, 20];
    }

    return size;
  },

  _hideByValuePaneIfNotAllowed: function (params, size) {
    if (_.contains(['heatmap', 'animation'], params.styleType)) {
      size.hidePanes = ['value'];
    }

    return size;
  }
};
