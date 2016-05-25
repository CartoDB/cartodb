var cdb = require('cartodb.js');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.infowindowSelectModel) throw new Error('infowindowSelectModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._infowindowSelectModel = opts.infowindowSelectModel;

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
  },

  _onChange: function () {
    var self = this;

    // depending on the field we'll update the select model for later transformation
    // or the infowindow model directly
    _.each(this.changed, function (val, key) {
      if (self._layerInfowindowModel.get(key)) {
        self._layerInfowindowModel.set(key, val);
      }

      if (self._infowindowSelectModel.get(key)) {
        self._infowindowSelectModel.set(key, val);
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    var type = this._layerInfowindowModel.get('template_name');

    if (type !== '') {
      if (this._layerInfowindowModel.get('width')) {
        this.schema.width = {
          type: 'Number',
          title: _t('editor.layers.infowindow.style.window-size'),
          validators: ['required', {
            type: 'interval',
            min: 0,
            max: 400
          }]
        };
      }
    }

    if (type === 'infowindow_light_header_blue') {
      this.schema.headerColor = {
        type: 'Fill',
        title: _t('editor.layers.infowindow.style.header-color'),
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
