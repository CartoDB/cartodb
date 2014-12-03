/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */

var cdb = require('cartodb.js');



module.exports = cdb.core.View.extend({

  className: 'u-inner',

  events: {
    'submit form':                      '_submit',
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

  _submit: function(e) {
    if (e) e.preventDefault();
    var path = $(e.target).attr('action');
    var value = $(e.target).find('input[type="text"]').val();

    // Clean tag or search text
    path = path
      .replace('/search', '')
      .replace('/tag', '');

    // Check if user if looking for a :tag or a query
    if (value.search(':') === 0) {
      path += '/tag/' + value
    } else {
      path += '/search/' + value
    }

    this.router.navigate(path, {trigger: true});
  },

  _navigate: function(e) {
    if (e && !e.metaKey) {
      e.preventDefault();
      var path = $(e.target).attr('href');
      this.router.navigate(path, {trigger: true});
    }
  }

})
