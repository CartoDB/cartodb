var _ = require('underscore');
var moment = require('moment');
var momentTimezone = require('moment-timezone');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var TimeSeriesQueryModel = require('../../time-series-query-model');
var Timezones = require('../../../../data/timezones');

var REQUIRED_OPTS = [
  'columnOptionsFactory',
  'configModel',
  'querySchemaModel'
];

module.exports = WidgetsFormBaseSchema.extend({
  defaults: {
    schema: {},
    bins: 48,
    timezone: ''
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);

    this._timeSeriesQueryModel = new TimeSeriesQueryModel({
      column: this.get('column')
    }, {
      configModel: this._configModel,
      querySchemaModel: this._querySchemaModel
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.on('change:column', this._onColumnChanged, this);
    this.listenTo(this._timeSeriesQueryModel, 'change:buckets', this.updateSchema);
  },

  getFields: function () {
    var columnType = this._getColumnType();
    var data = ['column'];

    if (columnType === 'date') {
      data.push('timezone', 'aggregation');
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
      var aggregationOptions = this._timeSeriesQueryModel.getFilteredBuckets();
      var sortedTimezoneOptions = _.chain(Timezones)
        .reduce(function (memo, tz) {
          var name = tz.name;

          memo.push({
            label: tz.label,
            name: name,
            offset: moment.tz(name).utcOffset()
          });

          return memo;
        }, [])
        .sortBy('offset')
        .reduce(function (memo, tz) {
          var name = tz.name;
          var timezone = tz.offset ? moment.tz(name).format('Z') : '';

          memo.push({
            label: '(GMT' + timezone + ') ' + tz.label,
            val: name
          });

          return memo;
        }, [])
        .value();

      this.schema = _.extend(this.schema, {
        aggregation: {
          title: 'Aggregation',
          type: 'Select',
          options: aggregationOptions,
          loading: _.isEmpty(aggregationOptions)
        },
        timezone: {
          title: _t('editor.widgets.widgets-form.data.timezone'),
          type: 'Select',
          options: sortedTimezoneOptions
        },
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

    this.trigger('changeSchema');
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

  _onColumnChanged: function () {
    this.unset('aggregation', { silent: true });
    this.unset('timezone', { silent: true });
    this._timeSeriesQueryModel.set('column', this.get('column'));
    this.set('column_type', this._getColumnType());
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
    var attrs = this.toJSON();
    attrs[attrToFilter] = undefined;

    return attrs;
  }
});
