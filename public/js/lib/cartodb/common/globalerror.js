
/**
 * small moving label used to show errors in operations
 */

cdb.admin.GlobalError = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, 'hide');
  },

  showError: function(errText, type, timeout) {
    this.$el.html(errText);
    timeout = timeout === undefined ? 2000: timeout;
    if(timeout > 0) {
      setTimeout(this.hide, timeout);
    }
    this.show();
  },

  show: function() {
    this.$el.stop().animate({top: 150 - 30, opacity: 1}, 500);
  },

  hide: function() {
    this.$el.stop().animate({top: 150, opacity: 0}, 500);
  }

});
