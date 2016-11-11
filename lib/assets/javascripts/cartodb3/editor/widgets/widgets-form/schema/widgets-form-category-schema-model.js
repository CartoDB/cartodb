var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');

var TYPE = {
  string: 'string',
  number: 'number'
};

module.exports = WidgetsFormBaseSchema.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');
    this._columnOptionsFactory = opts.columnOptionsFactory;
    this.on('change:aggregation', this.updateSchema, this);
    this.on('change:column', this.updateSchema, this);

    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);
  },

  getFields: function () {
    var fields = ['column', 'aggregation', 'aggregation_column', 'prefix', 'suffix'];

    if (this.get('aggregation') === 'count') {
      fields = _.without(fields, 'aggregation_column');
    }

    return {
      data: fields.join(','),
      style: 'sync_on_bbox_change'
    };
  },

  getAggregation: function (type) {
    var options;
    if (type === TYPE.string) {
      options = [
        {val: 'count', label: _t('operators.count')}
      ];
    } else {
      options = [
        {val: 'sum', label: _t('operators.sum')},
        {val: 'count', label: _t('operators.count')},
        {val: 'avg', label: _t('operators.avg')},
        {val: 'min', label: _t('operators.min')},
        {val: 'max', label: _t('operators.max')}
      ];
    }
    return options;
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'));
    var aggregatedColumnOptions = this._columnOptionsFactory.create(this.get('aggregation_column'));
    var helpMsg = this._columnOptionsFactory.unavailableColumnsHelpMessage();
    var column = _.findWhere(aggregatedColumnOptions, {val: this.get('column')});
    var aggregationOptions = this.getAggregation(column && column.type);
    // Selecting COUNT aggregation should remove the operation column
    this.schema = _.omit(this.schema, ['aggregation_column']);

    this.schema = _.extend(this.schema, {
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
        options: aggregationOptions,
        editorAttrs: {
          showSearch: false
        }
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
      }
    });

    if (this.get('aggregation') !== 'count') {
      this.schema = _.extend(this.schema, {
        aggregation_column: {
          type: 'Select',
          title: _t('editor.widgets.widgets-form.data.operation-column'),
          options: aggregatedColumnOptions,
          help: helpMsg,
          editorAttrs: {
            disabled: this._columnOptionsFactory.areColumnsUnavailable()
          }
        }
      });
    }
  },

  canSave: function () {
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');
    var canSave = false;

    if (this.get('aggregation') === 'count') {
      canSave = true;
    } else {
      // Columns might not be available until table is fetched
      canSave = !!(column && aggregationColumn);
    }

    return canSave;
  }

});
