(function() {

  /**
   * manages all the wizards which render carto
   */
  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    events: {
      'click  .vis_options a':    '_updateNavigation',
      'click  .wizard_arrows a':  '_onArrowClick'
    },

    initialize: function() {
      _.bindAll(this, '_updateNavigation');

      var self = this;
      self.active = false;
      this.cartoStylesGeneration = new cdb.admin.CartoStyles({
        table: this.options.table
      });

      this.model.bind('change:wizard_properties', this._updateForms, this);

      this.position = 0; // Navigation bar
      this.tabs = new cdb.admin.Tabs();
      this.panels = new cdb.ui.common.TabPane();
      this.addView(this.tabs);
      this.addView(this.panels);
      this.tabs.linkToPanel(this.panels);

      this.tabs.bind('click', this._applyStyle, this);
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

    _updateNavigation: function(ev) {
      // // Get wizard type
      // var wizard    = this.model.get('wizard_properties')
      //   , type      = wizard.type
      //   , $li       = this.$el.find('li a[href="#' + type + '"]').parent()
      //   , new_pos   = $li.index()
      //   , count     = (Math.abs(this.position - new_pos))
      //   , side      = (this.position > new_pos) ? 'left' : 'right';

      // if (count > 0)
      //   this._moveNavigation(side,count);
    },

    _moveNavigation: function(side) {
      if (this.animation) return false;
      console.log(0);
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
          attrs.query =  sql;
          attrs.query_generated = true;
        } else {
          if(self.model.get('query_generated')) {
            attrs.query = null;
            attrs.query_generated = false;
          }
        }
        self.model.set(attrs, {silent: true} );
        self.model.save({tile_style: st}, { wait: true });
      }, 600);

      // this is the sole entry point where the cartocss is changed.
      // wizards only should change cartoStylesGeneration model
      this.cartoStylesGeneration.bind('change:style change:sql', function() {
        changeLayerStyle(
          self.cartoStylesGeneration.get('style'),
          self.cartoStylesGeneration.get('sql')
        );
      }, this);
    },

    deactivated: function() {
      this.active = false;
      this.cartoStylesGeneration.unbind(null, null, this);
    },

    _applyStyle: function(name) {
      this.panels.getActivePane().cartoProperties.trigger('change');//change();
    },

    // depending on the geometry type some wizards should be disabled
    enableTabs: function() {
      var _enableMap = {
        'point': ['polygon', 'bubble', 'density'],
        'line':['polygon', 'choropleth', 'bubble'],
        'polygon': ['polygon', 'choropleth', 'bubble']
      };

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

      // we remove the disabled ones and trigger movement to recalculate the arrows
      this.tabs.removeDisabled();
      this._moveNavigation('left');
    },

    render: function() {
      this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
      this.tabs.setElement(this.$('ul.vis_options'));
      this.panels.setElement(this.$('.forms'));

      // apply tipsy for nav - a
      this.$('ul.vis_options li a').each(function(i,ele) {
        $(ele).tipsy({ gravity: 's', fade: true });
      });

      // render the wizards
      this.panels.addTab('polygon', new SimpleWizard({
        table: this.options.table,
        model: this.cartoStylesGeneration,
        style: this.model.get('style')
      }).render());

      this.panels.addTab('bubble', new BubbleWizard({
        model: this.cartoStylesGeneration,
        table: this.options.table,
        style: this.model.get('style')
      }).render());

      this.panels.addTab('choropleth', new ChoroplethWizard({
        model: this.cartoStylesGeneration,
        table: this.options.table,
        style: this.model.get('style')
      }).render());

      this.panels.addTab('density', new DensityWizard({
        model: this.cartoStylesGeneration,
        table: this.options.table,
        style: this.model.get('style')
      }).render());

      this.panels.active('polygon');
      this._updateForms();
      this.enableTabs();

      // var wizard = this.model.get('wizard_properties')
      //   , type = wizard.type;
      // this._updateNavigation(type);

      this._setThumbnails();
      window.aaa = this;
      return this;
    }

  });

  /**
   * simple wizard tab
   * take this as base for other wizards
   */
  var SimpleWizard = cdb.core.View.extend({

    initialize: function() {
      var self = this;
      this.cartoProperties = new cdb.core.Model();
      this.type = 'polygon';
      this.geomForm = cdb.admin.forms.simple_form[this.options.table.geomColumnTypes()[0]];
      this.setFormProperties();


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

    _bindChanges: function() {
      var self = this;
      this.cartoProperties.bind('change', function() {
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: null
        });
      }, this);
      this.cartoProperties.bind('change:text-name', this.showTextFields, this);
      this.cartoProperties.bind('change:marker-width', function(m, width) {
        this.cartoProperties.set('text-dy', -width);

      }, this);
    },

    showTextFields: function() {
      var self = this;
      var v = self.form.getFieldByName('Label Font');
      var vhalo = self.form.getFieldByName('Label Halo');
      if(self.cartoProperties.get('text-name') === 'None') {
        v && v.hide();
        vhalo && vhalo.hide();
      } else {
        v && v.show();
        vhalo && vhalo.show();
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
      this.$el.html('');

      var $wrapper = $("<div>").addClass("wrapper")
        , $content = $("<div>").addClass("content");

      $content.append(this.form.render().el);
      $wrapper.append($content);

      this.$el.append($wrapper)
      this.showTextFields();

      // Custom scroll actions! :)
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el: $wrapper
      });
      this.addView(this.custom_scroll);

      return this;
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
    }

  });

  /**
   * bubble
   */
  var BubbleWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = cdb.admin.forms.bubble_form;
      this.setFormProperties();
      SimpleWizard.prototype.initialize.call(this);

      this.type = 'bubble';

      this.add_related_model(this.options.table);
      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns =  this.options.table.columnNamesByType('number');
          if(columns.length) {
            this.cartoProperties.set({ 'property': columns[0] });
          }

        }
        this.render();
      }, this);
    },

    setFormProperties: function() {
      if(this.options && this.options.form && this.options.form.length > 0) {
        var b = this.options.form[0].form.property.extra = this.options.table.columnNamesByType('number');
        this.options.form[0].form.property.value = b[0];
        this.cartoStylesGeneration
      }
    }

  });

  cdb._BubbleWizard = BubbleWizard;

  /**
   * choropleth
   */
  var ChoroplethWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = cdb.admin.forms.choropleth[this.options.table.geomColumnTypes()[0]];
      this.setFormProperties();
      SimpleWizard.prototype.initialize.call(this);

      this.type = 'choropleth';

      this.add_related_model(this.options.table);
      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns =  this.options.table.columnNamesByType('number');
          if(columns.length) {
            this.cartoProperties.set({ 'property': columns[0] });
          }

        }
        this.render();
      }, this);
    },

    setFormProperties: function() {
      // If the table doesn't have any kind of geometry,
      // we avoid rendering the choroplethas

      if(this.options && this.options.form && this.options.form.length > 0) {
        var b = this.options.form[0].form.property.extra = this.options.table.columnNamesByType('number');
        this.options.form[0].form.property.value = b[0];
      }
    }

  });

  cdb._ChoroplethWizard = ChoroplethWizard;

  //cdb._BubbleWizard = BubbleWizard;
  var DensityWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = cdb.admin.forms.density;
      SimpleWizard.prototype.initialize.call(this);

      this.type = 'density';

      this.add_related_model(this.options.table);
      this.options.table.bind('change:schema', function() {
        this.render();
      }, this);
    },

    _bindChanges: function() {
      var self = this;
      this.cartoProperties.bind('change', function() {
        var table = self.options.table;
        var prop = 'cartodb_id';

        if(this.cartoProperties.get('geometry_type') === 'Rectangles') {
          self.sql = _.template("WITH hgrid AS (SELECT CDB_RectangleGrid(ST_Expand(CDB_XYZ_Extent({x},{y},{z}), CDB_XYZ_Resolution({z}) * <%= size %>), CDB_XYZ_Resolution({z}) * <%= size %>, CDB_XYZ_Resolution({z}) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.<%=prop%>) as points_count FROM hgrid, <%= table_name %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell")({
            prop: prop,
            table: table.get('name'),
            size: this.cartoProperties.get('polygon-size')
          });

        } else {
          self.sql = _.template("WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(CDB_XYZ_Extent({x},{y},{z}), CDB_XYZ_Resolution({z}) * <%= size %>), CDB_XYZ_Resolution({z}) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.<%=prop%>) as points_count FROM hgrid, <%= table_name %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell")({
            prop: prop,
            table: table.get('name'),
            size: this.cartoProperties.get('polygon-size')
          });
        }
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: self.sql
        });
      }, this);
    }
  });

})();
