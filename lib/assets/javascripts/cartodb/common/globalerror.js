
/**
 * Small moving label used to show errors in operations
 */

cdb.admin.GlobalError = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, 'hide');
  },

  // type can be: 'info', 'error'
  showError: function(errText, type, timeout) {
    timeout = timeout === undefined ? 2000: timeout;
    type || (type = 'info')

    this.$el.html("<p class='" + type + "'>" + errText + "</p>");

    if(this._timer) {
      clearTimeout(this._timer);
    }
    if(timeout > 0) {
      this._timer = setTimeout(this.hide, timeout);
    }
    this.show();
  },

  show: function() {
    this.$el.find("p").stop().animate({marginTop: 0}, 500);
  },

  hide: function() {
    this.$el.find("p").stop().animate({marginTop: 40}, 500);
    this._timer = 0;
  }

});
