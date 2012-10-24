
  /**
   * Table privacy selector
   *
   * It creates a popup to change the privacy of a table.
   * If the user has a limitation to make private the tables
   * you can use the limitation param (by default-false)
   *
   * Usage example:
   *
      var privacy = new cdb.admin.PrivacySelector({
        model: model,
        limitation: false
      });
   *
   * TODO: inherit from dialog
   */

  cdb.admin.PrivacySelector = cdb.core.View.extend({

    tagName: 'div',
    className: 'privacy_selector',

    events: {
      'click ul > li > a': '_optionClicked'
    },

    default_options: {
      direction: 'up',
      limitation: false
    },


    initialize: function() {
      _.bindAll(this, "_optionClicked", "_keydown");

      // Extend options
      _.defaults(this.options, this.default_options);

      this.options.upgrade_url || (this.options.upgrade_url = '');

      // Dropdown template
      this.options.limitation?
        this.template_base = cdb.templates.getTemplate("common/views/privacy_selector_non_payer") :
        this.template_base = cdb.templates.getTemplate("common/views/privacy_selector");

      // Bind options
      $(document).bind('keydown', this._keydown);

      // Set visibility
      this.isOpen = false;
    },


    render: function() {
      // Render
      var $el = this.$el;
      $el.html(this.template_base({upgrade_url: this.options.upgrade_url}));

      // Add selected
      var selected = this.model.get("privacy").toLowerCase();
      $el.find("a." + selected).addClass("selected");

      // Can user make private tables?
      if (this.options.limitation) {
        $el.find("a.private")
          .html("<span class='radio'></span>Private (only paid users)")
          .addClass("disabled");
      }

      this.$el.addClass(this.options.direction);

      return this;
    },


    /**
     * Close keydown when ESC is clicked
     */
    _keydown: function(e) {
      if (e.keyCode === 27) {
        this.hide();
      }
    },


    /**
     * Show the selector
     */
    show: function(target,offset) {

      // Positionate
      var pos = (offset) ? $(target).offset() : $(target).position()
        , t_width = $(target).outerWidth()
        , t_height = $(target).outerHeight()
        , el_width = this.$el.outerWidth()
        , el_height = this.$el.outerHeight()


      var top = pos.top - el_height + "px";

      if (this.options.direction === 'down') {
        top = pos.top + t_height + 10 + "px";
      }

      // Set css previous animation
      this.$el.css({
        opacity:0,
        display:"block",
        top: top,
        left: pos.left + (t_width/2) - (el_width/2) + "px",
        marginTop: this.options.direction == 'up' ? "10px": "-10px"
      });

      // Animate
      this.$el.animate({
        marginTop: "0",
        opacity:1
      },200);
    },


    /**
     * Hide the selector
     */
    hide: function(target) {
      // Animate
      this.$el.animate({
        marginTop: this.options.direction == 'up' ? "-10px": "10px",
        opacity:0
      },200, function(){
        $(this).remove();
      });
    },


    /**
     * Click event to any option
     */
    _optionClicked: function(ev) {
      ev.preventDefault();

      // New privacy status
      var new_status;

      if ($(ev.target).hasClass("public")) {
        new_status = "PUBLIC";
      } else {
        if (this.options.limitation) {
          this.hide();
          return false;
        }
        new_status = "PRIVATE";
      }

      this.hide();

      // Save if it is a new privacy
      if (new_status != this.model.get("privacy").toUpperCase()) {
        this.model.set({privacy: new_status});
        this.model.save();
        this.model.trigger('updated')
      }
    }

  });
