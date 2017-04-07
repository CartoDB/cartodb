var _ = require('underscore');
var Backbone = require('backbone');
var DEBOUNCE_TIME = 650;

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
    this._onChange = this._onChange.bind(this);
    this.bind('change', _.debounce(this._onChange, DEBOUNCE_TIME), this);
  },

  _onChange: function () {
    if (this.hasChanged('color')) {
      var color = this.get('color').color.fixed;
      this._updatePlainBasemap(color);
    }
  },

  _updatePlainBasemap: function (color) {
    var plainBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('className') === 'plain';
    });
    var isAlreadySelected = plainBasemap.get('selected');

    plainBasemap.set({
      color: color,
      image: '',
      maxZoom: 32
    });

    if (isAlreadySelected) {
      this._layerDefinitionsCollection.setBaseLayer(plainBasemap.toJSON());
    } else {
      this._basemapsCollection.updateSelected(plainBasemap.getValue());
    }
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
