var BaseAnalysisFormModel = require('../base-analysis-form-model.js');

module.exports = BaseAnalysisFormModel.extend({

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.schema = {
      source: {
        type: 'Select',
        options: [ this.get('source') ],
        editorAttrs: {disabled: true}
      },
      radio: {
        type: 'Number',
        text: _t('editor.layers.analysis-form.parameters-description'),
        validators: ['required']
      }
    };
  }

});
