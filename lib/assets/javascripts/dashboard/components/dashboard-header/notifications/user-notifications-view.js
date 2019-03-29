const $ = require('jquery');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const UserNotificationsCollection = require('./notifications-collection');
const NotificationsDropdown = require('./dropdown-view');
const template = require('./templates/user-notifications.tpl');
const dropdownTemplate = require('./templates/dropdown.tpl');
const LocalStorage = require('../../../helpers/local-storage');
const checkAndBuildOpts = require('../../../../builder/helpers/required-opts');

const TEMPLATES = {
  tryTrial: require('./templates/try-trial.tpl'),
  limitsExceeded: require('./templates/limits-exceeded.tpl'),
  closeLimits: require('./templates/close-limits.tpl'),
  upgradedMessage: require('./templates/upgraded-message.tpl'),
  trialEndsSoon: require('./templates/trial-ends-soon.tpl')
};

const REQUIRED_OPTS = [
  'configModel',
  'user'
];

/**
 *  User notifactions view used to show alerts from the application
 *
 *  In storage we will check these attributes, managed by a collection:
 *
 *  try_trial       -> trial_end_at is null && user is not paid user
 *  limits_exceeded -> check table quota size
 *  close_limits    -> check table quota size < 80%
 *  upgraded        -> check upgraded_at less than one week
 *  trial_ends_soon -> trial_end_at is not null and it is close to be finished
 *  new_dashboard   -> new dashboard
 *  notification    -> check notification
 *
 */

module.exports = CoreView.extend({

  attributes: {
    href: '#/notifications'
  },

  tagName: 'a',
  className: 'UserNotifications',

  events: {
    'click': '_openNotifications'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.localStorage = new LocalStorage();
    this.collection = new UserNotificationsCollection({
      configModel: options.configModel
    });
    this.collection.reset(this._generateCollection(), {
      userId: this._user.get('id'),
      apiKey: this._user.get('api_key'),
      silent: true
    });

    this._initBinds();
  },

  render: function () {
    var notificationsCount = this.collection.filter(item => !item.get('opened')).length;

    this.$el.html(
      template({
        notificationsCount: notificationsCount
      })
    );

    this.$el.toggleClass('has--alerts', notificationsCount > 0);

    return this;
  },

  _initBinds: function () {
    this._user.bind('change', this._onUserChange, this);
    this.collection.bind('reset', this.render, this);
    this.collection.bind('remove', this.render, this);
    this.add_related_model(this._user);
    this.add_related_model(this.collection);
  },

  _onUserChange: function () {
    // When api is ready, we will make a valid fetch :)
    this.collection.reset(this._generateCollection(), {
      userId: this._user.get('id'),
      apiKey: this._user.get('api_key')
    });
    this.render();
  },

  // This method will check notifications and create a collection with them
  // Also it will check if those have been opened or not with Local Storage.
  _generateCollection: function () {
    var arr = [];
    var data = {}; // data
    var userUrl = this._user.viewUrl();
    var comHosted = this._configModel.get('cartodb_com_hosted');

    data.isInsideOrg = this._user.isInsideOrg();
    data.isOrgOwner = this._user.isOrgOwner();
    data.accountType = this._user.get('account_type').toLowerCase();
    data.remainingQuota = this._user.get('remaining_byte_quota');
    data.publicProfileUrl = userUrl.publicProfile();
    data.bytesQuota = this._user.get('quota_in_bytes');
    data.userType = 'regular';
    data.upgradeUrl = window.upgrade_url || '';
    data.upgradeContactEmail = this._user.upgradeContactEmail();
    data.trialEnd = this._user.get('trial_ends_at') && moment(this._user.get('trial_ends_at')).format('YYYY-MM-DD');
    data.userName = this._user.get('name') || this._user.get('username');

    // Get user type
    if (data.isInsideOrg && !data.isOrgOwner) {
      data.userType = 'org';
    } else if (data.isOrgOwner) {
      data.userType = 'admin';
    } else if (data.accountType === 'internal' || data.accountType === 'partner' || data.accountType === 'ambassador') {
      data.userType = 'internal';
    }

    // try_trial -> trial_end_at is null && user is not paid user
    if (!comHosted && !data.isInsideOrg && data.accountType === 'free' && this._user.get('table_count') > 0) {
      arr.push({
        iconFont: 'CDB-IconFont-gift',
        severity: 'NotificationsDropdown-itemIcon--positive',
        type: 'try_trial',
        msg: TEMPLATES.tryTrial(data),
        opened: this.localStorage.get('notification.try_trial')
      });
    } else {
      this.localStorage.remove('notification.try_trial');
    }

    // limits_exceeded -> check table quota size
    if (!comHosted && data.bytesQuota > 0 && data.remainingQuota <= 0) {
      arr.push({
        iconFont: 'CDB-IconFont-barometer',
        severity: 'NotificationsDropdown-itemIcon--negative',
        type: 'limits_exceeded',
        msg: TEMPLATES.limitsExceeded(data),
        opened: this.localStorage.get('notification.limits_exceeded')
      });
    } else {
      this.localStorage.remove('notification.limits_exceeded');
    }

    // close_limits -> check table quota size < 80%
    if (!comHosted && data.bytesQuota > 0 && ((data.remainingQuota * 100) / data.bytesQuota) < 20) {
      arr.push({
        iconFont: 'CDB-IconFont-barometer',
        severity: 'NotificationsDropdown-itemIcon--alert',
        type: 'close_limits',
        msg: TEMPLATES.closeLimits(data),
        opened: this.localStorage.get('notification.close_limits')
      });
    } else {
      this.localStorage.remove('notification.close_limits');
    }

    // upgraded -> check upgraded_at less than ... one week?
    if (!comHosted && this._user.get('show_upgraded_message')) {
      arr.push({
        iconFont: 'CDB-IconFont-heartFill',
        severity: 'NotificationsDropdown-itemIcon--positive',
        type: 'upgraded_message',
        msg: TEMPLATES.upgradedMessage(data),
        opened: this.localStorage.get('notification.upgraded_message')
      });
    } else {
      this.localStorage.remove('notification.upgraded_message');
    }

    // trial_ends_soon -> show_trial_reminder flag
    if (this._user.get('show_trial_reminder')) {
      arr.push({
        iconFont: 'CDB-IconFont-clock',
        severity: 'NotificationsDropdown-itemIcon--alert',
        type: 'trial_ends_soon',
        msg: TEMPLATES.trialEndsSoon(data),
        opened: this.localStorage.get('notification.trial_ends_soon')
      });
    } else {
      this.localStorage.remove('notification.trial_ends_soon');
    }

    const organizationNotifications = window.organization_notifications || this.options.organizationNotifications;

    if (organizationNotifications) {
      for (var n = 0; n < organizationNotifications.length; n++) {
        var notification = organizationNotifications[n];
        var icon = notification.icon ? ('CDB-IconFont-' + notification.icon) : 'CDB-IconFont-alert';

        arr.push({
          iconFont: icon,
          severity: 'NotificationsDropdown-itemIcon--alert',
          id: notification.id,
          msg: notification.html_body,
          read_at: notification.read_at,
          type: 'org_notification'
        });
      }
    }

    return arr;
  },

  _openNotifications: function (event) {
    if (event) this.killEvent(event);

    if (this.notification) {
      this.notification.hide();
      delete this.notification;
      return this;
    }

    var view = this.notification = new NotificationsDropdown({
      target: this.$el,
      collection: this.collection,
      horizontal_offset: 5,
      vertical_offset: -5,
      template: dropdownTemplate
    });

    $(view.options.target).unbind('click', view._handleClick);
    this._closeAnyOtherOpenDialogs();

    view.on('onDropdownHidden', () => this._onDropdownHidden(view));

    view.render();
    view.open();

    this.addView(view);
  },

  _onDropdownHidden: function (view) {
    // All notifications have been seen, opened -> true
    this.collection.each(notification => {
      const notificationType = notification.get('type');

      if (notificationType === 'org_notification') {
        notification.markAsRead();
      } else if (notificationType) {
        notification.set('opened', true);
        this.localStorage.set({
          [`notification.${notificationType}`]: true
        });
      }
    });

    // Clean collection because all notifications should
    // removed from the collection
    this.collection.reset();

    // Clean dropdown
    view.clean();
    // Remove it from subviews
    this.removeView(view);
    // Remove count
    this.$el.removeClass('has--alerts');
    // No local notification set
    delete this.notification;
  },

  _closeAnyOtherOpenDialogs: function () {
    // cdb.god.trigger("closeDialogs"); TODO: handle event
  }
});
