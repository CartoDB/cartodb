const CoreView = require('backbone/core-view');
const GroupsListView = require('dashboard/views/organization/groups-admin/groups-list/groups-list-view');
const groupsIndexFiltersExtraTemplate = require('./group-index-filters-extra.tpl');
const PagedSearchView = require('dashboard/components/paged-search/paged-search-view');
const PagedSearchModel = require('dashboard/data/paged-search-model');
const ViewFactory = require('builder/components/view-factory');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'groups',
  'router',
  'newGroupUrl'
];

/**
 * Index view of groups to list groups of an organization
 */
module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    const pagedSearchView = new PagedSearchView({
      pagedSearchModel: new PagedSearchModel({
        fetch_users: true,
        fetch_shared_maps_count: true,
        fetch_shared_tables_count: true
      }),
      collection: this._groups,
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
      groups: this._groups,
      newGroupUrl: this._newGroupUrl
    });
  },

  _createFiltersExtraView: function () {
    return ViewFactory.createByTemplate(groupsIndexFiltersExtraTemplate, {
      createGroupUrl: this._router._rootUrl.urlToPath('new')
    }, {
      className: 'Filters-group'
    });
  }

});
