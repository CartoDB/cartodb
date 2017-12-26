var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/views/dashboard_header_view');
var SupportView = require('../common/support_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var OrganizationUserForm = require('./organization_user_form');
var OrganizationUserQuota = require('./organization_user_quota');
var DeleteOrganizationUser = require('./delete_org_user_view');
var DeleteOrganization = require('../common/delete_organization_view');
var AvatarSelector = require('../common/avatar_selector_view');
var ColorPickerView = require('./color_picker_view');
var OrganizationUsersView = require('./organization_users/organization_users_view');
var domainRegExp = /^[a-zA-Z0-9*][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\.[a-zA-Z]{2,3})$/;
var RegenerateKeysDialog = require('../keys/regenerate_keys_dialog_view');
var GroupsRouter = require('./groups_admin/router');
var GroupsMainView = require('./groups_admin/groups_main_view');
var FlashMessageModel = require('./flash_message_model');
var FlashMessageView = require('./flash_message_view');
var IconPickerView = require('./icon_picker/organization_icon_picker_view');
var OrganizationNotificationView = require('./organization_notification/organization_notification_view');

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 *  Entry point for the new organization, bootstraps all
 *  dependency models and application.
 */

$(function () {
  cdb.init(function () {
    var self = this;
    var user_data = window.user_data;
    var organization_user_data = window.organization_user_data;
    var organization_data = window.organization_data;

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);

    cdb.config.set(window.config); // import config

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var currentUser = new cdb.admin.User(user_data);
    var organizationUser;
    var organization;
    var organizationUsers;

    if (organization_user_data) {
      organizationUser = new cdb.admin.User(organization_user_data);
    }

    if (organization_data) {
      organization = new cdb.admin.Organization(organization_data);
      organizationUsers = organization.users;
    }

    var headerView = new HeaderView({
      el: $('#header'), // pre-rendered in DOM by Rails app
      model: currentUser,
      currentUserUrl: currentUser.viewUrl(),
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    headerView.render();

    var flashMessageModel = new FlashMessageModel();
    var flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    flashMessageView.render();
    flashMessageView.$el.insertAfter(headerView.$el);

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
          inputName: this.$('.js-fileAvatar').attr('name'),
          name: currentUser.organization.get('name'),
          avatar_url: currentUser.organization.get('avatar_url'),
          id: currentUser.get('id')
        }),
        avatarAcceptedExtensions: window.avatar_valid_extensions
      });

      avatarSelector.render();
    }

    // Tooltips
    $('[data-title]').each(function (i, el) {
      new cdb.common.TipsyTooltip({ // eslint-disable-line
        el: el,
        title: function () {
          return $(this).attr('data-title');
        }
      });
    });

    // Color picker
    if (this.$('.js-colorPicker').length > 0) {
      new ColorPickerView({
        el: this.$('.js-colorPicker'),
        color: this.$('.js-colorPicker').data('color')
      }).bind('colorChosen', function (color) {
        this.$('.js-colorInput').val(color);
      }, this);
    }

    // Icon picker
    if (this.$('.js-iconPicker').length > 0) {
      this.icon_picker_view = new IconPickerView({
        el: this.$('.js-iconPicker'),
        orgId: currentUser.organization.get('id')
      });
    }

    // Domain whitelisting
    if (this.$('.js-domains').length > 0) {
      this.$('.js-domainsList').tagit({
        allowSpaces: false,
        singleField: true,
        singleFieldNode: this.$('.js-whitelist'),
        fieldName: this.$('.js-whitelist').attr('name'),
        tagLimit: 10,
        readOnly: false,
        onBlur: function () {
          self.$('.js-domains').removeClass('is-focus');

          if ($('.tagit-choice').length > 0) {
            $('.js-placeholder').hide();
          } else {
            $('.js-placeholder').show();
          }

          if ($('.tagit-new').length > 0) {
            $('.tagit-new input').val('');
          }
        },
        onFocus: function () {
          self.$('.js-domains').addClass('is-focus');

          $('.js-placeholder').hide();
        },
        beforeTagAdded: function (ev, ui) {
          if (!domainRegExp.test(ui.tagLabel)) {
            return false;
          }

          if ($('.tagit-choice').length > 0) {
            $('.js-placeholder').hide();
          } else { $('.js-placeholder').show(); }
        },
        afterTagAdded: function (ev, ui) {
          if ($('.tagit-choice').length > 0) {
            $('.js-placeholder').hide();
          } else { $('.js-placeholder').show(); }
        }
      });
    }

    // Organization user form
    if (organizationUser) {
      this.organization_user_form = new OrganizationUserForm({
        el: this.$('.js-organizationUserForm'),
        model: organizationUser
      });
    }

    // User quota main view
    if (organizationUser) {
      this.organization_user_quota = new OrganizationUserQuota({
        el: this.$('.js-userQuota'),
        model: organizationUser
      });
    }

    // Organization users list
    if (this.$('.js-orgUsersList').length === 1) {
      this.organizationUsersView = new OrganizationUsersView({
        el: this.$('.js-orgUsersList'),
        organization: organization,
        organizationUsers: organizationUsers,
        currentUser: currentUser
      });
      this.organizationUsersView.render();
    }

    // User deletion
    if (this.$('.js-deleteAccount').length > 0 && window.authenticity_token) {
      this.$('.js-deleteAccount').click(function (ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteOrganizationUser({
          organizationUser: organizationUser,
          authenticityToken: window.authenticity_token,
          clean_on_hide: false
        }).appendToBody();
      });
    }

    // Organization deletion
    if (this.$('.js-deleteOrganization').length > 0 && window.authenticity_token) {
      this.$('.js-deleteOrganization').click(function (ev) {
        if (ev) {
          ev.preventDefault();
        }
        new DeleteOrganization({
          authenticityToken: window.authenticity_token,
          clean_on_hide: true,
          user: currentUser
        }).appendToBody();
      });
    }

    // Notifications
    if (this.$('.js-OrganizationNotification').length > 0) {
      var authenticityToken = $('[name=authenticity_token][value]').get(0).value;

      this.organization_notification_view = new OrganizationNotificationView({
        el: this.$('.js-OrganizationNotification'),
        authenticityToken: authenticityToken
      });
      this.organization_notification_view.render();
    }

    // API keys
    var regenerateApiKeyHandler = function (ev, scope, form_action) {
      if (ev) ev.preventDefault();
      var authenticity_token = $('[name=authenticity_token][value]').get(0).value;
      var dlg = new RegenerateKeysDialog({
        type: 'api',
        scope: scope,
        form_action: form_action,
        authenticity_token: authenticity_token
      });

      dlg.appendToBody();
    };

    var toggleUserQuotas = function () {
      var viewer = $('.js-userViewerOption:checked').val();
      if (viewer === 'true') {
        $('.user-quotas').hide();
        $('.js-org-admin-row').hide();
        $('#org_admin').prop('checked', false);
      } else {
        $('.user-quotas').show();
        $('.js-org-admin-row').show();
      }
    };

    toggleUserQuotas();

    $('.js-userViewerOption').bind('change', function (ev) {
      toggleUserQuotas();
    });

    $('.js-regenerateOrgUsersApiKey').bind('click', function (ev) {
      var current_username = $(this).attr('data-current_username');

      regenerateApiKeyHandler(ev, 'organization', '/u/' + current_username + '/organization/regenerate_api_keys');
    });

    $('.js-regenerateOrgUserApiKey').bind('click', function (ev) {
      var username = $(this).attr('data-username');
      var current_username = $(this).attr('data-current_username');

      regenerateApiKeyHandler(ev, 'organization_user', '/u/' + current_username + '/organization/users/' + username + '/regenerate_api_key');
    });

    var $groups = $('.js-groups-content');
    if ($groups) {
      if (!currentUser.isOrgAdmin()) {
        window.location = currentUser.viewUrl().accountProfile();
        return false;
      }

      var groups = new cdb.admin.OrganizationGroups([], {
        organization: currentUser.organization
      });
      var router = new GroupsRouter({
        rootUrl: currentUser.viewUrl().organization().groups(),
        flashMessageModel: flashMessageModel,
        groups: groups,
        user: currentUser
      });

      var groupsMainView = new GroupsMainView({
        el: $groups,
        groups: groups,
        router: router,
        user: currentUser
      });
      groupsMainView.render();
      window.groups = groupsMainView;

      router.enableAfterMainView();
    }
  });
});
