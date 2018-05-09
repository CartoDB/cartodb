var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

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
      help: _t('editor.style.tooltips.fill.color', { type: _t('editor.style.tooltips.' + styleType) })
    };

    var geom = params.queryGeometryModel.get('simple_geom');
    var title = _t('editor.style.components.fillColor.' + geom) + ' ' + _t('editor.style.components.fillColor.label');

    if (params.styleType === 'heatmap') {
      color.hidePanes = ['fixed'];
    }

    if (params.styleType === 'simple' && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      if (!params.isAutoStyleApplied) {
        color.imageEnabled = true;
      }
    }

    if (params.styleType === 'animation') {
      color.hideTabs = ['bins', 'quantification'];

      if (params.animationType === 'simple') {
        color.categorizeColumns = true;
      } else {
        color.hidePanes = ['fixed'];
      }
    }

    editorAttrs.color = color;

    return {
      type: 'FillColor',
      title: title,
      options: options,
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      validators: ['required'],
      editorAttrs: editorAttrs,
      modals: params.modals,
      dialogMode: 'float'
    };
  }
};
