/**
 *  entry point for api keys and oauth
 */


$(function() {

    var ApiKeys = cdb.core.View.extend({

      el: document.body,

      events: {
        'click':                      'onClickOut'
      },

      initialize: function() {
        this._initViews();
        // Tipsy?

        // Copy?

      },

      _initViews: function() {
        // User menu
        var user_menu = this.user_menu = new cdb.admin.UserMenu({
          target: 'a.account',
          model: {username: username},
          template_base: "dashboard/views/settings_item"
        })
        .on("optionClicked",function(ev){})
        cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
        this.$el.append(this.user_menu.render().el);
      },

      // Handle function for the god event
      onClickOut: function(ev) {
        cdb.god.trigger("closeDialogs");
      }

    });


    cdb.init(function() {
      var keys = new ApiKeys();
      // expose to debug
      window.keys = keys;
    });
});
