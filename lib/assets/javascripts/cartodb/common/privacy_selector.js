/**
* Table privacy selector
*
* It creates a popup to change the privacy of a table.
* If the user has a limitation to make private the tables
* you can use the limitation param (by default-false)
*
* Usage example:
*
*  var privacy = new cdb.admin.PrivacySelector({
*    model: model,
*    limitation: false
*  });
*
*/

cdb.admin.PrivacySelector = cdb.core.View.extend({

  _TEXTS: {
    make_private:   _t('Private (only paid users)')
  },

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

    if (!this.model.isVisualization()
      // Get affected visualizations if model is a table
      && this.model.get('table')
      && !this.model.get('table').dependent_visualizations
      && !this.model.get('table').non_dependent_visualizations) {
      this._getAffectedVisualizations();
    } else if (!this.model.get('related_tables') || this.model.get('related_tables').length == 0) {
      // Get related tables if model is a derived visualization
      this.model.getRelatedTables();
    }

    // Dropdown template, if user has a limitation and is not a visualization
    // show the non payer selector, if not, privacy selector
    this.options.limitation && !this.model.isVisualization() ?
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
    $el.html(this.template_base({
      upgrade_url:  this.options.upgrade_url,
      name:         'table'
    }));

    // Add selected
    var selected = this.model.get("privacy").toLowerCase();
    $el.find("a." + selected).addClass("selected");

    // Can user make private tables?
    if (this.options.limitation) {
      $el.find("a.private")
      .html("<span class='radio'></span>" + this._TEXTS.make_private)
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

  // TODO -> removed and change it for a collection
  _getAffectedVisualizations: function() {
    var self = this;
    var _id = this.model.get('table').id;
    var table = new cdb.admin.CartoDBTableMetadata({ id: _id });
    table.fetch({
      success: function(m) {
        self.affected_visualizations = _.union(m.get('dependent_visualizations'), m.get('non_dependent_visualizations'));
      },
      error: function() {
        cdb.log.info("Imposible to get " + _id + " table data");
        self.affected_visualizations = [];
      }
    });
  },

  /**
  * Show the selector
  */
  show: function(target,offset) {
    // Positionate
    var pos = (offset == 'offset') ? $(target).offset() : $(target).position()
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

    this.isOpen = true;

  },

  /**
  * Hide the selector
  */
  hide: function(clean) {
    var self = this;

    // Animate
    this.$el.animate({
      marginTop: this.options.direction == 'up' ? "-10px": "10px",
      opacity:0
    }, 200, function(){
      self.isOpen = false;
      $(this).remove();
      if (clean) self.clean();
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

    // Save if it is a new privacy
    if (new_status != this.model.get("privacy").toUpperCase()) {

      if (new_status == "PRIVATE") {
        // To private
        this.model.save({ privacy: "PRIVATE" });
        this.clean();
        this.hide();
        return false;
      } else {
        // To public
        if (this.model.isVisualization() && this._anyPrivateTable()) {
          this.hide();
          return false;
        }
      }

      this.model.save({ privacy: new_status });
      this.hide(true);
    }
  },

  _anyPrivateTable: function() {
    if (!this.model.related_tables) {
      return false;
    } else {
      return this.model.related_tables.filter(function(table) {
        return table.get("privacy").toLowerCase() == "private"
      }).length > 0;
    }
  },

  /**
  *  Clean function
  */
  clean: function() {
    $(document).unbind('keydown', this._keydown);
    cdb.core.View.prototype.clean.call(this);
  }
});
