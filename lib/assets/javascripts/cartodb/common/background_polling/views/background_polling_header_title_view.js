var cdb = require('cartodb.js-v3');

/**
 *  Background polling header title view
 *
 *  It will contain only the title
 *
 */

module.exports = cdb.core.View.extend({

  tagName: 'h3',
  className: 'CDB-Text CDB-Size-large u-lSpace--xl',

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/background_polling/views/background_polling_header_title');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        imports: this.model.getTotalImports(),
        geocodings: this.model.getTotalGeocodings(),
        analysis: this.model.getTotalAnalysis(),
        totalPollings: this.model.getTotalPollings()
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change analysisAdded analysisRemoved importAdded importRemoved geocodingAdded geocodingRemoved', this.render, this);
  }

});