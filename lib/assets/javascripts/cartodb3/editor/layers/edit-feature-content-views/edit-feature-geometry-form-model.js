var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
  },

  _onChange: function () {
    _.each(this.changed, function (val, key) {
      if (key === 'the_geom') {
        var the_geom = null;

        try {
          the_geom = JSON.parse(val);
        } catch (err) {
          // if the geom is not a valid json value
        }

        this._featureModel.set('the_geom', JSON.stringify(the_geom));
      }
    }, this);
  },

  _generateSchema: function () {
    this.schema = {};

    var copy = '';
    if (this._featureModel.has('the_geom')) {
      copy = _t('editor.edit-feature.copy');
    }
    this.schema.the_geom = {
      type: 'Text',
      validators: ['required'],
      editorAttrs: {
        disabled: true
      },
      copy: copy
    };
  }

});
