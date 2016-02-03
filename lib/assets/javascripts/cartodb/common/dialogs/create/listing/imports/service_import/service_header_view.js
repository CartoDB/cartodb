var cdb = require('cartodb.js-v3');

/**
 *  Service header
 *
 *  - It will change when upload state changes
 *  - Possibility to change state with a header button
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_goToList'
  },

  options: {
    title: 'Service',
    showAvailableFormats: false,
    acceptSync: false,
    fileExtensions: [],
    template: ''
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate( this.options.template || 'common/views/create/listing/import_types/service_header' );
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        items: this.collection.size(),
        service_name: this.model.get("service_name"),
        showAvailableFormats: this.options.showAvailableFormats,
        fileExtensions: this.options.fileExtensions,
        acceptSync: this.options.acceptSync && this.user.get('actions').sync_tables,
        state: this.model.get('state'),
        title: this.options.title
      })
    );
    this._checkVisibility();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  },

  _checkVisibility: function() {
    var state = this.model.get('state');
    this[ state !== "list" ? 'show' : 'hide' ]()
  },

  _goToList: function() {
    this.model.set('state', 'list');
  }

});
