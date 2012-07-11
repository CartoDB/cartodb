/**
 *  entry point for api keys and oauth
 */


$(function() {

    var ApiKeys = cdb.core.View.extend({

      el: document.body,

      events: {
        'click a.copy'  : '_onClickCopy',
        'click'         : '_onClickOut'
      },

      initialize: function() {
        // Init views
        this._initViews();

        // Init copy to clipboard
        this._initCopy();
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

        // Tipsy?
        this.$el.find("a.tooltip").tipsy({
          gravity: 's',
          offset: 5
        });
      },

      _initCopy: function() {

        $("a.copy").zclip({
          path: "/js/vendor/ZeroClipboard.swf",
          copy: function(){
            return $(this).parent().find("p").text();
          }
        });

        // var self = this;
        // // Init ZeroClipboard
        // ZeroClipboard.setMoviePath( '/js/vendor/ZeroClipboard10.swf' );
        // this.clip = new ZeroClipboard.Client();
        // this.clip.addEventListener('load', function (client) {
        // cdb.log.info("Flash movie loaded and ready.");
        // });

        // this.clip.addEventListener('mouseDown', function (client) {
        // // update the text on mouse over
        //   self.clip.setText( "jamon" );
        // });

        // // this.clip.addEventListener('complete', function (client, text) {
        // // cdb.log.info("Copied text to clipboard: " + text );
        // // });
        // this.clip.setHandCursor( true );
        // this.clip.glue( 'copy' );
        
      },

      _onClickCopy: function(ev) {
        //ev.preventDefault();
        // cdb.log.info(this);
        // debugger;
        this.clip.setText( "pene" );
      },

      // Handle function for the god event
      _onClickOut: function(ev) {
        cdb.god.trigger("closeDialogs");
      }

    });


    cdb.init(function() {
      var keys = new ApiKeys();
      // expose to debug
      window.keys = keys;
    });
});
