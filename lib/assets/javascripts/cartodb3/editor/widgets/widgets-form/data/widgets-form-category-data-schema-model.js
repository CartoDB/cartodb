var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');

    this._columnOptionsFactory = opts.columnOptionsFactory;

    this.attributes.hey = {
      operator: 'count',
      attribute: ''
    };
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'));
    var aggregatedColumnOptions = this._columnOptionsFactory.create(this.get('aggregation_column'));
    var helpMsg = this._columnOptionsFactory.unavailableColumnsHelpMessage();

    this.schema = {
      title: {
        type: 'Text',
        text: _t('editor.widgets.widgets-form.data.title'),
        validators: ['required']
      },
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.value'),
        options: columnOptions,
        help: helpMsg,
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
      },
      aggregation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.aggregation'),
        options: ['sum', 'count'],
        editorAttrs: {
          showSearch: false
        }
      },
      aggregation_column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.aggregation_column'),
        options: aggregatedColumnOptions,
        help: helpMsg,
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
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
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');

    // Columns might not be available until table is fetched
    return !!(column && aggregationColumn);
  }

});
