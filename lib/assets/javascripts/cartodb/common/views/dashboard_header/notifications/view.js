var cdb = require('cartodb.js');
var $ = require('jquery');
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
    this.collection = new UserNotificationsCollection(this._generateCollection());

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
    this.add_related_model(this.user);
    this.add_related_model(this.collection);
  },

  _onUserChange: function() {
    // When api is ready, we will make a valid fetch :)
    this.collection.reset(this._generateCollection());
    this.render();
  },

  // This method will check notifications and create a collection with them
  // Also it will check if those have been opened or not with Local Storage.
  _generateCollection: function() {
    var arr = [];
    var d = {}; // data
    var userUrl = this.user.viewUrl();

    d.isInsideOrg = this.user.isInsideOrg();
    d.isOrgAdmin = this.user.isOrgAdmin();
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
    if (d.isInsideOrg && !d.isOrgAdmin) {
      d.userType = 'org';
    } else if (d.isOrgAdmin) {
      d.userType = 'admin';
    } else if (d.accountType === "internal" || d.accountType === "partner" || d.accountType === "ambassador") {
      d.userType = 'internal'
    }

    // try_trial -> trial_end_at is null && user is not paid user
    if (!d.isInsideOrg && d.accountType === 'free' && this.user.get("table_count") > 0) {
      arr.push({
        iconFont: 'iconFont-CartoFante',
        severity: 'NotificationsList-itemIcon--positive',
        type:   'try_trial',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/try_trial')(d),
        opened: this.localStorage.get('notification.try_trial')
      })
    } else {
      this.localStorage.remove('notification.try_trial')
    }

    // limits_exceeded -> check table quota size
    if (d.remainingQuota <= 0) {
      arr.push({
        iconFont: 'iconFont-CloseLimits',
        severity: 'NotificationsList-itemIcon--negative',
        type:   'limits_exceeded',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/limits_exceeded')(d),
        opened: this.localStorage.get('notification.limits_exceeded')
      });
    } else {
      this.localStorage.remove('notification.limits_exceeded')
    }

    // close_limits -> check table quota size < 80%
    if ((( d.remainingQuota * 100 ) / d.bytesQuota ) < 20) {
      arr.push({
        iconFont: 'iconFont-CloseLimits',
        severity: 'NotificationsList-itemIcon--alert',
        type:   'close_limits',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/close_limits')(d),
        opened: this.localStorage.get('notification.close_limits')
      });
    } else {
      this.localStorage.remove('notification.close_limits')
    }

    // upgraded -> check upgraded_at less than ... one week?
    if (this.user.get("show_upgraded_message")) {
      arr.push({
        iconFont: 'iconFont-Heart--fill',
        severity: 'NotificationsList-itemIcon--positive',
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
        iconFont: 'iconFont-Clock',
        severity: 'NotificationsList-itemIcon--alert',
        type:   'trial_ends_soon',
        msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/trial_ends_soon')(d),
        opened: this.localStorage.get('notification.trial_ends_soon')
      });
    } else {
      this.localStorage.remove('notification.trial_ends_soon')
    }

    // new public dashboard
    arr.push({
      iconFont: 'iconFont-Dribbble',
      severity: 'NotificationsList-itemIcon--positive',
      type:   'new_public_dashboard',
      msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/new_public_dashboard')(d),
      opened: this.localStorage.get('notification.new_public_dashboard')
    });

    // new_dashboard
    arr.push({
      iconFont: 'iconFont-DefaultUser',
      severity: 'NotificationsList-itemIcon--main',
      type:   'new_dashboard',
      msg:    cdb.templates.getTemplate('common/views/dashboard_header/notifications/templates/new_dashboard')(d),
      opened: this.localStorage.get('notification.new_dashboard')
    });

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
      if (i.get('type')) {
        i.set('opened', true);
        var d = {};
        d['notification.' + i.get('type')] = true;
        self.localStorage.set(d);
      }
    });

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
