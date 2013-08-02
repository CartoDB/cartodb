/**
* manages all the wizards which render carto
*/
cdb.admin.mod.CartoCSSWizard = cdb.core.View.extend({

  buttonClass: 'wizards_mod',
  type: 'tool',

  events: {
    'click  .wizard_arrows a':  '_onArrowClick'
  },

  initialize: function() {
    var self = this;
    self.active = false;
    this.cartoStylesGeneration = new cdb.admin.CartoStyles({
      table: this.options.table
    });

    this.model.bind('change:wizard_properties', this._updateForms, this);
    this.add_related_model(this.model);
    this.add_related_model(this.options.table);

    this.position = 0; // Navigation bar
    this.tabs = new cdb.admin.Tabs();
    this.panels = new cdb.ui.common.TabPane({
      activateOnClick: true
    });
    this.addView(this.tabs);
    this.addView(this.panels);
    this.tabs.linkToPanel(this.panels);

    this.tabs.bind('click', this._applyStyle, this);
    this.tabs.bind('click', function() {
      cdb.god.trigger('mixpanel','Choose a wizard', {type: this.panels.getActivePane().type});
    }, this);

    this.model.bind('change:query', function() {
      this.cartoStylesGeneration.regenerate();
    }, this);

    this.options.table.bind('change geolocated', function() {
      this.renderWizards();
      this.panels.active('polygon');
      this.enableTabs();
      this._updateForms();
    }, this);

    // when a panel is selected a signal is raised
    // showing which modules are available for that
    // kind of visualization
    this.panels.bind('tabEnabled',this._enableModules, this);
  },

  _enableModules: function(name, v) {
    this.trigger('modules', v.MODULES);
    this._resetNavigation();
  },

  _updateForms: function() {
    var self = this;
    if (self.model.get('wizard_properties')) {
      var wizard = self.model.get('wizard_properties');
      var type = wizard.type;
      var p = self.panels.getPane(type);
      if(p) {
        p.setCarpropertiesSilent(wizard.properties);
        self.panels.active(type);
      }
    }
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
    list_item_w = 92,
    $right      = this.$('a.right'),
    $left       = this.$('a.left');

    $ul.parent().removeClass("left_shadow");

    var $selectedLi = $ul.find("a.selected").parent();
    var selectedIndex = $selectedLi.index();
    var sizeIndex = $ul.find("li").size();

    // If there is a wizard selected, situated in the position 2 or greater (0,1,2,3,...)
    // it moves the list to that position
    if (selectedIndex >= 3) {
      $ul.parent().addClass("left_shadow");
      this.position = selectedIndex - 2;

      var move = this.position * list_item_w; // LI width, it is not possible to get width if the component doesnt exist or it is not displayed
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

    if (this.animation) return false;

    var
    $ul           = this.$("ul.vis_options")
    , gap         = 3
    , list_size   = $ul.find("li").size()
    , move        = $ul.find("li").outerWidth() || 100
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
    var self = this;
    this.cartoStylesGeneration.unbind(null, null, this);

    self.active = true;

    // do the same with layer style, if user changes the style too fast
    // lots of tiles are requested to the tile server
    var changeLayerStyle = function(st, sql) {

      var wprop = self.cartoStylesGeneration.toJSON();
      delete wprop.table;
      var attrs = {
        wizard_properties: wprop
      };
      if(sql) {
        attrs.query_wrapper =  sql.replace('__wrapped', '(<%= sql %>)');//"with __wrapped as (<%= sql %>) " + sql;
        attrs.query_generated = true;
      } else {
        attrs.query_wrapper = null;
        attrs.query_generated = false;
        /*if(self.model.get('query_generated')) {
          }*/
      }
      self.model.set(attrs, {silent: true} );
      self.model.save({tile_style: st});
    };

    // this is the sole entry point where the cartocss is changed.
    // wizards only should change cartoStylesGeneration model
    this.cartoStylesGeneration.bind('change:style change:sql', function() {
      if(!self.options.table.data().isEmpty()) {
        changeLayerStyle(
          self.cartoStylesGeneration.get('style'),
          self.cartoStylesGeneration.get('sql')
        );
      }
    }, this);
  },

  deactivated: function() {
    this.active = false;
    this.cartoStylesGeneration.unbind(null, null, this);
    // when the wizard is deactivated the style change
    // should be tracked
    this.cartoStylesGeneration.bind('change:style', function() {
      var tile_style = this.model.get('tile_style');
      if(tile_style !== this.cartoStylesGeneration.get('style')) {
        this.model.save({ tile_style: this.cartoStylesGeneration.get('style') });
      }
    }, this);

    this.cartoStylesGeneration.bind('change:metadata', function() {
      var wprop = this.cartoStylesGeneration.toJSON();
      delete wprop.table;
      this.model.set('wizard_properties', wprop);
    }, this);
  },

  _applyStyle: function() {
    //TODO: check if the active wizard is ok
    var pane = this.panels.getActivePane();
    if(pane.isValid()) {
      pane.cartoProperties.trigger('change');
    }
  },

  // depending on the geometry type some wizards should be disabled
  enableTabs: function() {
    var _enableMap = {
      'point': ['polygon', 'bubble', 'density', 'color', 'intensity'],
      'line':['polygon', 'choropleth', 'color', 'bubble'],
      'polygon': ['polygon', 'choropleth', 'color', 'bubble']
    };

    this.renderTabs();
    this._setThumbnails();
    this.tabs.disableAll();

    // enable the wizard suitable for the current geom types
    var geomTypes = this.options.table.geomColumnTypes();
    for(var g in geomTypes) {
      var type = geomTypes[g];
      var toEnable = _enableMap[type];
      for(var e in toEnable) {
        this.tabs.enable(toEnable[e]);
      }
    }
    // if we are in a query there are no geom types
    // but if the wizard is show is because we have geoemtry
    if(geomTypes.length === 0) {
      this.tabs.enable('polygon');
    }

    // we remove the disabled ones and recalculate the arrows
    this.tabs.removeDisabled();
    this._resetNavigation();
  },

  renderTabs: function() {
    this.tabs.$el.html(
      this.getTemplate('table/menu_modules/views/carto_wizard_tabs')()
    );
  },

  renderWizards: function() {

    var that = this;

    this.panels.unbind('tabEnabled',this._enableModules, this);

    this.panels.removeTabs();
    // Remove tabs
    /*_(this.options.wizards).each(function(wizard, tab_name) {
      that.panels.removeTab(tab_name);
    });*/

    // Enter the Wizards
    _(this.options.wizards).each(function(wizard, tab_name){

      that.panels.addTab(tab_name, new cdb.admin.mod[wizard]({
        table: that.options.table,
        model: that.cartoStylesGeneration,
        style: that.model.get('style'),
        map: that.options.map
      }).render());

    });
    this.panels.bind('tabEnabled',this._enableModules, this);

  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
    this.tabs.setElement(this.$('ul.vis_options'));
    this.panels.setElement(this.$('.forms'));
    this.renderTabs();

    // apply tipsy for nav - a
    this.$('ul.vis_options li a').each(function(i,ele) {
      $(ele).tipsy({ gravity: 's', fade: true });
    });

    // render the wizards
    this.renderWizards();

    this.panels.active('polygon');
    this.enableTabs();
    this._updateForms();

    // this should be after panels are initialized so when the table
    // is changed the changes are propagated first to the wizards
    // check if the selected wizard is actually applied
    // if not, apply it
    this.options.table.bind('change:schema', function() {
      var pane = this.panels.getActivePane();
      if(pane.type != this.cartoStylesGeneration.get('type')) {
        this._applyStyle();
      }
    }, this);

    return this;
  }

});

/**
* Simple Wizard
* take this as base for other wizards
*/

cdb.admin.mod.SimpleWizard = cdb.core.View.extend({

  // modules available when this wizard is enabled
  MODULES: ['infowindow'],

  initialize: function() {
    var self = this;
    this.cartoProperties = new cdb.core.Model();
    this.type = 'polygon';
    this.geomForm = cdb.admin.forms.simple_form[this.options.table.geomColumnTypes()[0] || 'point'];
    this.setFormProperties();
    this.add_related_model(this.model);
    this.add_related_model(this.options.table);

    //TODO: change this when table support more than one geom type
    this.form = new cdb.forms.Form({
      form_data: this.options.form || this.geomForm,
      model: this.cartoProperties
    });
    this.addView(this.form);

    this._bindChanges();

    this.options.table.bind('change:schema', function() {
      this.setFormProperties();
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
    this.cartoProperties.bind('change', function() {
      var sql = self._generateSQL()
      self.model.set({
        type: self.type,
        properties: _.clone(self.cartoProperties.attributes),
        sql: sql
      }, { silent: true });
      self.model.change({ changes: {'properties': ''} });
    }, this);

    this.cartoProperties.bind('change:text-name', this.showTextFields, this);
    this.cartoProperties.bind('change:marker-width', function(m, width) {
      this.cartoProperties.set('text-dy', -width);

    }, this);
  },

  showTextFields: function() {

    var self = this;
    var v = self.form.getFieldByName('Label Font');

    if (!v) return;

    var vhalo   = self.form.getFieldByName('Label Halo');
    var voffset = self.form.getFieldByName('Label Offset');
    var field   = self.form.getFieldByName('Label Text');

    if (self.cartoProperties.get('text-name') === 'None') {
      v && v.hide();
      vhalo && vhalo.hide();
      voffset && voffset.hide();
      field.removeClass("border");
    } else {
      v && v.show();
      vhalo && vhalo.show();
      voffset && voffset.show();
      field.addClass("border");
    }

  },

  _unbindChanges: function() {
    this.cartoProperties.unbind(null, null, this);
  },

  // changes properties WITHOUT updating the model, only refresh the
  // UI
  setCarpropertiesSilent: function(p) {
    this._unbindChanges();
    this.cartoProperties.set(p);
    this.showTextFields();
    this._bindChanges();
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

  renderError: function(msg) {
    var $wrapper =    $("<div>").addClass("wrapper")
    , $no_columns = $("<div>").addClass("no_content").html(msg)

    $wrapper.append($no_columns);
    this.$el.html($wrapper);
  },

  setFormProperties: function() {
    var field = this._searchFieldByName('Label Text');
    if(field) {
      var b = field.form['text-name'].extra = ['None'].concat(this.options.table.columnNamesByType('string').concat(this.options.table.columnNamesByType('number')));
      field.form['text-name'].value = 'None';
    }
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
  }

});
