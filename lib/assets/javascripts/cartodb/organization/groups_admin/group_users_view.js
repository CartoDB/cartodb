var _ = require('underscore');
var cdb = require('cartodb.js');
var PagedSearchView = require('../../common/views/paged_search/paged_search_view');
var PagedSearchModel = require('../../common/paged_search_model');
var ViewFactory = require('../../common/view_factory');
var FiltersExtraView = require('./group_users_filters_extra_view');
var UsersListView = require('./group_users_list_view');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['group', 'orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.clearSubViews();

    var pagedSearchView = new PagedSearchView({
      pagedSearchModel: new PagedSearchModel(),
      collection: this.options.group.users,
      createListView: this._createUsersListView.bind(this),
      thinFilters: true,
      filtersExtrasView: this._createFiltersExtraView()
    });
    this.addView(pagedSearchView);

    this.$el.empty();
    this.$el.append(pagedSearchView.render().el);
    return this;
  },

  _createUsersListView: function() {
    return new UsersListView({
      users: this.options.group.users,
    });
  },

  _createFiltersExtraView: function() {
    return new FiltersExtraView({
      group: this.options.group,
      orgUsers: this.options.orgUsers
    });
  }

});
