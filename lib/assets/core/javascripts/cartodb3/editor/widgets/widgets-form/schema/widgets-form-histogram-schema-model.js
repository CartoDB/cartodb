var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'columnOptionsFactory',
  'modals',
  'configModel',
  'userModel'
];

module.exports = WidgetsFormBaseSchema.extend({

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);
  },

  getFields: function () {
    return {
      data: ['column', 'bins'],
      style: this._autoStyleEnable ? ['sync_on_bbox_change', 'widget_style_definition', 'auto_style_definition'] : ['sync_on_bbox_change']
    };
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isNumberType);
    var helpMsg = this._columnOptionsFactory.unavailableColumnsHelpMessage();

    this.schema = _.extend(this.schema, {
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
          min: 2,
          max: 30
        }]
      }
    });

    this._addAllStyleSchemaAttributes();
  },

  canSave: function () {
    return !!this.get('column');
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
