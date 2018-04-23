const CoreView = require('backbone/core-view');
const template = require('./background-polling-header-title.tpl');

/**
 *  Background polling header title view
 *
 *  It will contain only the title
 *
 */

module.exports = CoreView.extend({
  tagName: 'h3',
  className: 'CDB-Text CDB-Size-large u-lSpace--xl',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        imports: this.model.getTotalImports(),
        totalPollings: this.model.getTotalPollings()
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change analysisAdded analysisRemoved importAdded importRemoved geocodingAdded geocodingRemoved', this.render, this);
  }

});
