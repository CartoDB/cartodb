var _ = require('underscore');
var cdb = require('cartodb.js');
var pluralizeString = require('../common/view_helpers/pluralize_string');

/**
 * Header view when looking at details of a specific group.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['group', 'urls'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    var group = this.options.group;
    var isNewGroup = group.isNew();
    var d = {
      backUrl: this.options.urls.root,
      title: group.get('display_name') || 'Create new group',
      isNewGroup: isNewGroup
    };

    if (!isNewGroup) {
      d.showUrl = this.options.urls.show;
      d.editUrl = this.options.urls.edit;
      d.usersCount = group.users.length;
      d.pluralizeString = pluralizeString

      if (!this.options.urls.show.isCurrent) {
        d.backUrl = this.options.urls.show;
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
  }

});
