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
      kind: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        options: [
          {
            val: 'walk',
            label: _t('editor.layers.analysis-form.by-walk')
          }, {
            val: 'drive',
            label: _t('editor.layers.analysis-form.by-car')
          }, {
            val: 'bike',
            label: _t('editor.layers.analysis-form.by-bike')
          }
        ]
      },
      time: {
        type: 'Number',
        text: _t('editor.layers.analysis-form.time'),
        validators: ['required']
      }
    };
  }

});
