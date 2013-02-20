/**
 *  Entry point for api keys and oauth
 */


$(function() {

    var ApiKeys = cdb.core.View.extend({

      el: document.body,

      events: {
        'click'               : '_onClickOut',
        'click a.regenerate'  : '_showDialog'
      },

      initialize: function() {
        // Init views
        this._initViews();

        // Init copy to clipboard
        this._initCopy();
      },

      _initViews: function() {

        // User menu
        var user_menu = this.user_menu = new cdb.admin.DropdownMenu({
          target: $('a.account'),
          host: config.account_host,
          username: username,
          template_base: "common/views/settings_item"
        });

        cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
        this.$el.append(this.user_menu.render().el);

        // Manage notification
        var notification = this.notification = new cdb.admin.keys.Notification({
          el: this.$('li.flash')
        });

        // Tipsy tooltip ready!
        this.$el.find(".zclip")
          .tipsy({
            gravity: 's',
            live: true,
            fade: true,
            title: function() {
              return "Copy this"
            }
          });
      },

      _initCopy: function() {
        $("a.copy").zclip({
          path: "/assets/ZeroClipboard.swf",
          copy: function(){
            return $(this).parent().find("input").val();
          }
        });
      },

      _showDialog: function(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var dialog = new cdb.admin.keys.RegenerateDialog({
          clean_on_hide: true,
          title: type == "oauth" ? "You are about to regenerate your OAuth key and secret" : "You are about to regenerate your Api key",
          content: type == "oauth" ?
            "You will have to update all OAuth keys in apps where you are using CartoDB. Are you sure?"
            : "You will need to update all deployed apps with a new API key. Are you sure you want to continue?",
          ok_title: type == "oauth" ? "Regenerate Oauth and secret keys" : "Regenerate Api key",
          ok_button_classes: "button grey",
          cancel_button_classes: "underline margin15",
          modal_type: "confirmation",
          send_form_id: "regenerate_api_key",
          width: 600
        });

        this.$el.append(dialog.render().el);
        dialog.open();
      },

      // Handle function for the god event
      _onClickOut: function(ev) {
        cdb.god.trigger("closeDialogs");
      }

    });


    cdb.init(function() {
      cdb.templates.namespace = 'cartodb/';
      var keys = new ApiKeys();
      // expose to debug
      window.keys = keys;
    });
});
