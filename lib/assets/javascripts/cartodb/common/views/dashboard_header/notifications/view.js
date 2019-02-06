var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var UserNotificationsCollection = require('./collection');
var NotificationsDropdown = require('./dropdown_view');


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

module.exports = cdb.core.View.extend({

  attributes: {
    href: '#/notifications'
  },

  tagName: 'a',
  className: 'UserNotifications',

  events: {
    'click': '_openNotifications'
  },

  initialize: function() {
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/user_notifications');
    this.collection = new UserNotificationsCollection();
    this.collection.reset(this._generateCollection(), {
      userId: this.user.get('id'),
      apiKey: this.user.get('api_key'),
      silent: true
    });

    this._initBinds();
  },

  render: function() {
    var notificationsCount = this.collection.filter(function(item) { return !item.get('opened') }).length;

    this.$el.html(
      this.template({
        notificationsCount: notificationsCount
      })
    );

    // has alerts?
    this.$el.toggleClass('has--alerts', notificationsCount > 0);

    return this;
  },

  _initBinds: function() {
    // Make it live
    this.user.bind('change', this._onUserChange, this);
    this.collection.bind('reset', this.render, this);
    this.collection.bind('remove', this.render, this);
    this.add_related_model(this.user);
    this.add_related_model(this.collection);
  },

  _onUserChange: function() {
    // When api is ready, we will make a valid fetch :)
    this.collection.reset(this._generateCollection(), {
      userId: this.user.get('id'),
      apiKey: this.user.get('api_key')
    });
    this.render();
  },

  // This method will check notifications and create a collection with them
  // Also it will check if those have been opened or not with Local Storage.
  _generateCollection: function() {
    var arr = [];
    var d = {}; // data
    var userUrl = this.user.viewUrl();
    var comHosted = cdb.config.get('cartodb_com_hosted');

    d.isInsideOrg = this.user.isInsideOrg();
    d.isOrgOwner = this.user.isOrgOwner();
    d.accountType = this.user.get("account_type").toLowerCase();
    d.remainingQuota = this.user.get('remaining_byte_quota');
    d.publicProfileUrl = userUrl.publicProfile();
    d.bytesQuota = this.user.get('quota_in_bytes');
    d.userType = 'regular';
    d.upgradeUrl = window.upgrade_url || '';
    d.upgradeContactEmail = this.user.upgradeContactEmail();
    d.trialEnd = this.user.get('trial_ends_at') && moment(this.user.get('trial_ends_at')).format("YYYY-MM-DD");
    d.userName = this.user.get('name') || this.user.get('username');


    // Get user type
    if (d.isInsideOrg && !d.isOrgOwner) {
      d.userType = 'org';
    } else if (d.isOrgOwner) {
      d.userType = 'admin';
    } else if (d.accountType === "internal" || d.accountType === "partner" || d.accountType === "ambassador") {
      d.userType = 'internal'
    }

    // try_trial -> trial_end_at is null && user is not paid user
    if (!comHosted && !d.isInsideOrg && d.accountType === 'free' && this.user.get("table_count") > 0) {
      arr.push({
        iconFont: 'CDB-IconFont-gift',
        severity: 'NotificationsDropdown-itemIcon--positive',
        type:   'try_trial',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/try_trial')(d),
        opened: this.localStorage.get('notification.try_trial')
      })
    } else {
      this.localStorage.remove('notification.try_trial')
    }

    // limits_exceeded -> check table quota size
    if (!comHosted && d.bytesQuota > 0 && d.remainingQuota <= 0) {
      arr.push({
        iconFont: 'CDB-IconFont-barometer',
        severity: 'NotificationsDropdown-itemIcon--negative',
        type:   'limits_exceeded',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/limits_exceeded')(d),
        opened: this.localStorage.get('notification.limits_exceeded')
      });
    } else {
      this.localStorage.remove('notification.limits_exceeded')
    }

    // close_limits -> check table quota size < 80%
    if (!comHosted && d.bytesQuota > 0 && (( d.remainingQuota * 100 ) / d.bytesQuota ) < 20) {
      arr.push({
        iconFont: 'CDB-IconFont-barometer',
        severity: 'NotificationsDropdown-itemIcon--alert',
        type:   'close_limits',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/close_limits')(d),
        opened: this.localStorage.get('notification.close_limits')
      });
    } else {
      this.localStorage.remove('notification.close_limits')
    }

    // upgraded -> check upgraded_at less than ... one week?
    if (!comHosted && this.user.get("show_upgraded_message")) {
      arr.push({
        iconFont: 'CDB-IconFont-heartFill',
        severity: 'NotificationsDropdown-itemIcon--positive',
        type:   'upgraded_message',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/upgraded_message')(d),
        opened: this.localStorage.get('notification.upgraded_message')
      });
    } else {
      this.localStorage.remove('notification.upgraded_message')
    }

    // trial_ends_soon -> show_trial_reminder flag
    if (this.user.get("show_trial_reminder")) {
      arr.push({
        iconFont: 'CDB-IconFont-clock',
        severity: 'NotificationsDropdown-itemIcon--alert',
        type:   'trial_ends_soon',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/trial_ends_soon')(d),
        opened: this.localStorage.get('notification.trial_ends_soon')
      });
    } else {
      this.localStorage.remove('notification.trial_ends_soon')
    }

    if (window.organization_notifications) {
      for (var n = 0; n < window.organization_notifications.length; n++) {
        var notification = window.organization_notifications[n];
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

  _openNotifications: function(e) {
    if (e) this.killEvent(e);

    if (this.notification) {
      this.notification.hide();
      delete this.notification;
      return this;
    }

    var view = this.notification = new NotificationsDropdown({
      target:             this.$el,
      collection:         this.collection,
      horizontal_offset:  5,
      vertical_offset:    -5,
      template_base:      'common/views/dashboard_header/notifications/templates/dropdown'
    });

    $(view.options.target).unbind('click', view._handleClick);
    this._closeAnyOtherOpenDialogs();

    view.on('onDropdownHidden', function() {
      this._onDropdownHidden(view);
    }, this);

    view.render();
    view.open();

    this.addView(view);
  },

  _onDropdownHidden: function(view) {
    var self = this;

    // All notifications have been seen, opened -> true
    this.collection.each(function(i){
      if (i.get('type') === 'org_notification') {
        i.markAsRead();
      } else if (i.get('type')) {
        i.set('opened', true);
        var d = {};
        d['notification.' + i.get('type')] = true;
        self.localStorage.set(d);
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

  _closeAnyOtherOpenDialogs: function() {
    cdb.god.trigger("closeDialogs");
  }

});
