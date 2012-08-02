
  cdb.admin.keys = cdb.admin.keys || {};

  /**
   * Flash notification
   *
   *  It will hide the notification with a click in close button or after 3000ms
   */

  cdb.admin.keys.Notification = cdb.core.View.extend({

    events: {
      "click a" : "_hideNotification"
    },

    initialize: function() {
      _.bindAll(this, "_hideNotification");
      setTimeout(this._hideNotification,3000);
    },

    _hideNotification: function(ev) {
      if (ev)
        ev.preventDefault();

      this.$el.animate({
        height:0,
        paddingTop:0,
        paddingBottom:0,
        opacity:0
      },300);
    }
  });
