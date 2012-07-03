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

      // Placeholders
      this.$el.find("div.field").each(function(i,ele){
        var placeholder = new cdb.admin.Placeholder({ el: $(ele) });
      })

      this.$el.find("div.field_with_errors").each(function(i,ele){
        var input_error = new cdb.admin.InputError({ el: $(ele) });
      })

      // Errors?

      // Error common
      /*var settings = this.settings = new cdb.ui.common.Settings({
        template_base: $('#settings_template').html(),
        speed: 300
      });
      this.$el.append(this.settings.render().el);

      setTimeout(function(){
        settings.open();  
      },3);
      */
    }
  });

  var login = new Login();
});
