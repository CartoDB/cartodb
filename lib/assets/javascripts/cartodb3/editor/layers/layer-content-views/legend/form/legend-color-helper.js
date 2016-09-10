var _ = require('underscore');

function buildSwatch (color, name) {
  if (_.isString(color)) {
    color = {
      fixed: color,
      opacity: 1
    };
  }

  return {
    fill: {
      color: color
    },
    name: name
  };
}

function simpleColor (color) {
  return [buildSwatch(color, _t('editor.legend.legend-form.untitled'))];
}

function collectionColor (color) {
  var range = color.range.length;
  return _.range(range).map(function (v, index) {
    // if style attribute is number there is no domain (choropleth)
    return buildSwatch(color.range[index], color.domain && color.domain[index] || _t('editor.legend.legend-form.untitled'));
  });
}

module.exports = {
  getCategories: function (color) {
    if (color.fixed !== undefined) {
      return simpleColor(color);
    } else if (color.attribute) {
      return collectionColor(color);
    }
  },

  getBubbles: function (color) {
    return _.omit(_.first(this.getCategories(color)), 'name').fill;
  }
};
