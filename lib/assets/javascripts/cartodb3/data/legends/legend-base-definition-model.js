var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('../backbone/sync-abort');

/*
  Base model for a legend. It should have a reference to a layerDefinitionModel.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: '',
    rawHTML: '',
    preHTMLSnippet: 'pre', // TOFIX
    postHTMLSnippet: 'post' // TOFIX
  },

  sync: syncAbort,

  urlRoot: function () {
    var baseUrl = this.collection.configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this.collection.vizId + '/layer/' + this.layerDefinitionModel.id + '/legends';
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

  getStyles: function () {
    return this.layerDefinitionModel && this.layerDefinitionModel.styleModel || null;
  },

  fetch: function () {
    throw new Error('This model should not make any fetch calls. It should be created from the vizJSON.');
  },

  getType: function () {
    return this.get('type');
  },

  toJSON: function () {
    return _.extend(
      this.attributes,
      {
        type: this.getType()
      }
    );
  }
});
