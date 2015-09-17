var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view.js');
var OrgUsersView = require('../../views/org_users/org_users_view');
var randomQuote = require('../../view_helpers/random_quote.js');
var GroupUsersView = require('../../../organization/groups_admin/group_users_view');

/**
 * Dialog to add custom basemap to current map.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    _.each(['group', 'orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.elder('initialize');
    this.model = new cdb.core.Model();
    this._initBinds();
    this._initViews();
  },

  /**
   * @override cdb.ui.common.Dialog.prototype.render
   */
  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this._onChangeSelected();
    this.$('.content').addClass('Dialog-contentWrapper');
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    switch(this.model.get('state')) {
      case 'saving':
        return this.getTemplate('common/templates/loading')({
          title: 'Adding users to group',
          quote: randomQuote()
        })
        break;
      case 'saveFail':
        return this.getTemplate('common/templates/fail')({
          msg: ''
        })
        break;
      default:
        var $content = $(
          this.getTemplate('common/dialogs/add_group_users/add_group_users')({
          })
        );
        $content.find('.js-dlg-body').replaceWith(this._orgUsersView.render().el);
        return $content;
    }
  },

  ok: function() {
    var selectedUsers = this._selectedUsers();
    if (selectedUsers.length > 0 ) {
      this.model.set('state', 'saving');

      var ids = _.map(selectedUsers, function(m) { return m.id });

      var self = this;
      this.options.group.users.addInBatch(ids)
        .done(function() {
          self.options.group.users.add(selectedUsers);
          self.close();
        })
        .fail(function() {
          self.model.set('state', 'saveFail');
        })
    }
  },

  _initViews: function() {
    var self = this;
    this._orgUsersView = new OrgUsersView({
      organizationUsers: this.options.orgUsers,
      createUsersView: function() {
        return new GroupUsersView({
          users: self.options.orgUsers
        });
      }
    });
    this.addView(this._orgUsersView);
  },

  _initBinds: function() {
    this.options.orgUsers.on('change:selected', this._onChangeSelected, this);
    this.add_related_model(this.options.orgUsers);

    this.model.on('change:state', this.render, this);
  },

  _onChangeSelected: function() {
    this.$('.ok').toggleClass('is-disabled', this._selectedUsers().length === 0);
  },

  _selectedUsers: function() {
    return this.options.orgUsers.where({ selected: true });
  }

});
