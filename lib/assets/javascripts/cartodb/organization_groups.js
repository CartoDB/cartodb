var $ = require('jquery');
var cdb = require('cartodb.js');
var Router = require('./organization_groups/router');
var GroupsMainView = require('./organization_groups/groups_main_view');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.user_data.base_url);
    var user = new cdb.admin.User(window.user_data);
    if (!user.isOrgAdmin()) {
      window.location = user.viewUrl().accountSettings();
      return false;
    }

    var groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
    var router = new Router({
      rootUrl: user.viewUrl().organization().groups(),
      groups: groups
    });

    var groupsMainView = new GroupsMainView({
      el: document.body,
      router: router,
      user: user,
      groups: groups
    });
    groupsMainView.render();
    window.groups = groupsMainView;

    router.enableAfterMainView();
  });
});
