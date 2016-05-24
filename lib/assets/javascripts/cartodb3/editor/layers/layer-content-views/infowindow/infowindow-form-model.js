var cdb = require('cartodb.js');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
  },

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (self._layerInfowindowModel.get(key)) {
        self._layerInfowindowModel.set(key, val);
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    var type = this._layerInfowindowModel.get('template_name');

    if (type !== '') {
      this.schema.width = {
        type: 'Number',
        // title: _t('editor.layers.infowindow.style.window-size'),
        title: 'Window size',
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 400
        }]
      };
    }

    if (type === 'infowindow_light_header_blue') {
      this.schema.headerColor = {
        type: 'Fill',
        // title: _t('editor.layers.infowindow.style.header-color'),
        title: 'Header color',
        options: [],
        editorAttrs: {
          color: {
            hidePanes: ['value']
          }
        },
        validators: ['required']
      };
    }
  }

});
