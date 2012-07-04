/**
 *  Login point for new session
 */

$(function() {

  var Login = cdb.core.View.extend({
    el: document.body,

    initialize: function() {
      this._initViews();
    },

    _initViews: function() {

      // Fill user input and focus in the password
      if (this.$el.find("#email").val()=="" && window.location.host.split(".").length>1) {
        this.$el.find("#email").val(window.location.host.split(".")[0]);
        this.$el.find("#password").focus();
      }

      // Placeholders
      this.$el.find("div.field").each(function(i,ele){
        var placeholder = new cdb.admin.Placeholder({ el: $(ele) });
      });

      // Errors
      this.$el.find("div.error").each(function(i,ele){
        var input_error = new cdb.admin.InputError({ el: $(ele) });
      });
    }
  });

  var login = new Login();
});
