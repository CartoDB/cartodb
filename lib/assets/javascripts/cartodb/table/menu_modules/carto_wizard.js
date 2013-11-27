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
    this.cartoStylesGeneration = new cdb.admin.CartoStyles(_.extend({},
      this.model.get('wizard_properties'), {
      table: this.options.table
      })
    );

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

    this.tabs.bind('click', this._onWizardClick, this);
    this.tabs.bind('click', function() {
      cdb.god.trigger('mixpanel','Choose a wizard', {type: this.panels.getActivePane().type});
    }, this);


    this.model.bind('change:query', function() {
      this.cartoStylesGeneration.regenerate();
    }, this);

    //
    // when style changes we can change the wizard properties guessing
    // them from the cartocss
    //
    this.model.bind('change:tile_style', function() {
      if (this.model.get('tile_style_custom')) {
        var style = this.model.get('tile_style');
        var wizard = this.panels.getActivePane();
        if (wizard.propertiesFromStyle) {
          var modified = wizard.propertiesFromStyle(style);
          wizard.setCarpropertiesSilent(modified);
        }
      }
    }, this);


    this.options.table.bind('change geolocated', function() {
      // allow only to change type when length > 0
      var geoTypeChanged = this.options.table.geometryTypeChanged() && this.options.table.data().length > 0;
      var prev = this.options.table.previous('geometry_types');
      if (geoTypeChanged && prev && prev.length) {
        var wizard = this.model.get('wizard_properties');
        wizard && (wizard.properties = {});
        wizard && (wizard.type = 'polygon');
      }
      this.renderWizards();
      this.panels.active('polygon');
      this.enableTabs();
      this._updateForms();
    // when geometry types change we should reset the wizard properties
    // because properties from polygons and markers could collide
      if (geoTypeChanged) {
        this._applyStyle();
      }
    }, this);

    // when a panel is selected a signal is raised
    // showing which modules are available for that
    // kind of visualization
    this.panels.bind('tabEnabled',this._enableModules, this);
  },

  _onWizardClick: function() {
    this.model.set({
      'tile_style_custom': false
    }, { silent: true });
    this._applyStyle();
  },

  _enableModules: function(name, v) {
    this.trigger('modules', v.MODULES);
    this._resetNavigation();
  },

  _getCurrentPane: function() {
    var p = null;
    var prop = this.model.get('wizard_properties');
    if (prop) {
      p = this.panels.getPane(prop.type);
    }
    return p;
  },

  _updateForms: function() {
    var p = this._getCurrentPane();
    if(p) {
      var wizard = this.model.get('wizard_properties');
      var type = wizard.type;

      // Prevent select color wizard and select category in that case
      if (type === "color") type = 'category';

      p.setCarpropertiesSilent(wizard.properties);
      this.panels.active(type);
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
    var changeLayerStyle = function(st, sql, layerType, extraProps) {

      layerType = layerType || 'CartoDB';
      var forceApply = self.cartoStylesGeneration.get('forceApply');

      // reset force apply
      self.cartoStylesGeneration.unset('forceApply', { silent: true });

      if (forceApply) {
        self.model.set({
          'tile_style_custom': false
        }, { silent: true });
      }

      // if the style is custom don't let wizard change it
      if (self.model.get('tile_style_custom')) {
        return;
      }

      var wprop = self.cartoStylesGeneration.toJSON();
      delete wprop.table;
      var attrs = {
        wizard_properties: wprop,
      };
      if(sql) {
        attrs.query_wrapper =  sql.replace('__wrapped', '(<%= sql %>)');//"with __wrapped as (<%= sql %>) " + sql;
        attrs.query_generated = true;
      } else {
        attrs.query_wrapper = null;
        attrs.query_generated = false;
      }
      self.model.save(
        _.extend(attrs, {
          tile_style: st,
          type: layerType
        }, extraProps), {
          no_override: true
        }
      );
    };

    // this is the sole entry point where the cartocss is changed.
    // wizards only should change cartoStylesGeneration model
    this.cartoStylesGeneration.bind('change:style change:sql', function() {
      var st = self.cartoStylesGeneration.get('style');
      if(st) {
        var extra = _.pick(
          self.cartoStylesGeneration.get('properties'),
          self.cartoStylesGeneration.get('layer_props')
        );

        changeLayerStyle(
          st,
          self.cartoStylesGeneration.get('sql'),
          self.cartoStylesGeneration.get('layer_type'),
          extra
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
      // if the style is custom don't let wizard change it
      if (this.model.get('tile_style_custom')) {
        return;
      }

      if (this.model.get('forceApply')) {
        cdb.log.error("forceApply can't be true");
      }

      var tile_style = this.model.get('tile_style');
      if(tile_style !== this.cartoStylesGeneration.get('style')) {
        this.model.save({ tile_style: this.cartoStylesGeneration.get('style') }, { no_override: true });
      }
    }, this);

    //
    // when the quartiles are changed legends should be updated.
    // Legends listen for changes in wizard_properties so update
    // it
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
      pane.applyWizard();
    }
    pane.render();
  },

  // depending on the geometry type some wizards should be disabled
  enableTabs: function() {
    var _enableMap = {
      'point': ['polygon', 'choropleth', 'bubble', 'density', 'category', 'intensity', 'torque'],
      'line':['polygon', 'choropleth', 'category', 'bubble'],
      'polygon': ['polygon', 'choropleth', 'category', 'bubble']
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
        layer: that.options.model,
        model: that.cartoStylesGeneration,
        style: that.model.get('style'),
        map: that.options.map
      }).render());

    });
    this.panels.bind('tabEnabled',this._enableModules, this);
    // this should be after panels are initialized so when the table
    // is changed the changes are propagated first to the wizards
    // check if the selected wizard is actually applied
    // if not, apply it
    this.options.table.unbind('change:schema', this._updateStyle, this);
    this.options.table.bind('change:schema', this._updateStyle, this);

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


    return this;
  },

  _updateStyle: function() {
    // change only if there was schema before
    // if there wasn't means that is the first load
    if(this.options.table.previous('schema') && this.options.table.isGeoreferenced()) {
      var pane = this.panels.getActivePane();
      if(pane.type === this.cartoStylesGeneration.get('type')) {
        var self = this;

        function updateWizardAttrs() {
          var wprop = this.cartoStylesGeneration.toJSON();
          delete wprop.table;
          var attrs = {
            wizard_properties: wprop
          };
          this.model.save(attrs, { silence: true, no_override: true });
          this.cartoStylesGeneration.unbind('generated', updateWizardAttrs, this);
        }

        this.cartoStylesGeneration.bind('generated', updateWizardAttrs, this);
        this.cartoStylesGeneration.set({
          'properties': _.clone(pane.cartoProperties.attributes)
        }, { silent: true });
        this._applyStyle();
      }
    }
  }

});

/**
* Simple Wizard
* take this as base for other wizards
*/

cdb.admin.mod.SimpleWizard = cdb.core.View.extend({

  // modules available when this wizard is enabled
  MODULES: ['infowindow', 'legends'],

  // Set description for carto properties when they change
  // (Statistical purposes)
  _EVENTS: {
    'polygon-pattern-file': 'Pattern file chosen for polygon-fill',
    'marker-file':          'Marker file chosen for marker-fill'
  },

  initialize: function() {
    var self = this;
    this.cartoProperties = new cdb.core.Model();
    this.type = 'polygon';
    this.geomForm = cdb.admin.forms.get('simple_form')[this.options.table.geomColumnTypes()[0] || 'point'];
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

  // return if this wizard is currently enabled
  isEnabled: function() {
    return this.model.get('type') === this.type;
  },

  _generateSQL: function() {
    return null;
  },

  isValid: function() {
    return true;
  },

  /**
   * generates the wizard properties based on the current
   * state
   */
  applyWizard: function(opts) {
    var self = this;
    var sql = self._generateSQL();
    self.model.clear({ silent: true });
    self.model.set(_.extend({
      type: self.type,
      properties: _.extend(
        _.clone(self.cartoProperties.attributes), {
          zoom: self.options.map.get('zoom')
        }
      ),
      sql: sql,
      layer_type: self.layer_type || 'CartoDB',
      layer_props: self.LAYER_PROPS || []
    }, opts), { silent: true });
    // make the clean does not save the changed values
    self.model._silent = {};
    self.model.change({ changes: {'properties': ''} });
  },

  _bindChanges: function() {
    var self = this;
    this.cartoProperties.bind('change', function(model,changes) {
      // set forceApply to true so the model knows
      // it was applied from an user action
      self.applyWizard({ forceApply: true });
      // Send change event for statistical purposes
      self._sendChange(model,changes);
    }, this);

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

    var vhalo     = self.form.getFieldByName('Label Halo');
    var voffset   = self.form.getFieldByName('Label Offset');
    var field     = self.form.getFieldByName('Label Text');
    var voverlap  = self.form.getFieldByName('Label overlap');

    if (self.cartoProperties.get('text-name') === 'None') {
      v && v.hide();
      vhalo && vhalo.hide();
      voffset && voffset.hide();
      voverlap && voverlap.hide();
      field.removeClass("border");
    } else {
      v && v.show();
      vhalo && vhalo.show();
      voffset && voffset.show();
      voverlap && voverlap.show();
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

  setTextProperties: function() {
    var field = this._searchFieldByName('Label Text');
    if(field) {
      var b = field.form['text-name'].extra = ['None'].concat(this.options.table.columnNamesByType('string').concat(this.options.table.columnNamesByType('number')));
      field.form['text-name'].value = 'None';
    }
  },

  setFormProperties: function() {
    this.setTextProperties();
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

  propertiesFromStyle: function(cartocss) {
    var parser = new cdb.admin.CartoParser();
    var parsed = parser.parse(cartocss);
    if (!parsed) return {};
    var rules = parsed.getDefaultRules();
    if(parser.errors().length) return;
    var props = {};
    if (rules) {
      for(var prop in this.cartoProperties.attributes) {
        var rule = rules[prop];
        if (rule) {
          rule = rule.eval();
          if (!tree.Reference.validValue(parser.parse_env, rule.name, rule.value)) {
            return {};
          }
          var v = rule.value.eval(this.parse_env);
          if (v.is === 'color') {
            v = v.toString();
          } else if (v.is === 'uri') {
            v = 'url(' + v.toString() + ')';
          } else {
            v = v.value;
          }
          props[prop] = v;
        }
      }
      return props;
    }
    return {};
  },

  /**
   *  If a cartocss property has changed, it will
   *  send an event if it was previously defined.
   */
  _sendChange: function(m,c) {
    if (!c || c.unset) return false;

    var self = this;
    _.each(c.changes, function(v,p) {
      if (v && self._EVENTS[p]) {
        cdb.god.trigger('mixpanel', self._EVENTS[p], { value: m.get(p) });
      }
    })
  }

});
