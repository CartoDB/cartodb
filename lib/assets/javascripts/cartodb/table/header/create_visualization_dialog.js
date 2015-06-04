

  /**
   *  Dialog to name the new visualization
   */

  cdb.admin.CreateVizDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Save your map'),
      desc:   _t('A map is a mix of layers, styles and SQL. Your \
              maps are now accessible from your dashboard.'),
      button: _t('Create map'),
      error:  _t('The map name can\'t be blank'),
      creation: {
        error: {
          description:  _t('Something has failed in the process.'),
          about:        _t('Please, try again and if the problem persist contact us at <a href="mailto:support@cartodb.com">support@cartodb.com</a>')
        }
      }
    },

    events: cdb.core.View.extendEvents({
      "keydown input":    "_checkEnter"
    }),

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: this._TEXTS.desc,
        template_name: 'table/header/views/create_visualization_dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button green",
        ok_title: this._TEXTS.button,
        modal_type: "creation",
        modal_class: "create_visualization",
        width: 450,
        error_messages: {
          blank: this._TEXTS.error
        }
      });

      _.bindAll(this, "onCreationError", "_onCreationSuccess");

      this.state = 0;
      this.new_vis_name = "";
      this.old_vis_name = this.model.get("name");
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.template = cdb.templates.getTemplate('table/header/views/create_visualization_dialog');
      $content.append(this.template(this.options));

      // Focus in the input trick
      setTimeout(function() {
        $content.find("input").focus();
      },300);

      return $content;
    },

    _checkEnter: function(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13 && this.state == 0) {
        this.killEvent(e);
        this._ok();
      }
    },

    /**
     *  ESC button cancel the proccess if the app
     *  is not creating the new viz (state - 1)
     */
    _keydown: function(e) {
      if (e.keyCode === 27 && this.state != 1) {
        this._cancel();
      }
    },

    _isValidName: function() {
      var value = this.$content.find('input').val();
      return value.length > 0 && value != " ";
    },

    _showInputError: function() {
      this.$('div.info').addClass('active error');
    },

    _hideInputError: function() {
      this.$('div.info').removeClass('active');
    },

    /**
     *  Changes state, just animate the change and add to state 1 (yes, always it goes forward, never backward)
     */
    _changeState: function() {
      this.state++;

      // Next state
      this.$(".modal:eq(0)").animate({
        opacity: 0,
        marginTop: 0,
        height: 0,
        top: 0
      },function(){
        $(this).remove();
      });

      this.$(".modal:eq(1)")
        .css({
          opacity:0,
          display:"block",
          marginTop: "0px"
        })
        .animate({
          opacity: 1,
          marginTop: "100px"
        },600);
    },

    /**
     * Show the loader dialog
     */
    _showLoader: function() {
      // Add data
      var template = this.getTemplate("table/header/views/create_visualization_loader");
      this.$(".modal:eq(1)").find("div.creating_content").html(template());

      // Show next modal window
      this._changeState();

      // Create visualization
      this._createVisualization();
    },

    _createVisualization: function() {
      this.model.set('name', this.new_vis_name, { silent: true });
      this.model.changeToVisualization({
        success:  this._onCreationSuccess,
        error:    this.onCreationError
      });
    },

    _onCreationSuccess: function(vis) {
      this.ok && this.ok(vis);
      this.hide();
    },

    /**
     *  Show the error when duplication fails
     */
    onCreationError: function(e, msg, item_queue_id) {
      // Add data
      var template = cdb.templates.getTemplate("old_common/views/error_dialog_content")
        , opts = {
          number: "",
          description: msg || this._TEXTS.creation.error.description,
          about: this._TEXTS.creation.error.about,
          item_queue_id: item_queue_id || ''
        };

      this.$("div.error_content").html(template(opts));
      this.model.set('name', this.old_vis_name, { silent: true });

      // Show error and hide importation window
      this._changeState();
    },

    /**
     * On click button
     */
    _ok: function(ev) {
      this.killEvent(ev);

      var value = this.$content.find('input').val();

      if (this._isValidName(value)) {
        this._hideInputError();
        this.new_vis_name = value;
        this._showLoader();
      } else {
        this._showInputError();
      }
    },

    /**
     *  Remove any custom binding previously applied
     */
    clean: function() {
      this.$("input.text").unbind("keydown");
      cdb.admin.BaseDialog.prototype.clean.call(this);
    }

  });