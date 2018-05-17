var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var StylesFactory = require('builder/editor/style/styles-factory');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function (params) {
    var editorAttrs = {};

    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var styleType = params.queryGeometryModel.get('simple_geom') === 'polygon' ? 'polygon' : params.styleType;

    var color = {
      help: _t('editor.style.tooltips.fill.color', {type: _t('editor.style.tooltips.' + styleType)})
    };
    var size = {
      min: 1,
      max: 45,
      step: 0.5,
      help: _t('editor.style.tooltips.fill.size', {type: _t('editor.style.tooltips.' + styleType)})
    };

    var fillLabel = _t('editor.style.components.fill');

    if (params.styleType === 'heatmap') {
      size.hidePanes = ['value'];
      color.hidePanes = ['fixed'];
    }

    if (params.styleType === 'simple' && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      size.defaultRange = [5, 20];

      if (!params.isAutoStyleApplied) {
        color.imageEnabled = true;
      }
    }

    if (params.styleType === 'animation') {
      size.hidePanes = ['value'];
      color.hideTabs = ['bins', 'quantification'];

      if (params.animationType === 'simple') {
        color.categorizeColumns = true;
      } else {
        color.hidePanes = ['fixed'];
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
