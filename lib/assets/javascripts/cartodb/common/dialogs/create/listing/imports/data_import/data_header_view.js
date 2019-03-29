var cdb = require('cartodb.js-v3');

/**
 *  Data header view
 *
 *  - It will change when upload state changes
 *  - Possibility to change state with a header button
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_goToStart'
  },

  options: {
    fileEnabled: false,
    acceptSync: false
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate(this.options.template || 'common/views/create/listing/import_types/data_header');
    this._initBinds();
    this._checkVisibility();
  },

  render: function() {
    var acceptSync = this.options.acceptSync && this.user.get('actions') && this.user.get('actions').sync_tables && this.model.get('type') !== "file"; 
    
    this.$el.html(
      this.template({
        type: this.model.get('type'),
        fileEnabled: this.options.fileEnabled,
        acceptSync: acceptSync,
        state: this.model.get('state')
      })
    );
    this._checkVisibility();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  },

  _checkVisibility: function() {
    this.show()
  },

  _goToStart: function() {
    this.model.set('state', 'idle');
  }

});
