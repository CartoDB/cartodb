var Backbone = require('backbone');
var _ = require('underscore');

/*
  Base model form legend.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.legendDefinitionModel) throw new Error('legendDefinitionModel is required');
    this.legendDefinitionModel = opts.legendDefinitionModel;

    this.schema = this._generateSchema();
  },

  _generateSchema: function () {
    return {
      title: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.legend.legend-form.title.label'),
        defaultValue: this._titlePlaceholder,
        editor: {
          type: 'Text',
          editorAttrs: {
            placeholder: this._titlePlaceholder,
            help: _t('editor.legend.legend-form.title.help')
          }
        }
      }
    };
  },

  toJSON: function () {
    return _.extend(
      this.attributes,
      {
        type: this.get('type')
      }
    );
  }
});
