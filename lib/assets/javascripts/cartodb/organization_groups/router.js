var _ = require('underscore');
var cdb = require('cartodb.js');
var Router = require('../common/router');
var RouterModel = require('./router_model');
var GroupHeaderView = require('./group_header_view');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');
var ShowGroupView = require('./show_group_view');
var EditGroupView = require('./edit_group_view');
var ViewFactory = require('../common/view_factory');
var PaginationModel = require('../common/views/pagination/model');

/**
 *  Backbone router for organization groups urls.
 */
module.exports = Router.extend({

  routes: Router.supportTrailingSlashes({
    '': 'routeToGroupsIndex',
    'new': 'routeToCreateGroup',
    ':id': 'routeToShowGroup',
    ':id/edit': 'routeToEditGroup',

    // If URL is lacking the trailing slash (e.g. 'http://username.cartodb.com/organization/groups'), treat it like index
    '*prefix/groups': 'routeToGroupsIndex'
  }),

  initialize: function(opts) {
    _.each(['rootUrl', 'groups', 'user'], function(name) {
      if (!opts[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new RouterModel();
    this.user = opts.user;
    this.groups = opts.groups;
    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
    this.model.createLoadingView('Loading view'); // Until router's history is started
  },

  normalizeFragmentOrUrl: function(fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  isWithinCurrentRoutes: function(url) {
    return url.indexOf(this.rootUrl.pathname()) !== -1;
  },

  routeToGroupsIndex: function() {
    this.model.createLoadingView('Loading groups');

    var self = this;
    this.groups.fetch({
      data: {
        fetch_users: true
      },
      success: function() {
        self.model.set('view',
          new GroupsIndexView({
            groups: self.groups,
            router: self
          })
        );
      },
      error: this.model.createErrorView.bind(this.model)
    });
  },

  routeToCreateGroup: function() {
    var group = this.groups.newGroupById();
    var self = this;
    this.model.set('view',
      ViewFactory.createByList([
        self._createGroupHeader(group),
        new CreateGroupView({
          group: group,
          onCreated: self._navigateToGroup.bind(self, group)
        })
      ])
    );
  },

  routeToShowGroup: function(id) {
    var self = this;
    this.model.createGroupView(this.groups, id, function(group) {
      return ViewFactory.createByList([
        self._createGroupHeader(group, 'show'),
        new ShowGroupView({
          group: group,
          orgUsers: self.user.organization.users
        })
      ]);
    });
  },

  routeToEditGroup: function(id) {
    var self = this;
    this.model.createGroupView(this.groups, id, function(group) {
      return ViewFactory.createByList([
        self._createGroupHeader(group, 'edit'),
        new EditGroupView({
          group: group,
          onSaved: self._navigateToGroup.bind(self, group),
          onDeleted: self.navigate.bind(self, self.rootUrl.toString())
        })
      ])
    });
  },

  _navigateToGroup: function(group) {
    this.navigate(this.rootUrl.urlToPath(group.id), { trigger: true });
  },

  _groupUrl: function(group, subpath) {
    var path = group.id;
    if (subpath) {
      path += '/' + subpath
    }
    return this.rootUrl.urlToPath(path)
  },

  _createGroupHeader: function(group, current) {
    var urls = {
      root: this.rootUrl,
      show: this._groupUrl(group),
      edit: this._groupUrl(group, 'edit'),
    };
    urls.root.isCurrent = current === 'root';
    urls.show.isCurrent = current === 'show';
    urls.edit.isCurrent = current === 'edit';

    return new GroupHeaderView({
      group: group,
      urls: urls
    });
  }

});
