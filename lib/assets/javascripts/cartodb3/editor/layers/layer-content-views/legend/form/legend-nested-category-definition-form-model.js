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
      editorAttrs: {
        color: {
          hidePanes: ['value']
        },
        className: 'LegendItem-inner'
      }
    },
    name: {
      type: 'Text',
      title: '',
      editorAttrs: {
        className: 'LegendItem-inner',
        placeholder: _t('editor.legend.legend-form.untitled')
      }
    }
  },

  initialize: function (attrs, opts) {
    var fill = _.clone(defaultFill);
    if (attrs.fill === undefined) {
      fill.color.fixed = LegendColors.getNextColor();
      this.set({fill: fill}, {silent: true});
    }
  }
});
