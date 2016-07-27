var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

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
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.aggregate-by'),
        options: columnOptions,
        help: helpMsg,
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
      },
      aggregation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.operation'),
        options: [
          {val: 'sum', label: _t('editor.widgets.widgets-form.aggregation-options.sum')},
          {val: 'count', label: _t('editor.widgets.widgets-form.aggregation-options.count')},
          {val: 'avg', label: _t('editor.widgets.widgets-form.aggregation-options.avg')},
          {val: 'min', label: _t('editor.widgets.widgets-form.aggregation-options.min')},
          {val: 'max', label: _t('editor.widgets.widgets-form.aggregation-options.max')}
        ],
        editorAttrs: {
          showSearch: false
        }
      },
      aggregation_column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.operation-column'),
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
