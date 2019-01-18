var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var StylesFactory = require('builder/editor/style/styles-factory');

var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = {
  generate: function (params) {
    var editorAttrs = {};

    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var styleType = params.queryGeometryModel.get('simple_geom') === StyleConstants.Type.POLYGON
      ? StyleConstants.Type.POLYGON
      : params.styleType;

    var color = {
      help: _t('editor.style.tooltips.fill.color', { type: _t('editor.style.tooltips.' + styleType) })
    };

    var size = _.extend(FillConstants.Size.DEFAULT, {
      help: _t('editor.style.tooltips.fill.size', { type: _t('editor.style.tooltips.' + styleType) })
    });

    var fillLabel = _t('editor.style.components.fill');

    if (params.styleType === StyleConstants.Type.HEATMAP) {
      size.hidePanes = [FillConstants.Panes.BY_VALUE];
      color.hidePanes = [FillConstants.Panes.FIXED];
    }

    if (params.styleType === StyleConstants.Type.SIMPLE && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      size.defaultRange = FillConstants.Size.DEFAULT_RANGE;

      if (!params.isAutoStyleApplied) {
        color.imageEnabled = true;
      }
    }

    if (params.styleType === StyleConstants.Type.ANIMATION) {
      size.hidePanes = [FillConstants.Panes.BY_VALUE];
      color.hideTabs = [
        FillConstants.Tabs.BINS,
        FillConstants.Tabs.QUANTIFICATION
      ];

      if (params.animationType === 'simple') {
        color.categorizeColumns = true;
      } else {
        color.hidePanes = [FillConstants.Panes.FIXED];
      }
    }

    if (_.contains(StylesFactory.getAggregationTypes(), params.styleType) ||
      StyleFormDictionaryHelpers.hasGeometryOf(params, 'polygon')) {
      fillLabel = _t('editor.style.components.color');
    }

    editorAttrs.color = color;
    editorAttrs.size = size;

    return {
      type: 'Fill',
      title: fillLabel,
      options: options,
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      validators: ['required'],
      editorAttrs: editorAttrs,
      modals: params.modals,
      dialogMode: DialogConstants.Mode.FLOAT
    };
  }
};
