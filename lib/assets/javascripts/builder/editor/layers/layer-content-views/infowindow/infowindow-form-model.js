var _ = require('underscore');
var Backbone = require('backbone');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var DEBOUNCE_TIME = 350;

module.exports = Backbone.Model.extend({

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
      // if the attr doesn't exist in the infowindowModel it will be created, BOOM
      self._layerInfowindowModel.set(key, val);
    });
  },

  _generateSchema: function () {
    this.schema = {};

    var type = this._layerInfowindowModel.get('template_name');

    if (type !== '' && type !== 'none') {
      if (this._layerInfowindowModel.has('width')) {
        this.schema.width = {
          type: 'Number',
          title: _t('editor.layers.infowindow.style.size.label'),
          validators: ['required', {
            type: 'interval',
            min: 200,
            max: 400
          }],
          editorAttrs: {
            help: _t('editor.layers.infowindow.style.size.help')
          }
        };
      }
    }

    if (type === 'infowindow_color') {
      this.schema.headerColor = {
        type: 'Fill',
        title: _t('editor.layers.infowindow.style.header-color'),
        options: [],
        dialogMode: DialogConstants.Mode.FLOAT,
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
