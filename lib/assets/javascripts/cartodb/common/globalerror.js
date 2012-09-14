
/**
 * Small moving label used to show errors in operations
 */

cdb.admin.GlobalError = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, 'hide');
  },

  // type can be: 'info', 'error'
  showError: function(errText, type, timeout) {
    this.$el.html("<p>" + errText + "</p>");
    timeout = timeout === undefined ? 2000: timeout;
    if(timeout > 0) {
      setTimeout(this.hide, timeout);
    }
    this.show();
  },

  show: function() {
    this.$el.find("p").stop().animate({marginTop: 0}, 500);
  },

  hide: function() {
    this.$el.find("p").stop().animate({marginTop: 40}, 500);
  }

});
