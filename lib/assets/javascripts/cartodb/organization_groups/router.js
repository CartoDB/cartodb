var cdb = require('cartodb.js');
var Router = require('../common/router');
var RouterModel = require('./router_model');
var GroupHeaderView = require('./group_header_view');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');
var ShowGroupView = require('./show_group_view');
var EditGroupView = require('./edit_group_view');
var ViewFactory = require('../common/view_factory');

/**
 *  Backbone router for organization groups urls.
 */
module.exports = Router.extend({

  routes: {

    // Groups index
    '': 'routeToGroupsIndex',

    // If URL is lacking the trailing slash (e.g. 'http://username.cartodb.com/organization/groups'), treat it like index
    'groups': 'routeToGroupsIndex',
    '*prefix/groups': 'routeToGroupsIndex',

    // Create a new group
    'new': 'routeToCreateGroup',
    'new/': 'routeToCreateGroup',

    // Show group details
    ':id': 'routeToShowGroup',
    ':id/': 'routeToShowGroup',

    // Edit settings for a group
    ':id/edit': 'routeToEditGroup',
    ':id/edit/': 'routeToEditGroup'
  },

  initialize: function(opts) {
    _.each(['rootUrl', 'groups'], function(name) {
      if (!opts[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new RouterModel({
      groups: opts.groups
    });
    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
    this.model.createLoadingView('Loading view'); // Until router's history is started
  },

  normalizeFragmentOrUrl: function(fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  routeToGroupsIndex: function() {
    this.model.createLoadingView('Loading groups');

    var self = this;
    var groups = this.model.get('groups');
    groups.fetch({
      data: {
        fetch_members: true
      },
      success: function() {
        self.model.set('view',
          new GroupsIndexView({
            groups: groups,
            router: self
          })
        );
      },
      error: this.model.createErrorView.bind(this.model)
    });
  },

  routeToCreateGroup: function() {
    var group = this.model.getOrNewGroup();
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
    this.model.createGroupView(id, function(group) {
      self.model.set('view',
        ViewFactory.createByList([
          self._createGroupHeader(group),
          new ShowGroupView({
            group: group
          })
        ])
      );
    });
  },

  routeToEditGroup: function(id) {
    var self = this;
    this.model.createGroupView(id, function(group) {
      self.model.set('view',
        ViewFactory.createByList([
          self._createGroupHeader(group),
          new EditGroupView({
            group: group,
            onSaved: self._navigateToGroup.bind(self, group),
            onDeleted: self.navigate.bind(self, self.rootUrl.toString())
          })
        ])
      );
    });
  },

  _navigateToGroup: function(group) {
    this.navigate(this.rootUrl.urlToPath(group.id), { trigger: true });
  },

  _createGroupHeader: function(group) {
    return new GroupHeaderView({
      group: group,
      router: this
    });
  }

});
