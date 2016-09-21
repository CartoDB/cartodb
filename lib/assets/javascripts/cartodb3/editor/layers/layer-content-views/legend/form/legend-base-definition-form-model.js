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
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.schema = this._generateSchema();
  },

  _generateSchema: function () {
    return {
      title: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.legend.legend-form.title'),
        defaultValue: this._titlePlaceholder,
        editor: {
          type: 'Text',
          editorAttrs: {
            placeholder: this._titlePlaceholder
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
