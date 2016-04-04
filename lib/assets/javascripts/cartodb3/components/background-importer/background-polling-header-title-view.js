var cdb = require('cartodb.js-v3');
var Template = require('background-polling-header-title.tpl');

/**
 *  Background polling header title view
 *
 *  It will contain only the title
 *
 */
module.exports = cdb.core.View.extend({

  tagName: 'h3',
  className: 'BackgroundPolling-headerTitle',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      Template({
        imports: this.model.getTotalImports(),
        geocodings: this.model.getTotalGeocodings(),
        analysis: this.model.getTotalAnalysis(),
        totalPollings: this.model.getTotalPollings()
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change analysisAdded analysisRemoved importAdded importRemoved geocodingAdded geocodingRemoved', this.render, this);
  }
});
