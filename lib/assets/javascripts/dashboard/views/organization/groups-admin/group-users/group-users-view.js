const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const PagedSearchView = require('dashboard/components/paged-search/paged-search-view');
const PagedSearchModel = require('dashboard/data/paged-search-model');
const ViewFactory = require('builder/components/view-factory');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const randomQuote = require('builder/components/loading/random-quote');
const AddRemoveFiltersExtraView = require('dashboard/views/organization/groups-admin/filters/add-or-remove-group-users-filters-extra-view');
const EmptyGroupFiltersExtraView = require('dashboard/views/organization/groups-admin/filters/empty-group-filters-extra-view');
const GroupUsersListView = require('dashboard/views/organization/groups-admin/group-users-list/group-users-list-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'orgUsers',
  'userModel'
];

/**
 * View to manage users of a group
 * It basically has two states, each which relies on its own collection:
 * - Empty group: i.e. no users, show organization users and allow to add users directly by selecting
 * - Group users: allow to add or remove users from group.
 */
module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._groupUsers = this._group.users;
    this._hasPrefetchedGroupUsers = false;
    this._orgUsers.excludeCurrentUser(false);

    this.model = new Backbone.Model({
      hasPrefetchedGroupUsers: false,
      lastRendered: null //, 'groupUsers', 'empty'
    });

    // Init binds
    this.listenTo(this._groupUsers, 'sync', this._onResetGroupUsers);

    // Pre-fetch to know what view to render
    this._groupUsers.fetch({
      success: () => {
        this.model.set('hasPrefetchedGroupUsers', true);
        this.render();
      }
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    let view;
    if (this.model.get('hasPrefetchedGroupUsers')) {
      view = this._groupUsers.totalCount() > 0
        ? this._createViewForGroupUsers()
        : this._createViewForEmptyGroup();
    } else {
      view = this._createInitialPreloadingView();
    }

    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },

  clean: function () {
    this._orgUsers.restoreExcludeCurrentUser();
    CoreView.prototype.clean.apply(this);
  },

  _createInitialPreloadingView: function () {
    return ViewFactory.createByTemplate(loadingTemplate, {
      title: 'Getting users',
      descHTML: randomQuote()
    });
  },

  _createViewForGroupUsers: function () {
    this.model.set('lastRendered', 'groupUsers');

    const filtersExtrasView = new AddRemoveFiltersExtraView({
      group: this._group,
      orgUsers: this._orgUsers,
      userModel: this._userModel
    });
    this.addView(filtersExtrasView);

    return new PagedSearchView({
      pagedSearchModel: new PagedSearchModel(),
      collection: this._groupUsers,
      createListView: this._createGroupUsersListView.bind(this, this._groupUsers),
      thinFilters: true,
      filtersExtrasView
    });
  },

  _createViewForEmptyGroup: function () {
    this.model.set('lastRendered', 'empty');

    const filtersExtrasView = new EmptyGroupFiltersExtraView({
      groupUsers: this._groupUsers,
      orgUsers: this._orgUsers,
      userModel: this._userModel
    });
    this.addView(filtersExtrasView);

    return new PagedSearchView({
      pagedSearchModel: new PagedSearchModel(),
      collection: this._orgUsers,
      createListView: this._createGroupUsersListView.bind(this, this._orgUsers),
      thinFilters: true,
      filtersExtrasView
    });
  },

  _createGroupUsersListView: function (usersCollection) {
    return new GroupUsersListView({
      users: usersCollection
    });
  },

  _onResetGroupUsers: function () {
    // just this.render() is not enough, because each sub-view re-renders its view on state changes,
    // Instead, only re-render when hitting the edge-cases after a rest
    const lastRendered = this.model.get('lastRendered');
    const totalGroupUsersCount = this._groupUsers.totalCount();

    if (lastRendered === 'empty') {
      // scenario: added at least one user, so group is no longer empty => change to group users view to add users
      if (totalGroupUsersCount > 0) {
        this.render();
      }
    } else if (lastRendered === 'groupUsers') {
      // scenario: removed last group user(s), so the group is now "empty" => change to org users view to add users
      if (totalGroupUsersCount === 0) {
        this.render();
      }
    }
  }

});
