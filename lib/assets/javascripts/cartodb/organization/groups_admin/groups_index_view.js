var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupsListView = require('./groups_list_view');
var PagedSearchView = require('../../common/views/paged_search/paged_search_view');
var PagedSearchModel = require('../../common/paged_search_model');
var ViewFactory = require('../../common/view_factory');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['groups', 'router', 'newGroupUrl'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.clearSubViews();

    var pagedSearchView = new PagedSearchView({
      filtersExtrasView: ViewFactory.createByTemplate('organization/groups_admin/groups_index_filters_extra', {
          createGroupUrl: this.options.router.rootUrl.urlToPath('new')
        }, {
          className: 'Filters-type'
        }),
      pagedSearchModel: new PagedSearchModel({
        fetch_users: true,
        fetch_shared_maps_count: true,
        fetch_shared_tables_count: true
      }),
      collection: this.options.groups,
      createListView: this._createGroupsView.bind(this)
    });
    this.addView(pagedSearchView);

    this.$el.empty();
    this.$el.append(pagedSearchView.render().el);
    return this;
  },

  _createGroupsView: function() {
    return new GroupsListView({
      groups: this.options.groups,
      newGroupUrl: this.options.newGroupUrl
    });
  }

});
