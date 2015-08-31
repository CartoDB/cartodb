/**
* manages all the wizards which render carto
*/
cdb.admin.mod.CartoCSSWizard = cdb.admin.Module.extend({

  buttonClass: 'wizards_mod',
  type: 'tool',

  events: {
    'click  .wizard_arrows a':  '_onArrowClick'
  },

  initialize: function() {
    var self = this;
    self.active = false;
    this.currentWizard = null;

    this.wizard_properties = this.model.wizard_properties;

    this.add_related_model(this.model);
    this.add_related_model(this.options.table);
    this.add_related_model(this.wizard_properties);

    this.position = 0; // Navigation bar
    this.tabs = new cdb.admin.Tabs();
    this.addView(this.tabs);

    this.tabs.preventDefault = true;
    this.tabs.bind('click', this._onWizardClick, this);
    this.tabs.bind('click', function() {
      // TODO: remove mixpanel
      cdb.god.trigger('mixpanel','Choose a wizard', { type: this.wizard_properties.get('type') });

      // Event tracking "Applied a wizard"
      cdb.god.trigger('metrics', 'wizard', {
        email: window.user_data.email
      });
    }, this);


    this.wizard_properties.bind('change:type', function() {
      this.enableTabs();
    }, this);
    this.wizard_properties.bind('change:type', this.renderWizards, this);

    // change tabs
    this.options.table.bind('change:geometry_types', function() {
      this.enableTabs();
      this.renderWizards();
    }, this);
  },

  _onWizardClick: function(type) {
    this.trigger('activeWizard', type, this);
    this.wizard_properties.active(type, {
      zoom: this.options.map.get('zoom')
    });
  },

  _enableModules: function(v) {
    this.trigger('modules', v.MODULES);
  },

  _onArrowClick: function(ev) {
    this.killEvent(ev);
    var $target = $(ev.target);

    if ($target.hasClass("disabled")) return false;

    var side = $target.attr('href').replace("#","");
    this._moveNavigation(side);
  },

  _resetNavigation: function() {

    var self  = this;
    var $ul   = this.$("ul.vis_options");

    var
    gap         = 3,
    list_size   = $ul.find("li").size(),
    list_item_w = 92 + Math.ceil(30/list_size);
    $right      = this.$('a.right'),
    $left       = this.$('a.left');

    $ul.parent().removeClass("left_shadow");

    var $selectedLi = $ul.find("a.selected").parent();
    var selectedIndex = $selectedLi.index();
    var sizeIndex = $ul.find("li").size();

    // TODO: check this behaviour and slider-selector component...
    // If there is a wizard selected, situated in the position 2 or greater (0,1,2,3,...)
    // it moves the list to that position
    if (selectedIndex >= 3) {
      $ul.parent().addClass("left_shadow");
      this.position = selectedIndex - 2;

      // LI width, it is not possible to get width if the component doesnt exist or it is not displayed
      var move = this.position * list_item_w;
      // If selected item is the last in the list, add more space at the end
      if ((list_size - 1) <= selectedIndex) move += 18;
      $ul.animate({ left: -move + 'px' }, { queue: false, duration: 250 });

      $left.removeClass("disabled");
      $right[((sizeIndex - 1) == selectedIndex) ? "addClass" : "removeClass" ]("disabled");
    } else {
      // Move the list to the beginning
      $ul.animate({ left: "0" }, { queue: false, duration: 250 });

      // First position, left arrow disabled
      $left.addClass("disabled");
      // More than 3 wizards, right arrow active
      $right[(list_size > 3) ? "removeClass" : "addClass"]("disabled");

      this.position  = 0;
    }

    this.animation = false;
  },

  _moveNavigation: function(side) {

    //TODO: extract this to a component
    if (this.animation) return false;

    var
    $ul           = this.$("ul.vis_options")
    , gap         = 3
    , list_size   = $ul.find("li").size()
    //, move        = $ul.find("li").outerWidth() || 100
    , move = 100 + Math.ceil(40/list_size)
    , block_width = $ul.parent().outerWidth() || 380
    , list_width  = list_size * (move + 5)
    , left        = parseInt($ul.css("left").replace("px","")) || 0
    , $right      = this.$('a.right')
    , $left       = this.$('a.left')
    , self        = this;

    // if the list is smaller than the block, we disable the buttons and return
    if (block_width  > list_width ) {

      $left.addClass("disabled");
      $right.addClass("disabled");

      return false
    }

    // Check move
    if (side == "left") {

      if (-left < move) {
        move = -left;
      }

      this.position--;

      if (this.position == 0) $ul.parent().removeClass("left_shadow");

    } else {

      if (block_width - left >= list_width) {
        return false;
      }

      if (list_width + left < move) {
        move = list_width + left;
      }

      this.position++;
      $ul.parent().addClass("left_shadow");

    }

    // Check arrows
    this.position + gap >= list_size ?  $right.addClass("disabled") : $right.removeClass("disabled");

    this.position == 0 ? $left.addClass("disabled") : $left.removeClass("disabled");

    // Go side
    this.animation = true;

    var operator = '-=';

    if (side == "left") { operator = '+='; }

    $ul.animate({ left: operator + move + 'px' }, 200, function() { self.animation = false; });

  },

  _setThumbnails: function() {
    var classes = this.options.table.geomColumnTypes().join("-");
    this.$('.vis_options li a').each(function(i,el){
      $(el).addClass(classes);
    });
  },

  activated: function() {
    this.active = true;
  },

  deactivated: function() {
    this.active = false;
  },

  // depending on the geometry type some wizards should be disabled
  enableTabs: function() {

    this.renderTabs();
    this.tabs.disableAll();

    var toEnable = this.wizard_properties.getEnabledWizards();

    // enable the wizard suitable for the current geom types
    for(var e in toEnable) {
        this.tabs.enable(toEnable[e]);
    }

    // we remove the disabled ones and recalculate the arrows
    this._setThumbnails();
    this.tabs.removeDisabled();
    this.tabs.activate(this.wizard_properties.get('type'));
    this._resetNavigation();
  },

  renderTabs: function() {
    this.tabs.$el.html(
      this.getTemplate('table/menu_modules/views/carto_wizard_tabs')()
    );
  },

  renderWizards: function() {
    var t = this.wizard_properties.get('type');
    if (!t) return;

    cdb.core.Profiler.metric('cartowizard:renderWizards').inc();


    // Enter the Wizards
    var el = this.$('.forms');
    var wizard = this.options.wizards[t];

    if (this.currentWizard) {
      this.currentWizard.clean();
    }

    el.html('');
    if(!wizard) {
      return;
    }

    var w = new cdb.admin.mod[wizard]({
      table: this.options.table,
      layer: this.options.model,
      wizard_properties: this.wizard_properties,
      style: this.model.get('style'),
      map: this.options.map
    });

    el.append(w.render().el);
    this.currentWizard = w;
    this.addView(this.currentWizard);

    // when a panel is selected a signal is raised
    // showing which modules are available for that
    // kind of visualization
    this._enableModules(this.currentWizard);

  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
    this.tabs.setElement(this.$('ul.vis_options'));
    this.enableTabs();

    // render the wizards
    this.renderWizards();

    return this;
  }

});
