var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');

    this._columnOptionsFactory = opts.columnOptionsFactory;
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isDateType);
    var helpMsg = this._columnOptionsFactory.unavailableColumnsHelpMessage();

    this.schema = {
      title: {
        title: _t('editor.widgets.widgets-form.data.title'),
        type: 'Text',
        validators: ['required']
      },
      column: {
        title: _t('editor.widgets.widgets-form.data.column'),
        type: 'Select',
        help: helpMsg,
        options: columnOptions,
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
      },
      bins: {
        title: _t('editor.widgets.widgets-form.data.bins'),
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 30
        }]
      }
    };
  },

  canSave: function () {
    return this.get('column');
  },

  _isDateType: function (m) {
    return m.get('type') === 'date';
  }

});
