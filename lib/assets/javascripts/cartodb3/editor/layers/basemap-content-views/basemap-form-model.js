var _ = require('underscore');
var DEBOUNCE_TIME = 350;
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._disabled = opts.disabled;

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
  },

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (key === 'color') {
        self._updatePlainBasemap(val.color.fixed);
      }
    });
  },

  _updatePlainBasemap: function (color) {
    var plainBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('className') === 'plain';
    });

    plainBasemap.set({
      color: color,
      image: '',
      maxZoom: 32
    });

    this._basemapsCollection.updateSelected(plainBasemap.getValue());
    this._layerDefinitionsCollection.setBaseLayer(plainBasemap.toJSON());
  },

  _generateSchema: function () {
    this.schema = {
      color: {
        type: 'Fill',
        title: _t('editor.layers.basemap.style.color'),
        options: [],
        editorAttrs: {
          color: {
            hidePanes: ['value'],
            disableOpacity: true
          },
          disabled: this._disabled
        },
        validators: ['required']
      }
    };
  }

});
