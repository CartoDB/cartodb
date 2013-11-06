
  /**
   *  Sync settings dialog
   *
   *  - User can change sync interval or destroy
   *    the synchronization.
   *  - It needs a table model.
   *
   *  new cdb.admin.SyncSettings({ table: table_model })
   */

  cdb.admin.SyncSettings = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title: _t("Syncronization options"),
      ok:    _t("Save settings")
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        'click .dialog-tab > a': '_optionClicked'
      });
    },

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        template_name: 'table/views/sync_settings_dialog',
        clean_on_hide: true,
        ok_button_classes: "button grey",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_class: "sync_settings",
        modal_type: "creation",
        width: 600
      });

      this.table = this.options.table;

      // Create a model to know the options clicked
      this.model = new cdb.core.Model({
        option: 'interval',
        interval: this.table.synchronization.get('interval')
      });

      this.model.bind('change:option', this._onOptionChange, this);

      // Super!
      this.constructor.__super__.initialize.apply(this);
    },


    //////////////
    //  RENDER  //
    //////////////

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/header/views/sync_settings_dialog_content');
      $content.append(this.temp_content());

      this._initCombo($content);
      this.$('.sync_url').append(
        '<span title="' + this.table.synchronization.get('url') + '">' +
        this.table.synchronization.get('url') +
        '</span>'
      );

      return $content;
    },


    /////////////////////////
    //  SYNC COMBO OPTION  //
    /////////////////////////

    _initCombo: function($el) {
      // Interval selector
      var period = new cdb.forms.IntervalCombo({
        el:           $el.find('.interval-combo'),
        model:        this.model,
        property:     'interval',
        width:        '108px',
        remove_never: true
      });

      period.render();

      this.addView(period);
    },


    //////////////////
    //  UI ACTIONS  //
    //////////////////

    // If other option has changed
    _onOptionChange: function(m) {
      // Setup dialog tabs
      this.$('.dialog-tab > a').removeClass('selected');
      var option = this.model.get('option');
      this.$('.dialog-tab.' + option + ' > a').addClass('selected');

      // Setup dialog panes
      this.$('.dialog-tab').removeClass('active');
      this.$('.dialog-tab.' + option).addClass('active');
    },

    _optionClicked: function(e) {
      if (e) e.preventDefault();

      // Get new option and set it in the model
      // (Taking it from the link)
      var href = $(e.target).attr('href');
      var option = href && href.replace('#/', '');

      if (option && this.model.get('option') != option) {
        this.model.set('option', option);
      }
    },

  

    ////////////////////////
    //  DIALOG FUNCTIONS  //
    ////////////////////////

    // Click over the OK button
    ok: function(e) {
      if (e) e.preventDefault();

      if (this.model.get('option') == "interval") {
        this.table.synchronization.save({
          interval: this.model.get('interval')
        });
      } else {
        this.table.synchronization.destroy();
      }

    }

  });