/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */

var cdb = require('cartodb-editor');



module.exports = cdb.core.View.extend({

  className: 'u-inner',

  events: {
    'click .DashboardFilters-typeLink': '_navigate'
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('new_dashboard/views/filters');

    this._initBinds();
  },

  render: function() {
    // Content
    this.$el.html(
      this.template(
        _.extend({
            order:  this.localStorage.get('dashboard.order'),
            org:    this.user.isInsideOrg(),
            prefix: cdb.config.prefixUrl()
          },
          this.router.model.attributes
        )  
      )
    );

    // Animations?

    return this;
  },

  _initBinds: function() {
    this.router.model.on('change', this.render, this);
  },

  _navigate: function(e) {
    if (e) e.preventDefault();
    var href = $(e.target).attr('href');
    this.router.navigate(href, {trigger: true});
  }

})