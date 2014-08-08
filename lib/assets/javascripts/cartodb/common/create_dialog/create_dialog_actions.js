
  /**
   *  Actions to be performed in the create dialog
   *  managed thanks to the states file (create_dialog_states)
   *
   */

  cdb.common.CreateDialog.Actions = cdb.core.View.extend({

    initialize: function() {
      this.tabs = this.options.tabs;
      this.panes = this.options.panes;
      this.$dialog = this.options.$dialog;
      this.states = cdb.common.CreateDialog.states;

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

      // TABS -> Only when state has changed
      if (actions['tabs'] && c.changes.state) {
        var tabs_actions = actions['tabs'];
        var enabled = tabs_actions.enabled;
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

            $(el)
              .css('z-index', 1)
              .find('> a')
              .removeClass('selected')
              .addClass( isErrorTab ? 'show' : 'hide' )
              .find('span')
              .text( isErrorTab && error_code ? ( text + ' (' + error_code + ')' ) : text );
          });

          // Add selected class
          setTimeout(function() {
            self.$dialog.find('.create-tab a.error').addClass('selected')
          },300);
        }
      }

      // CONTENT
      if (actions['content'] && c.changes.state) {
        var enabled = actions['content'].enabled;
        var content_height = this.$dialog.find('.create-content').height();
        var $el = this.$dialog.find('.create-content');


        // Set height
        $el
          .height( enabled ? 'auto' : content_height )
          [ enabled ? 'removeClass' : 'addClass' ]('fixed')
      }
      

      // PANES
      if (actions['content'] && c.changes.state) {
        var enabled = actions['content'].enabled;
        var $el = this.$dialog.find('.create-panes');
        var height = $el.height();

        var d = {
          opacity:    enabled ? 1 : 0,
          marginTop:  enabled ? 0 : -height
        }
        
        $el.animate(d,800);

        // Show item_queue_id if error state is enabled
        if (state === "error") {
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
          .animate(d,800)
          [ enabled ? 'slideDown' : 'slideUp' ]()
        
        if (progress_actions.text) {
          $el.find('p').text(progress_actions.text[ this.model.get('option') ]);  
        }

        // Bar?
        if (this.model.get('upload').progress) {
          $el.find('.progress-total').width(this.model.get('upload').progress + '%')
        } else {
          $el.find('.progress-total').width('100%')
        }
        
      }

      // ABORT BUTTON?
      if (actions['abort'] && ( c.changes.state || c.changes.upload )) {
        var enabled = actions['upgrade'].enabled;
        this.$dialog.find('a.stop')[ enabled ? 'show' : 'hide' ]();
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

      // OK BUTTON
      if (actions['ok'] && ( c.changes.state || c.changes.upload || c.changes.option )) {
        var text = actions['ok'].text.default;
        if (actions['ok'].text[option]) text = actions['ok'].text[option];

        var classes = actions['ok'].classes;
        var parent_class = actions['ok'].parent;
        var valid_states = ['idle', 'reset', 'abort', 'added', 'importing', 'uploading', 'unpackaging', 'complete', 'error'];
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
        var isEnabled = this.model.get('upload').valid && _.contains(valid_states, state);
        $el[ isEnabled ? 'removeClass' : 'addClass' ]('disabled');
      }
    }

  })