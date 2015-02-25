var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

/*
 *  Content result default view
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-mail-link': '_onMailClick',
    'click .js-link':      '_onLinkClick'
  },

  initialize: function() {
    this.user = this.options.user;
    this.routerModel = this.options.routerModel;
    this.template = cdb.templates.getTemplate(this.options.template);

    this._initBinds();
  },

  render: function() {
    var type = this.routerModel.get('content_type');

    // Render can be called before there even are data to render, guard for that case
    var defaultUrl = '';
    // if (type) {
    //   defaultUrl = this.router.rootUrlForCurrentType().toDefault();
    // }

    this.$el.html(this.template({
      defaultUrl:     defaultUrl,
      page:           this.routerModel.get('page'),
      tag:            this.routerModel.get('tag'),
      q:              this.routerModel.get('q'),
      shared:         this.routerModel.get('shared'),
      liked:          this.routerModel.get('liked'),
      locked:         this.routerModel.get('locked'),
      library:        this.routerModel.get('library'),
      type:           type,
      totalItems:     this.collection.size(),
      totalEntries:   this.collection.total_entries
    }));

    return this;
  },

  _initBinds: function() {
    this.routerModel.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.routerModel);
    this.add_related_model(this.collection);
  },

  _onMailClick: function(e) {
    if (e) e.stopPropagation()
  },

  _onLinkClick: function() {
    debugger;
  }

});
