var cdb = require('cartodb.js-v3');

/**
 *  Create header view
 *
 *  It will manage which content should be displayed
 *  depending create model
 *
 */

module.exports = cdb.core.View.extend({
  
  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/create/create_header');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        type: this.model.get('type'),
        option: this.model.getOption()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:option', this.render, this);
  }

});