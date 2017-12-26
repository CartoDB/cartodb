var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var GroupsListView = require('./groups_list_view');
var PagedSearchView = require('../../common/views/paged_search/paged_search_view');
var PagedSearchModel = require('../../common/paged_search_model');
var ViewFactory = require('../../common/view_factory');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    _.each(['groups', 'router', 'newGroupUrl'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function () {
    this.clearSubViews();

    var pagedSearchView = new PagedSearchView({
      pagedSearchModel: new PagedSearchModel({
        fetch_users: true,
        fetch_shared_maps_count: true,
        fetch_shared_tables_count: true
      }),
      collection: this.options.groups,
      createListView: this._createGroupsView.bind(this),
      thinFilters: true,
      filtersExtrasView: this._createFiltersExtraView(),
      noResults: {
        icon: 'CDB-IconFont-group',
        title: 'You have not created any groups yet',
        msg: 'Creating groups enables you to visualize and search for user members assigned to a business group or team in your organization.'
      }
    });
    this.addView(pagedSearchView);

    this.$el.empty();
    this.$el.append(pagedSearchView.render().el);
    return this;
  },

  _createGroupsView: function () {
    return new GroupsListView({
      groups: this.options.groups,
      newGroupUrl: this.options.newGroupUrl
    });
  },

  _createFiltersExtraView: function () {
    return ViewFactory.createByTemplate('organization/groups_admin/groups_index_filters_extra', {
      createGroupUrl: this.options.router.rootUrl.urlToPath('new')
    }, {
      className: 'Filters-group'
    });
  }

});
