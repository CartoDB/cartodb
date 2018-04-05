const Polyglot = require('node-polyglot');
const Locale = require('locale/index');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');
const ConfigModel = require('dashboard/data/config-model');
const DashboardHeaderView = require('dashboard/components/dashboard-header-view');
const SupportView = require('dashboard/components/support-view');
const HeaderViewModel = require('./views/organization/header-view-model');
const LocalStorage = require('dashboard/helpers/local-storage');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const FlashMessageView = require('dashboard/components/flash-message/flash-message-view');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const OrganizationUsersView = require('dashboard/views/organization/organization-users/organization-users-view');
const OrganizationNotificationView = require('dashboard/views/organization/organization-notification/organization-notification-view');
const OrganizationUserQuota = require('dashboard/views/organization/organization-user-quota');
const AvatarSelector = require('dashboard/components/avatar-selector/avatar-selector-view');
const OrganizationUserForm = require('dashboard/views/organization/organization-user-form');
const RegenerateKeysDialog = require('dashboard/views/organization/regenerate-keys-dialog-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const DeleteOrganization = require('dashboard/views/organization/delete-organization-view');
const IconPickerView = require('dashboard/views/organization/icon-picker/organization-icon-picker-view');
const DeleteOrganizationUser = require('dashboard/views/organization/delete-organization-user-view');
const getObjectValue = require('deep-insights/util/get-object-value');
require('dashboard/data/backbone/sync-options');

// var GroupsRouter = require('./groups_admin/router');
// var GroupsMainView = require('./groups_admin/groups_main_view');

const DOMAIN_REGEXP = /^[a-zA-Z0-9*][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\.[a-zA-Z]{2,3})$/;

const configModel = new ConfigModel(
  _.defaults(
    { base_url: window.user_data.base_url },
    window.config
  )
);

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
  let organizationUser;
  let organization;
  let organizationUsers;

  const modalsService = new ModalsServiceModel();

  const userModel = new UserModel(window.user_data, { configModel });

  if (window.user_data.organization) {
    organization = new OrganizationModel({
      ...window.user_data.organization,
      ...window.organization_data
    }, {
      userModel,
      configModel
    });
    organizationUsers = organization.users;
    organization.owner = new UserModel(getObjectValue(window.user_data, 'organization.owner'));
    userModel.setOrganization(organization);
  }

  if (window.organization_user_data) {
    organizationUser = new UserModel(window.organization_user_data, { configModel });

    if (organization) {
      organizationUser.setOrganization(organization);
    }
  }

  const headerView = new DashboardHeaderView({
    el: $('#header'), // pre-rendered in DOM by Rails app
    model: userModel,
    currentUserUrl: userModel.viewUrl(),
    viewModel: new HeaderViewModel(),
    localStorage: new LocalStorage(),
    configModel
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
    userModel
  });
  supportView.render();

  // Avatar
  if ($('.js-avatarSelector').length > 0) {
    const avatarSelector = new AvatarSelector({
      el: $('.js-avatarSelector'),
      renderModel: new Backbone.Model({
        inputName: $('.js-fileAvatar').attr('name'),
        name: userModel.organization.get('name'),
        avatar_url: userModel.organization.get('avatar_url'),
        id: userModel.get('id')
      }),
      avatarAcceptedExtensions: window.avatar_valid_extensions,
      configModel
    });

    avatarSelector.render();
  }

  // Tooltips
  $('[data-title]').each(function (i, el) {
    new TipsyTooltipView({ // eslint-disable-line
      el: el,
      title: function () {
        return $(this).attr('data-title');
      }
    });
  });

  // Icon picker
  if ($('.js-iconPicker').length > 0) {
    this.icon_picker_view = new IconPickerView({
      el: $('.js-iconPicker'),
      orgId: userModel.organization.get('id'),
      configModel
    });
  }

  // Domain whitelisting
  if ($('.js-domains').length > 0) {
    require('jquery-ui');
    require('tagit');

    $('.js-domainsList').tagit({
      allowSpaces: false,
      singleField: true,
      singleFieldNode: $('.js-whitelist'),
      fieldName: $('.js-whitelist').attr('name'),
      tagLimit: 10,
      readOnly: false,
      onBlur: function () {
        $('.js-domains').removeClass('is-focus');

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
        $('.js-domains').addClass('is-focus');

        $('.js-placeholder').hide();
      },
      beforeTagAdded: function (ev, ui) {
        if (!DOMAIN_REGEXP.test(ui.tagLabel)) {
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
      el: $('.js-organizationUserForm'),
      model: organizationUser
    });
  }

  // User quota main view
  if (organizationUser) {
    this.organization_user_quota = new OrganizationUserQuota({
      el: $('.js-userQuota'),
      model: organizationUser
    });
  }

  // Organization users list
  if ($('.js-orgUsersList').length === 1) {
    this.organizationUsersView = new OrganizationUsersView({
      el: '.js-orgUsersList',
      organization,
      organizationUsers,
      userModel,
      configModel
    });

    this.organizationUsersView.render();
  }

  // User deletion
  const deleteAccountButton = $('.js-deleteAccount');
  if (deleteAccountButton.length > 0 && window.authenticity_token) {
    deleteAccountButton.click(function (ev) {
      if (ev) {
        ev.preventDefault();
      }

      modalsService.create(modalModel =>
        new DeleteOrganizationUser({
          modalModel,
          configModel,
          organizationUser,
          authenticityToken: window.authenticity_token
        })
      );
    });
  }

  // Organization deletion
  if ($('.js-deleteOrganization').length > 0 && window.authenticity_token) {
    $('.js-deleteOrganization').click(function (event) {
      if (event) event.preventDefault();

      modalsService.create(modalModel => (
        new DeleteOrganization({
          authenticityToken: window.authenticity_token,
          userModel,
          modalModel
        })
      ));
    });
  }

  // Notifications
  if ($('.js-OrganizationNotification').length > 0) {
    var authenticityToken = $('[name=authenticity_token][value]').get(0).value;

    this.organization_notification_view = new OrganizationNotificationView({
      el: '.js-OrganizationNotification',
      authenticityToken,
      userModel
    });

    this.organization_notification_view.render();
  }

  // User quotas
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

  // API keys
  const regenerateApiKeyHandler = function (event, scope, form_action) {
    if (event) event.preventDefault();

    const authenticity_token = $('[name=authenticity_token][value]').get(0).value;

    modalsService.create(modalModel => (
      new RegenerateKeysDialog({ type: 'api', scope, form_action, authenticity_token, modalModel })
    ));
  };

  $('.js-regenerateOrgUsersApiKey').bind('click', function (event) {
    const current_username = $(this).attr('data-current_username');

    regenerateApiKeyHandler(event, 'organization', `/u/${current_username}/organization/regenerate_api_keys`);
  });

  $('.js-regenerateOrgUserApiKey').bind('click', function (ev) {
    const username = $(this).attr('data-username');
    const current_username = $(this).attr('data-current_username');

    regenerateApiKeyHandler(ev, 'organization_user', `/u/${current_username}/organization/users/${username}/regenerate_api_key`);
  });

  // var $groups = $('.js-groups-content');
  // if ($groups) {
  //   if (!userModel.isOrgAdmin()) {
  //     window.location = userModel.viewUrl().accountProfile();
  //     return false;
  //   }

  //   var groups = new cdb.admin.OrganizationGroups([], {
  //     organization: userModel.organization
  //   });
  //   var router = new GroupsRouter({
  //     rootUrl: userModel.viewUrl().organization().groups(),
  //     flashMessageModel: flashMessageModel,
  //     groups: groups,
  //     user: userModel
  //   });

  //   var groupsMainView = new GroupsMainView({
  //     el: $groups,
  //     groups: groups,
  //     router: router,
  //     user: userModel
  //   });
  //   groupsMainView.render();
  //   window.groups = groupsMainView;

  //   router.enableAfterMainView();
  // }
});
