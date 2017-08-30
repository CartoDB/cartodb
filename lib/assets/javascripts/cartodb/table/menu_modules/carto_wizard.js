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
    , left        = parseInt($ul.css("left").replace("px","")) || 0
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

/**
* Simple Wizard
* take this as base for other wizards
*/

cdb.admin.mod.SimpleWizard = cdb.core.View.extend({

  // modules available when this wizard is enabled
  MODULES: ['infowindow', 'legends'],


  initialize: function() {
    var self = this;
    this.cartoProperties = this.options.wizard_properties;
    this.type = this.type || 'polygon';

    this.add_related_model(this.cartoProperties);
    this.add_related_model(this.options.table);

    var proxyModel = new Backbone.Model();
    proxyModel.set(this.cartoProperties.attributes);

    var signalDisabled = false;
    this.cartoProperties.bind('change', function() {
      signalDisabled = true;
      proxyModel.set(this.cartoProperties.attributes);
      signalDisabled = false;
    }, this);

    proxyModel.bind('change', function() {
      if(proxyModel.changed["marker-fill"]){
        proxyModel.unset("marker-file");
        this.cartoProperties.unset("marker-file");
      }
      if (signalDisabled) return;
      this.cartoProperties.enableGeneration();
      this.cartoProperties.set(proxyModel.attributes);
    }, this);

    //TODO: change this when table support more than one geom type
    this.form = new cdb.forms.Form({
      form_data: this.cartoProperties.formData(this.type),
      model: proxyModel
    });
    this.addView(this.form);

    this._bindChanges();

    this.cartoProperties.bind('change:form', function() {
      this.form.updateForm(this.cartoProperties.formData(this.type));
      this.render();
    }, this);
  },

  _generateSQL: function() {
    return null;
  },

  isValid: function() {
    return true;
  },

  _bindChanges: function() {
    var self = this;

    this.cartoProperties.bind('change:text-name', this.showTextFields, this);
    this.cartoProperties.bind('change:text-allow-overlap', function(m, overlap) {
      // Overlap value is being returned as String, not as Boolean, seems like
      // custom selector transforms values to String always :_(
      this.cartoProperties.set({
        'text-placement-type': overlap === "true" ? 'dummy' : 'simple',
        'text-label-position-tolerance': overlap === "true" ? 0 : 10
      });
    }, this);
    this.cartoProperties.bind('change:marker-width', function(m, width) {
      if (this.cartoProperties.has('text-dy')) {
        this.cartoProperties.set('text-dy', -width);
      }
    }, this);

  },

  showTextFields: function() {

    var self = this;
    var v = self.form.getFieldByName('Label Font');

    if (!v) return;

    var vhalo       = self.form.getFieldByName('Label Halo');
    var voffset     = self.form.getFieldByName('Label Offset');
    var field       = self.form.getFieldByName('Label Text');
    var voverlap    = self.form.getFieldByName('Label Overlap');
    var vplacement  = self.form.getFieldByName('Label Placement');
    var tn = self.cartoProperties.get('text-name');
    if (!tn || tn === 'None') {
      v && v.hide();
      vhalo && vhalo.hide();
      voffset && voffset.hide();
      voverlap && voverlap.hide();
      vplacement && vplacement.hide();
      field.removeClass("border");
    } else {
      v && v.show();
      vhalo && vhalo.show();
      voffset && voffset.show();
      voverlap && voverlap.show();
      vplacement && vplacement.show();
      field.addClass("border");
    }

  },

  _unbindChanges: function() {
    this.cartoProperties.unbind(null, null, this);
  },

  render: function() {

    var $wrapper = $("<div>").addClass("wrapper")
    , $content = $("<div>").addClass("content");

    $content.append(this.form.render().el);
    $wrapper.append($content);

    // Remove old custom scroll
    if (this.custom_scroll) {
      this.removeView(this.custom_scroll);
      this.custom_scroll.clean();
    }

    // Add new custom scroll
    this.custom_scroll = new cdb.admin.CustomScrolls({
      el:     $wrapper,
      parent: $wrapper.parent()
    });

    this.addView(this.custom_scroll);

    this.$el.html($wrapper);
    this.showTextFields();

    return this;
  },

  // The safeHtml is rendered as-is, so called is responsibile for sanitizing content before calling this method
  renderError: function(safeHtml) {
    var $wrapper =    $("<div>").addClass("wrapper")
    , $no_columns = $("<div>").addClass("no_content").html(safeHtml);

    $wrapper.append($no_columns);
    this.$el.html($wrapper);
  },

  /**
  * search inside the source fields for the field by name.
  * Returns the field
  */
  _searchFieldByName: function(name) {
    return _.find(this.options.form || this.geomForm, function(f) {
      return f.name === name;
    });
  },

  /**
  *  Get number columns without cartodb_id
  */
  _getNumberColumns: function() {
    return _.filter(this.options.table.columnNamesByType('number'), function(c) {
      return c != "cartodb_id"
    });
  },

  _getColumns: function() {
    return _.filter(this.options.table.columnNames(), function(c) {
      return c != "cartodb_id";
    });
  },

  /**
  *  Get number, boolean and string columns without system columns
  */
  _getColorColumns: function() {
    var self = this;
    var columns = [];
    var sc = this.options.table.get('schema')
    _.each(sc, function(c) {
      if (!_.contains(self.options.table.hiddenColumns, c[0]) && c[1] != "date" && c[1] != "geometry") {
        columns.push(c[0])
      }
    });
    return columns;
  },



});
