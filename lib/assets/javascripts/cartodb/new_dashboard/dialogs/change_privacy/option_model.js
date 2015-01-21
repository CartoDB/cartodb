var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({
  
  defaults: {
    privacy: 'PUBLIC',
    disabled: false,
    selected: false
  },

  validate: function(attrs) {
    if (attrs.disabled && attrs.selected) {
      return 'Option can not be disabled and selected at the same time';
    }
  },
  
  classNames: function() {
    return _.chain(['disabled', 'selected'])
      .map(function(attr) { return !!this.attributes[attr] ? 'is-'+attr : undefined; }, this)
      .compact().value().join(' ');
  },

  /**
   * @param vis {Object} instance of cdb.admin.Visualization
   * @return {Object} jqXHR from
   */
  saveToVis: function(vis) {
    return vis.save({
      privacy: this.get('privacy')
    }, { wait: true });
  }
});
