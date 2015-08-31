var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Header view when looking at details of a specific group.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['group', 'router'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    var group = this.options.group;
    var isNewGroup = group.isNew();
    var d = {
      backUrl: this.options.router.rootUrl,
      title: group.get('display_name') || 'Create new group',
      isNewGroup: isNewGroup
    };

    if (!isNewGroup) {
      var groupRootUrl = this.options.router.rootUrl.urlToPath(group.id);
      d.viewName = this.options.router.model.get('viewName');
      d.showUrl = groupRootUrl;
      d.editUrl = groupRootUrl.urlToPath('edit');
      d.usersCount = group.users.length;

      if (!this._isOnShowGroupView(groupRootUrl)) {
        d.backUrl = groupRootUrl;
      }
    }

    this.$el.html(
      this.getTemplate('organization_groups/group_header')(d)
    );
    return this;
  },

  _initBinds: function() {
    var group = this.options.group;
    group.on('change:display_name', this.render, this);
    this.add_related_model(group);

    group.users.on('reset', this.render, this);
    this.add_related_model(group.users);
  },

  _isOnShowGroupView: function(groupRootUrl) {
    return window.location.pathname.length === groupRootUrl.pathname().length;
  }

});
