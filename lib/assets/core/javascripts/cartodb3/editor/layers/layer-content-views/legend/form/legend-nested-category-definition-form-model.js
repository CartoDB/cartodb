var _ = require('underscore');
var Backbone = require('backbone');
var LegendColors = require('./legend-color-range');

var defaultFill = {
  color: {
    fixed: '#fabada',
    opacity: 0.9
  }
};

module.exports = Backbone.Model.extend({
  schema: {
    fill: {
      type: 'Fill',
      title: '',
      options: [],
      dialogMode: 'float',
      editorAttrs: {
        color: {
          hidePanes: ['value'],
          imageEnabled: true,
          help: _t('editor.legend.tooltips.item.fill')
        },
        className: 'LegendItem-inner'
      }
    },
    title: {
      type: 'Text',
      title: '',
      editorAttrs: {
        className: 'LegendItem-inner',
        placeholder: _t('editor.legend.legend-form.untitled'),
        help: _t('editor.legend.tooltips.item.title')
      }
    }
  },

  initialize: function (attrs, opts) {
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;

    this._setOptions();

    var fill = _.clone(defaultFill);
    if (attrs.fill === undefined) {
      fill.color.fixed = LegendColors.getNextColor();
      this.set({fill: fill}, {silent: true});
    }
  },

  _setOptions: function () {
    this.schema.fill.editorAttrs.userModel = this._userModel;
    this.schema.fill.editorAttrs.configModel = this._configModel;
    this.schema.fill.editorAttrs.modals = this._modals;
  }
});
