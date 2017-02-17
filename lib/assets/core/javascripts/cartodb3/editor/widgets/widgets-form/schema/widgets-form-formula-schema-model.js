var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');

module.exports = WidgetsFormBaseSchema.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');
    this._columnOptionsFactory = opts.columnOptionsFactory;

    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);
  },

  getFields: function () {
    return {
      data: 'column,operation,prefix,suffix,description',
      style: 'sync_on_bbox_change'
    };
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isNumberType);

    this.schema = _.extend(this.schema, {
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.column'),
        help: this._columnOptionsFactory.unavailableColumnsHelpMessage(),
        options: columnOptions,
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
      },
      operation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.operation'),
        options: ['min', 'max', 'count', 'avg', 'sum']
      },
      suffix: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.data.suffix'),
        editor: {
          type: 'Text'
        }
      },
      prefix: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.data.prefix'),
        editor: {
          type: 'Text'
        }
      },
      description: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.style.description'),
        editor: {
          type: 'TextArea'
        }
      }
    });
  },

  canSave: function () {
    return !!this.get('column');
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
