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
      if (this.$('div.field > div.field_error').length > 0) {
        this.$('div.field_error').each(this._setFieldError);
      }
    },

    _setFieldError: function(pos, el) {
      var $field = $(el).closest('div.field');
      $field.addClass('field_with_errors');

      $(el).tipsy({
        fade: true,
        gravity: "s",
        offset: 5,
        className: 'error_tooltip',
        title: function() {
          return $(this).text()
        }
      });
    }

  });

  cdb.init(function() {
    // Store JS errors
    var errors = new cdb.admin.ErrorStats();

    // Main view
    var login = new Login();
  });
});
