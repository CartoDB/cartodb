const RouterBase = require('dashboard/common/router-base');
const RouterModel = require('dashboard/views/organization/groups-admin/router-model');
const GroupHeaderView = require('dashboard/views/organization/groups-admin/group-header/group-header-view');
const GroupsIndexView = require('dashboard/views/organization/groups-admin/group-index/group-index-view');
const CreateGroupView = require('dashboard/views/organization/groups-admin/create-group/create-group-view');
const GroupUsersView = require('dashboard/views/organization/groups-admin/group-users/group-users-view');
const EditGroupView = require('dashboard/views/organization/groups-admin/edit-group/edit-group-view');
const ViewFactory = require('builder/components/view-factory');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'rootUrl',
  'groups',
  'userModel',
  'flashMessageModel',
  'modals'
];

/**
 *  Backbone router for organization groups urls.
 */
module.exports = RouterBase.extend({

  routes: RouterBase.supportTrailingSlashes({
    '': 'renderGroupsIndex',
    'new': 'renderCreateGroup',
    ':id': 'renderGroupUsers',
    ':id/edit': 'renderEditGroup',

    // If URL is lacking the trailing slash (e.g. 'http://username.carto.com/organization/groups'), treat it like index
    '*prefix/groups': 'renderGroupsIndex'
  }),

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.rootPath = this._rootUrl.pathname.bind(this._rootUrl);

    this.model = new RouterModel();
    this.model.createLoadingView('Loading view'); // Until router's history is started
    this.listenTo(this.model, 'change', this._onChange);
  },

  normalizeFragmentOrUrl: function (fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this._rootUrl.toString(), '') : '';
  },

  isWithinCurrentRoutes: function (url) {
    return url.indexOf(this._rootUrl.pathname()) !== -1;
  },

  renderGroupsIndex: function () {
    this.model.set('view',
      new GroupsIndexView({
        newGroupUrl: this._groupUrl.bind(this),
        groups: this._groups,
        router: this
      })
    );
  },

  renderCreateGroup: function () {
    const group = this._groups.newGroupById();

    this.model.set('view',
      ViewFactory.createListView([
        () => this._createGroupHeader(group),

        () => new CreateGroupView({
          flashMessageModel: this._flashMessageModel,
          group,
          onCreated: this._navigateToGroup.bind(this, group)
        })
      ])
    );
  },

  renderGroupUsers: function (id) {
    this.model.createGroupView(this._groups, id, group => {
      return ViewFactory.createListView([
        () => this._createGroupHeader(group, 'group_users'),

        () => new GroupUsersView({
          group,
          orgUsers: this._userModel.organization.users,
          userModel: this._userModel
        })
      ]);
    });
  },

  renderEditGroup: function (id) {
    this.model.createGroupView(this._groups, id, group => {
      return ViewFactory.createListView([
        () => this._createGroupHeader(group, 'edit_group'),

        () => new EditGroupView({
          group,
          flashMessageModel: this._flashMessageModel,
          modals: this._modals,
          userModel: this._userModel,
          onSaved: this._navigateToGroup.bind(this, group),
          onDeleted: this.navigate.bind(this, this._rootUrl, { trigger: true })
        })
      ]);
    });
  },

  _navigateToGroup: function (group) {
    this.navigate(this._rootUrl.urlToPath(group.id), { trigger: true });
  },

  _groupUrl: function (group, subpath) {
    var path = group.id;

    if (subpath) {
      path += '/' + subpath;
    }

    return this._rootUrl.urlToPath(path);
  },

  _createGroupHeader: function (group, current) {
    var urls = {
      root: this._rootUrl,
      users: this._groupUrl(group),
      edit: this._groupUrl(group, 'edit')
    };
    urls.users.isCurrent = current === 'group_users';
    urls.edit.isCurrent = current === 'edit_group';

    return new GroupHeaderView({ group, urls });
  },

  _onChange: function () {
    this._flashMessageModel.hide();
  }

});
