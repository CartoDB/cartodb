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

    this.position = 0; // Navigation bar
    this.tabs = new cdb.admin.Tabs();
    this.panels = new cdb.ui.common.TabPane({
      activateOnClick: true
    });
    this.addView(this.tabs);
    this.addView(this.panels);
    this.tabs.linkToPanel(this.panels);

    this.tabs.bind('click', this._applyStyle, this);
    this.options.table.bind('change geolocated', function() {
      this.renderWizards();
      this.panels.active('polygon');
      this.enableTabs();
    }, this);

    // when a panel is selected a signal is raised
    // showing which modules are available for that
    // kind of visualization
    this.panels.bind('tabEnabled', function(name, v) {
      this.trigger('modules', v.MODULES);
    }, this);

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

  _moveNavigation: function(side) {
    if (this.animation) return false;

    var $ul         = this.$el.find("ul.vis_options")
    , gap         = 3
    , list_size   = $ul.find("li").size()
    , move        = $ul.find("li").outerWidth() || 100
    , block_width = $ul.parent().outerWidth() || 380
    , list_width  = list_size * (move + 5/*margin*/)
    , left        = parseInt($ul.css("left").replace("px","")) || 0
    , $right      = this.$el.find('a.right')
    , $left       = this.$el.find('a.left')
    , self        = this;

    // if the list is smaller than the block, we disable the buttons and return
    if (block_width  > list_width ) {
      $left.addClass("disabled");
      $right.addClass("disabled");
      return false
    }

    // Check move
    if (side == "left") {
      if (-(left) < move) {
        move = -left;
      }
      this.position--;
    } else {
      if ((block_width - left) >= list_width) {
        return false;
      } else if ((list_width + left) < move) {
        move = list_width + left;
      }
      this.position++;
    }
    // Check arrows
    if (this.position + gap >= list_size) {
      $right.addClass("disabled");
    } else {
      $right.removeClass("disabled");
    }
    if (this.position==0) {
      $left.addClass("disabled");
    } else {
      $left.removeClass("disabled");
    }
    // Go side
    this.animation = true;
    if (side == "left") {
      $ul.animate({
        'left': '+=' + move + 'px'
      }, 200, function() { self.animation = false; });
    } else {
      $ul.animate({
        left: '-=' + move + 'px'
      }, 200, function() { self.animation = false; });
    }
  },

  _setThumbnails: function() {
    var classes = this.options.table.geomColumnTypes().join("-");
    this.$el.find('.vis_options li a').each(function(i,el){
      $(el).addClass(classes);
    });
  },

  activated: function() {
    var self = this;

    self.active = true;

    // do the same with layer style, if user changes the style too fast
    // lots of tiles are requested to the tile server
    var changeLayerStyle = _.debounce(function(st, sql) {
      var attrs = {
        wizard_properties: self.cartoStylesGeneration.toJSON()
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
      self.model.save({tile_style: st}, { wait: true });
    }, 600);

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
      'point': ['polygon', 'bubble', 'density'],
      'line':['polygon', 'choropleth', 'bubble'],
      'polygon': ['polygon', 'choropleth', 'bubble']
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

    // we remove the disabled ones and trigger movement to recalculate the arrows
    this.tabs.removeDisabled();
    this._moveNavigation('left');
  },

  renderTabs: function() {
    this.tabs.$el.html(
      this.getTemplate('table/menu_modules/views/carto_wizard_tabs')()
    );
  },

  renderWizards: function() {

    var that = this;

    // Remove tabs
    _(this.options.wizards).each(function(wizard, tab_name) {
      that.panels.removeTab(tab_name);
    });

    // Enter the Wizards
    _(this.options.wizards).each(function(wizard, tab_name){

      that.panels.addTab(tab_name, new cdb.admin.mod[wizard]({
        table: that.options.table,
        model: that.cartoStylesGeneration,
        style: that.model.get('style'),
        map: that.options.map
      }).render());

    });

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

    this.$el.html($wrapper);
    this.showTextFields();

    // Custom scroll actions! :)
    this.custom_scroll = new cdb.admin.CustomScrolls({
      el:     $wrapper,
      parent: $wrapper.parent()
    });

    this.addView(this.custom_scroll);

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
    return _.filter(this.options.table.columnNamesByType('number', 'original_schema'), function(c) {
      return c != "cartodb_id"
    });
  }

});
