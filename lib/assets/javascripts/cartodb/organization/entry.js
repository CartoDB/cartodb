var $ = require('jquery');
var cdb = require('cartodb.js');
var HeaderView = require('../common/views/dashboard_header_view');
var SupportView = require('../common/support_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var QuotaProgressBar = require('./organization_progress_bar');
var DeleteAccount = require('./delete_org_user_view');
var AvatarSelector = require('../common/avatar_selector_view');
var ColorPickerView = require('./color_picker_view');
var OrganizationUsersView = require('./organization_users/organization_users_view');

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 *  Entry point for the new organization, bootstraps all
 *  dependency models and application.
 */

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);

    cdb.config.set(window.config); // import config

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = new cdb.admin.User(window.user_data);

    if (window.organization_user_data) {
      var organizationUser = new cdb.admin.User(window.organization_user_data);
    }

    if (window.organization_data) {
      var organization = new cdb.admin.Organization(window.organization_data);
      var organizationUsers = organization.users;
    }

    var headerView = new HeaderView({
      el:             $('#header'), //pre-rendered in DOM by Rails app
      model:          currentUser,
      currentUserUrl: currentUser.viewUrl(),
      viewModel:      new HeaderViewModel(),
      localStorage:   new LocalStorage()
    });
    headerView.render();

    var supportView = new SupportView({
      el: $('#support-banner'),
      user: currentUser
    });
    supportView.render();

    // Avatar
    if (this.$('.js-avatarSelector').length > 0) {
      var avatarSelector = new AvatarSelector({
        el: this.$('.js-avatarSelector'),
        renderModel: new cdb.core.Model({
          name: currentUser.organization.get('name'),
          avatar_url: currentUser.organization.get('avatar_url'),
          id: currentUser.get('id')
        })
      });

      avatarSelector.render();
    }

    // Tooltips
    $('[data-title]').each(function(i,el) {
      new cdb.common.TipsyTooltip({
        el: el,
        title: function() {
          return $(this).attr('data-title');
        }
      })
    });

    // Color picker
    if (this.$('.js-colorPicker').length > 0) {
      new ColorPickerView({
        el: this.$('.js-colorPicker'),
        color: this.$('.js-colorPicker').data('color')
      }).bind('colorChosen', function(color) {
        this.$('.js-colorInput').val(color);
      }, this);
    }

    // Progress quota bar?
    if (this.$('.js-quota').length > 0 && organization_data && this.$('#user_quota').length > 0) {
      new QuotaProgressBar(
        _.extend(
          organization_data,
          {
            el: this.$('.js-quota'),
            userQuota: assigned_user_quota,
            userUsedQuota: used_user_quota,
            userName: user_name,
            input: this.$('#user_quota')
          }
        )
      )
    }

    // Organization users list
    if (this.$('.js-orgUsersList').length === 1) {
      var organizationUsers = new OrganizationUsersView({
        el: this.$('.js-orgUsersList'),
        organization: organization,
        organizationUsers: organizationUsers
      });
      organizationUsers.render();
    }

    // User deletion
    if (this.$('.js-deleteAccount').length > 0 && window.authenticity_token) {
      this.$('.js-deleteAccount').click(function(ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteAccount({
          organizationUser: organizationUser,
          authenticityToken: window.authenticity_token,
          clean_on_hide: true
        }).appendToBody();
      })  
    }

  });

});
