var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var pluralizeString = require('../../common/view_helpers/pluralize_string');

/**
 * Header view when looking at details of a specific group.
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    _.each(['group', 'urls'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function () {
    this._$orgSubheader().hide();
    var group = this.options.group;
    var isNewGroup = group.isNew();
    var d = {
      backUrl: this.options.urls.root,
      title: group.get('display_name') || 'Create new group',
      isNewGroup: isNewGroup,
      usersUrl: false
    };

    if (isNewGroup) {
      d.editUrl = window.location;
      d.editUrl.isCurrent = true;
    } else {
      d.editUrl = this.options.urls.edit;
      d.usersUrl = this.options.urls.users;
      var usersCount = group.users.length;
      d.usersLabel = usersCount === 0 ? 'Users' : usersCount + ' ' + pluralizeString('User', 'Users', usersCount);

      if (!this.options.urls.users.isCurrent) {
        d.backUrl = this.options.urls.users;
      }
    }

    this.$el.html(
      this.getTemplate('organization/groups_admin/group_header')(d)
    );
    return this;
  },

  clean: function () {
    this._$orgSubheader().show();
    cdb.core.View.prototype.clean.call(this);
  },

  _$orgSubheader: function () {
    return $('.js-org-subheader');
  },

  _initBinds: function () {
    var group = this.options.group;
    group.on('change:display_name', this.render, this);
    this.add_related_model(group);

    group.users.on('reset add remove', this.render, this);
    this.add_related_model(group.users);
  }

});
