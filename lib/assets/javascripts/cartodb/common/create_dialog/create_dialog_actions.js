
  /**
   *  Actions to be performed in the create dialog
   *  managed thanks to the states file (create_dialog_states)
   *
   */

  cdb.common.CreateDialog.Actions = cdb.core.View.extend({

    // Main (usually ok green button) button will be
    // enabled in this states
    _VALID_STATES_OK: [
      'idle',
      'reset',
      'abort',
      'added',
      'importing',
      'uploading',
      'unpacking',
      'complete',
      'error'
    ],

    initialize: function() {
      // Enabled tabs for current user
      this.enabled_tabs = this.options.enabled_tabs;
      // Tabs pane
      this.tabs = this.options.tabs;
      // Panes
      this.panes = this.options.panes;
      // Dialog element
      this.$dialog = this.options.$dialog;
      // States
      this.states = this.options.states;

      this._initBinds();
    },

    _initBinds: function() {
      this.model.bind('change', this._setState, this);
    },

    _setState: function(m, c) {
      var state = this.model.get('state');
      var actions = this.states[state];
      var option = this.model.get('option');

      if (!actions) {
        cdb.log.info('State ' + state + ' not defined');
        return false;
      }

      // TITLE -> Only when state has changed
      if (actions['title'] && ( c.changes.state || c.changes.option) ) {
        var enabled = actions['title'].enabled['default'];
        
        if (actions['title'].enabled[option] !== undefined) {
          enabled = actions['title'].enabled[option];
        }

        this.$dialog.find('h3')
          [ enabled ? 'removeClass' : 'addClass' ]('disabled');
      }

      // NAVIGATION -> Only when state has changed
      if (actions['navigation'] && ( c.changes.state || c.changes.option) ) {
        var enabled = actions['navigation'].enabled;

        this.$dialog.find('.create-tabs-navigation')
          [ enabled ? 'removeClass' : 'addClass' ]('disabled');
      }

      // TABS -> Only when state has changed
      if (actions['tabs'] && c.changes.state) {
        var tabs_actions = actions['tabs'];
        var enabled = tabs_actions.enabled;
        var navigation = this.model.get('navigation');
        var self = this;
        
        // If it is not error state
        if (state !== "error") {
          _.each(this.panes.tabs, function(val, key) {
            if (self.panes.activeTab !== key && key !== "error") {
              self.$dialog.find('.create-tab a.' + key)[ enabled ? 'removeClass' : 'addClass' ]('disabled')  
            }
          });
        } else {
          // Oh no, error state!
          self.$dialog.find('.create-tab').each(function(i,el) {
            var isErrorTab = $(el).hasClass('error');
            var text = $(el).text();
            var error_code = self.model.get('error').error_code;            
            var title = self.model.get('error').title;

            text =  ( title ? title : text ) + ( isErrorTab && error_code ? ( ' (' + error_code + ')' ) : '' );

            $(el)
              .css('z-index', 1)
              .find('> a')
              .removeClass('selected')
              .addClass( isErrorTab ? 'show' : 'hide' )
              .find('span')
              .text(text)

            // Move error tab to positionate in the correct navigation list (popular or other)
            if (isErrorTab) {
              $(el).css({
                right:  navigation === "other" ? '-25%' : 'auto',
                left:   navigation !== "other" ? '-25%' : 'auto'
              });
            }

          });

          // Add selected class
          setTimeout(function() {
            self.$dialog.find('.create-tab.error').fadeIn(250);

            var classes = actions['ok'].classes;
            var $el = self.$dialog.find('a.ok');

            $el
            .text(text)
            .removeClass()
            .addClass(classes);

            self.$dialog.find('.create-tab a.error').addClass('selected')
          }, 300);
        }
      }

      // CONTENT
      var content_min_height = 48;
      var content_height = this.$dialog.find('.create-content').height();
      var panes_height = this.$dialog.find('.create-panes').height();

      if (actions['content'] && ( c.changes.state || c.changes.option )) {
        var enabled = actions['content'].enabled;
        var $el = this.$dialog.find('.create-content');

        // Set height for create-content
        $el[ enabled ? 'removeClass' : 'addClass' ]('fixed');

        if (enabled) {
          $el.height('auto');
        } else {
          $el.animate({ height: content_min_height }, 250);
        }

        // Set padding for 'start from scratch' state
        var valid_states = ['idle', 'reset', 'abort', 'added', 'error'];
        var compress = ( option === "scratch" && _.contains(valid_states, state) ? true : false );
        $el[ compress ? 'addClass' : 'removeClass' ]('compressed')
      }

      // PANES
      if (actions['content'] && c.changes.state) {
        var enabled = actions['content'].enabled;
        var $el = this.$dialog.find('.create-panes');

        // Set height for animation
        $el.height( enabled ? 'auto' : panes_height );

        var d = {
          opacity:    enabled ? 1 : 0,
          marginTop:  enabled ? 0 : - (panes_height + ( 30 /* space between content + progress bar */ ))
        }
        
        $el.animate(d, 150);

        // Show item_queue_id if error state is enabled
        if (state === "error") {
          this.$dialog.find('.create-tab').animate({ height: "110px" }, 150);
          this.$dialog.find('.create-tab.error span').fadeIn(200);
          $el.find('div.item_queue_id').show();
        }

      }

      // PROGRESS
      if (actions['progress'] && ( c.changes.state || c.changes.upload )) {
        var progress_actions = actions['progress'];
        var enabled = progress_actions.enabled;
        var $el = this.$dialog.find('.create-progress');
        var d = { opacity: enabled ? 1 : 0 }

        $el
          .animate(d, 150)
          [ enabled ? 'show' : 'hide' ]()

          if (state === "creating" || state === "uploading") {

            this.$dialog.find(".info.sync").fadeOut(100);
            this.$dialog.find(".no-sync").fadeOut(100);

            this.$dialog.find(".create-content").animate({ height: 50 }, 150);
            this.$dialog.find('.create-tab span').fadeOut(250);
            this.$dialog.find('.create-tab').animate({ height: 80 }, 150);
          }

        // Text
        if (progress_actions.text) {
          var text = progress_actions.text.default;

          // Text for that option?
          if (progress_actions.text[ option ] !== undefined) {
            text = progress_actions.text[ option ];
          }
          
          // Different state for the same option
          if (option && _.isObject(progress_actions.text) && progress_actions.text[ option ]) {
            var type = this.model.get('upload').type;
            if (progress_actions.text[ this.model.get('option') ][ this.model.get('upload').type ]) {
              text = progress_actions.text[ this.model.get('option') ][ this.model.get('upload').type ];
            }
          }

          $el.find('p').text(text);
        }

        // Bar?
        if (this.model.get('upload').progress) {
          $el.find('.progress-total').width(this.model.get('upload').progress + '%')
        } else {
          $el.find('.progress-total').width('100%')
        }
        
      }

      // SUCCESS STATE
      if (actions['success'] && ( c.changes.state || c.changes.upload )) {
        var enabled = actions['success'].enabled.default;

        if (actions['success'].enabled[option]) enabled = actions['success'].enabled[option];

        this.$dialog.find('.create-success')[ enabled ? 'show' : 'hide' ]();
        this.$dialog.find('.import-pane')[ enabled ? 'hide' : 'show' ]();
        this.$dialog.find('.ok.button').removeClass("disabled");
      }

      // ABORT BUTTON?
      if (actions['abort'] && ( c.changes.state || c.changes.upload )) {
        var enabled = actions['abort'].enabled;
        this.$dialog.find('span.progress-stop')[ enabled ? 'show' : 'hide' ]();
      }

      // UPGRADE TEXT
      if (actions['upgrade'] && ( c.changes.state || c.changes.upload )) {
        var enabled = actions['upgrade'].enabled;
        this.$dialog.find('.upgrade_message')[ enabled ? 'show' : 'hide' ]();
      }

      // ESC BUTTON
      if (actions['close'] && ( c.changes.state || c.changes.upload )) {
        var enabled = actions['close'].enabled;
        this.$dialog.find('a.close')[ enabled ? 'show' : 'hide' ]();
      }

      // FOOTER BLOCK -> If option appears in enabled tabs, footer block will
      // be visible
      if (c.changes.option) {
        var enabled = _.contains(this.enabled_tabs, option);
        var $el = this.$dialog.find('div.foot');
        if (enabled) {
          $el.removeAttr('style');
        } else {
          $el.hide()
        }
      }

      // OK BUTTON
      if (actions['ok'] && ( c.changes.state || c.changes.upload || c.changes.option )) {
        var text = actions['ok'].text.default;
        if (actions['ok'].text[option]) text = actions['ok'].text[option];

        var classes = actions['ok'].classes;
        var parent_class = actions['ok'].parent;
        var $el = this.$dialog.find('a.ok');

        $el
          .text(text)
          .removeClass()
          .addClass(classes);

        // Parent to move button
        this.$dialog.find('.foot')
          .removeClass('middle to_right')
          .addClass(parent_class)

        // Enabled or disabled?
        var isEnabled = ( this.model.get('upload').valid && _.contains(this._VALID_STATES_OK, state) ) || ( this.model.get("state") == "complete" );
        $el[ isEnabled ? 'removeClass' : 'addClass' ]('disabled');
      }
    }

  });
