var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'columnOptionsFactory'
];

var AGGREGATION_OPTIONS = [
  {
    val: 'minute',
    label: 'Minute'
  }, {
    val: 'hour',
    label: 'Hour'
  }, {
    val: 'day',
    label: 'Day'
  }, {
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

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);
  },

  getFields: function () {
    return {
      data: ['column', 'subtype', 'aggregation', 'bins'],
      style: ['sync_on_bbox_change', 'widget_style_definition']
    };
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isDateType);
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
      subtype: {
        type: 'Radio',
        title: 'Type',
        options: [{
          val: 'timestamp',
          label: 'Timestamp',
        }, {
          val: 'numeric',
          label: 'Numeric',
        }]
      },
      bins: {
        title: _t('editor.widgets.widgets-form.data.bins'),
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 256
        }]
      },
      aggregation: {
        title: 'Aggregation',
        type: 'Select',
        options: AGGREGATION_OPTIONS
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
  },

  canSave: function () {
    return this.get('column');
  },

  _isDateType: function (m) {
    return m.get('type') === 'date' || m.get('type') === 'number';
  }

});
