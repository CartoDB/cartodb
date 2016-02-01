var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view.js');
var PagedSearchView = require('../../views/paged_search/paged_search_view');
var PagedSearchModel = require('../../paged_search_model');
var randomQuote = require('../../view_helpers/random_quote');
var GroupUsersListView = require('../../../organization/groups_admin/group_users_list_view');

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

    // Include current user in fetch results
    this.options.orgUsers.excludeCurrentUser(false);

    this._initBinds();
    this._initViews();
  },

  clean: function() {
    // restore org users
    this.options.orgUsers.restoreExcludeCurrentUser();
    this.elder('clean');
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
        $content.find('.js-dlg-body').replaceWith(this._PagedSearchView.render().el);
        return $content;
    }
  },

  ok: function() {
    var selectedUsers = this._selectedUsers();
    if (selectedUsers.length > 0 ) {
      this.model.set('state', 'saving');

      var ids = _.pluck(selectedUsers, 'id');

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
    this._PagedSearchView = new PagedSearchView({
      isUsedInDialog: true,
      pagedSearchModel: new PagedSearchModel({
        per_page: 50,
        order: 'username'
      }),
      collection: this.options.orgUsers,
      createListView: this._createUsersListView.bind(this)
    });
    this.addView(this._PagedSearchView);
  },

  _createUsersListView: function() {
    return new GroupUsersListView({
      users: this.options.orgUsers
    });
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
