var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');

    this._columnOptionsFactory = opts.columnOptionsFactory;
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isNumberType);

    this.schema = {
      title: {
        type: 'Text',
        title: _t('editor.widgets.widgets-form.data.title'),
        validators: ['required']
      },
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.column'),
        help: this._columnOptionsFactory.unavailableColumnsHelpMessage(),
        options: columnOptions,
        editorAttrs: {
          disabled: columnOptions[0].disabled
        }
      },
      operation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.operation'),
        options: ['min', 'max', 'count', 'avg', 'sum']
      },
      suffix: {
        title: _t('editor.widgets.widgets-form.data.suffix'),
        type: 'Text'
      },
      prefix: {
        title: _t('editor.widgets.widgets-form.data.prefix'),
        type: 'Text'
      }
    };
  },

  canSave: function () {
    return !!this.get('column');
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
