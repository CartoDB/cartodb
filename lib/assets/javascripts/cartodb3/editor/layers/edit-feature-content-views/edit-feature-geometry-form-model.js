var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._generateSchema();
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.the_geom = {
      type: 'Text',
      validators: ['required'],
      editorAttrs: {
        disabled: true
      },
      hasCopyButton: this._featureModel.has('the_geom')
    };
  }

});
