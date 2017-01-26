var _ = require('underscore-cdb-v3');
var Router = require('../../common/router');
var RouterModel = require('./router_model');
var GroupHeaderView = require('./group_header_view');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');
var GroupUsersView = require('./group_users_view');
var EditGroupView = require('./edit_group_view');
var ViewFactory = require('../../common/view_factory');

/**
 *  Backbone router for organization groups urls.
 */
module.exports = Router.extend({

  routes: Router.supportTrailingSlashes({
    '': 'renderGroupsIndex',
    'new': 'renderCreateGroup',
    ':id': 'renderGroupUsers',
    ':id/edit': 'renderEditGroup',

    // If URL is lacking the trailing slash (e.g. 'http://username.carto.com/organization/groups'), treat it like index
    '*prefix/groups': 'renderGroupsIndex'
  }),

  initialize: function (opts) {
    _.each(['rootUrl', 'groups', 'user', 'flashMessageModel'], function (name) {
      if (!opts[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new RouterModel();
    this.user = opts.user;
    this.groups = opts.groups;
    this.flashMessageModel = opts.flashMessageModel;
    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
    this.model.createLoadingView('Loading view'); // Until router's history is started
    this.model.on('change', this._onChange, this);
  },

  normalizeFragmentOrUrl: function (fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  isWithinCurrentRoutes: function (url) {
    return url.indexOf(this.rootUrl.pathname()) !== -1;
  },

  renderGroupsIndex: function () {
    this.model.set('view',
      new GroupsIndexView({
        newGroupUrl: this._groupUrl.bind(this),
        groups: this.groups,
        router: this
      })
    );
  },

  renderCreateGroup: function () {
    var group = this.groups.newGroupById();
    var self = this;
    this.model.set('view',
      ViewFactory.createByList([
        self._createGroupHeader(group),
        new CreateGroupView({
          flashMessageModel: self.flashMessageModel,
          group: group,
          onCreated: self._navigateToGroup.bind(self, group)
        })
      ])
    );
  },

  renderGroupUsers: function (id) {
    var self = this;
    this.model.createGroupView(this.groups, id, function (group) {
      return ViewFactory.createByList([
        self._createGroupHeader(group, 'group_users'),
        new GroupUsersView({
          group: group,
          orgUsers: self.user.organization.users
        })
      ]);
    });
  },

  renderEditGroup: function (id) {
    var self = this;
    this.model.createGroupView(this.groups, id, function (group) {
      return ViewFactory.createByList([
        self._createGroupHeader(group, 'edit_group'),
        new EditGroupView({
          flashMessageModel: self.flashMessageModel,
          group: group,
          onSaved: self._navigateToGroup.bind(self, group),
          onDeleted: self.navigate.bind(self, self.rootUrl, { trigger: true })
        })
      ]);
    });
  },

  _navigateToGroup: function (group) {
    this.navigate(this.rootUrl.urlToPath(group.id), { trigger: true });
  },

  _groupUrl: function (group, subpath) {
    var path = group.id;

    if (subpath) {
      path += '/' + subpath;
    }

    return this.rootUrl.urlToPath(path);
  },

  _createGroupHeader: function (group, current) {
    var urls = {
      root: this.rootUrl,
      users: this._groupUrl(group),
      edit: this._groupUrl(group, 'edit')
    };
    urls.users.isCurrent = current === 'group_users';
    urls.edit.isCurrent = current === 'edit_group';

    return new GroupHeaderView({
      group: group,
      urls: urls
    });
  },

  _onChange: function () {
    this.flashMessageModel.hide();
  }

});
