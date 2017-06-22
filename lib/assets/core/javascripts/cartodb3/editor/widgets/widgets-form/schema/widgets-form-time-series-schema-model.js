var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'columnOptionsFactory',
  'querySchemaModel'
];

var AGGREGATION_OPTIONS = [
  // {
  //   val: 'minute',
  //   label: 'Minute'
  // }, {
  //   val: 'hour',
  //   label: 'Hour'
  // }, {
  //   val: 'day',
  //   label: 'Day'
  // },
  {
    val: 'week',
    label: 'Week'
  }, {
    val: 'month',
    label: 'Month'
  }, {
    val: 'quarter',
    label: 'Quarter'
  }, {
    val: 'year',
    label: 'Year'
  }
];

module.exports = WidgetsFormBaseSchema.extend({
  defaults: {
    schema: {},
    aggregation: 'month',
    bins: 48
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);

    this.on('change:column', this._onColumnChanged, this);
    window.wdg = this;
  },

  getFields: function () {
    var columnType = this._getColumnType();
    var data = ['column'];

    if (columnType === 'date') {
      data.push('aggregation');
    } else {
      data.push('bins');
    }

    return {
      data: data,
      style: ['sync_on_bbox_change', 'widget_style_definition']
    };
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isNumberOrDateType.bind(this));
    var helpMsg = this._columnOptionsFactory.unavailableColumnsHelpMessage();

    this.schema = _.extend(this.schema, {
      column: {
        title: _t('editor.widgets.widgets-form.data.column'),
        type: 'Select',
        help: helpMsg,
        options: columnOptions,
        dialogMode: 'float',
        editorAttrs: {
          disabled: this._columnOptionsFactory.areColumnsUnavailable()
        }
      },
      widget_style_definition: {
        type: 'Fill',
        title: _t('editor.widgets.widgets-form.style.fill'),
        options: [],
        dialogMode: 'float',
        editorAttrs: {
          color: {
            hidePanes: ['value'],
            disableOpacity: true
          }
        }
      }
    });

    var columnType = this._getColumnType();
    if (columnType === 'date') {
      this.schema = _.extend(this.schema, {
        aggregation: {
          title: 'Aggregation',
          type: 'Select',
          options: AGGREGATION_OPTIONS
        }
      });
    } else {
      this.schema = _.extend(this.schema, {
        bins: {
          title: _t('editor.widgets.widgets-form.data.bins'),
          type: 'Number',
          validators: ['required', {
            type: 'interval',
            min: 0,
            max: 256
          }]
        }
      });
    }
  },

  canSave: function () {
    return this.get('column');
  },

  _isDateType: function (model) {
    return model.get('type') === 'date';
  },

  _isNumberType: function (model) {
    return model.get('type') === 'number';
  },

  _isNumberOrDateType: function (model) {
    return this._isDateType(model) || this._isNumberType(model);
  },

  _onColumnChanged: function (mdl, value) {
    this.updateSchema();
  },

  _getColumnType: function () {
    var column;
    if (this._querySchemaModel.isFetched()) {
      column = this._querySchemaModel.columnsCollection.findWhere({ name: this.get('column') });
    }
    return column && column.get('type');
  },

  _filterAttributesForWidgetDefinition: function () {
    var attrToFilter = this._getColumnType() === 'date' ? 'bins' : 'aggregation';
    var attrs = _.clone(this.attributes);
    attrs[attrToFilter] = undefined;

    return attrs;
  }
});
