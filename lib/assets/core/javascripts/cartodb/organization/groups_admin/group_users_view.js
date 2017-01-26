var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PagedSearchView = require('../../common/views/paged_search/paged_search_view');
var PagedSearchModel = require('../../common/paged_search_model');
var ViewFactory = require('../../common/view_factory');
var randomQuote = require('../../common/view_helpers/random_quote');
var AddRemoveFiltersExtraView = require('./add_or_remove_group_users_filters_extra_view');
var EmptyGroupFiltersExtraView = require('./empty_group_filters_extra_view');
var GroupUsersListView = require('./group_users_list_view');

/**
 * View to manage users of a group
 * It basically has two states, each which relies on its own collection:
 * - Empty group: i.e. no users, show organization users and allow to add users directly by selecting
 * - Group users: allow to add or remove users from group.
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    _.each(['group', 'orgUsers'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this._groupUsers = this.options.group.users;
    this._orgUsers = this.options.orgUsers;
    this._orgUsers.excludeCurrentUser(false);
    this._hasPrefetchedGroupUsers = false;
    this.model = new cdb.core.Model({
      hasPrefetchedGroupUsers: false,
      lastRendered: null //, 'groupUsers', 'empty'
    });

    // Init binds
    this._groupUsers.bind('reset', this._onResetGroupUsers, this);
    this.add_related_model(this._groupUsers);

    // Pre-fetch to know what view to render
    var self = this;
    this._groupUsers.fetch({
      success: function () {
        self.model.set('hasPrefetchedGroupUsers', true);
        self.render();
      }
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var view;
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
    this.elder('clean');
  },

  _createInitialPreloadingView: function () {
    return ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Getting users',
      quote: randomQuote()
    });
  },

  _createViewForGroupUsers: function () {
    this.model.set('lastRendered', 'groupUsers');

    var filtersExtrasView = new AddRemoveFiltersExtraView({
      group: this.options.group,
      orgUsers: this._orgUsers
    });
    this.addView(filtersExtrasView);

    return new PagedSearchView({
      pagedSearchModel: new PagedSearchModel(),
      collection: this._groupUsers,
      createListView: this._createGroupUsersListView.bind(this, this._groupUsers),
      thinFilters: true,
      filtersExtrasView: filtersExtrasView
    });
  },

  _createViewForEmptyGroup: function () {
    this.model.set('lastRendered', 'empty');

    var filtersExtrasView = new EmptyGroupFiltersExtraView({
      groupUsers: this._groupUsers,
      orgUsers: this._orgUsers
    });
    this.addView(filtersExtrasView);

    return new PagedSearchView({
      pagedSearchModel: new PagedSearchModel(),
      collection: this._orgUsers,
      createListView: this._createGroupUsersListView.bind(this, this._orgUsers),
      thinFilters: true,
      filtersExtrasView: filtersExtrasView
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
    var lastRendered = this.model.get('lastRendered');
    var totalGroupUsersCount = this._groupUsers.totalCount();

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
