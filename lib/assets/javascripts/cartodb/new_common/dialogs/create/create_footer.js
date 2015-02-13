var cdb = require('cartodb.js');

/**
 *  Create footer view
 *
 *  It will show possible choices depending the
 *  selected option and the state of the main model
 *
 */

module.exports = cdb.core.View.extend({

  events: {},
  
  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_footer');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        type: this.model.get('type'),
        option: this.model.get('option'),
        mapTemplate: this.model.get('mapTemplate')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:option', this.render, this);
  }

});