
(function() {

  /**
   * manages all the wizards which render carto
   */
  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    events: {
    },

    initialize: function() {
      var self = this;
      self.active = false;
      this.cartoStylesGeneration = new cdb.admin.CartoStyles({
        table: this.options.table
      });

      this.guessStyle = new cdb.admin.CartoStyles({
        table: this.options.table
      });
      this.model.bind('change:tile_style', this._updateForms, this);

      this.tabs = new cdb.admin.Tabs();
      this.panels = new cdb.ui.common.TabPane();
      this.addView(this.tabs);
      this.addView(this.panels);
      this.tabs.linkToPanel(this.panels);

      this.tabs.bind('click', this._applyStyle, this);
    },

    _updateForms: function() {
      var self = this;
      if(this.guessStyle.loadFromCartoCSS(self.model.get('tile_style'))) { 
        var type = self.guessStyle.get('type');
        var p = self.panels.getPane(type);
        if(p) {
          p.setCarpropertiesSilent(self.guessStyle.get('properties'));
          self.panels.active(type);
        }
      }
    },


    activated: function() {
      var self = this;

      self.active = true;
      // only save model to the server when there is no changes in one second
      // usually users changes the wizard forms very quickly
      var modelSave = _.debounce(function() {
        self.model.save();
      }, 1000);

      // do the same with layer style, if user changes the style too fast
      // lots of tiles are requested to the tile server 
      var changeLayerStyle = _.debounce(function(st, sql) {
        if(sql) {
          self.model.set({
            'query': sql,
            'query_generated': true
          });
        }
        self.model.set('tile_style', st);
      }, 600);

      // this is the sole entry point where the cartocss is changed.
      // wizards only should change cartoStylesGeneration model
      this.cartoStylesGeneration.bind('change:style change:sql', function() {
        changeLayerStyle(
          self.cartoStylesGeneration.get('style'),
          self.cartoStylesGeneration.get('sql')
        );
        modelSave();
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
        'line':['polygon'],
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
    },

    render: function() {
      this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
      this.tabs.setElement(this.$('ul.vis_options'));
      this.panels.setElement(this.$('.forms'));

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
      this.cartoProperties = new Backbone.Model();
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
    },

    _unbindChanges: function() {
      this.cartoProperties.unbind(null, null, this);
    },

    // changes properties WITHOUT updating the model, only refresh the
    // UI
    setCarpropertiesSilent: function(p) {
      this._unbindChanges();
      this.cartoProperties.set(p);
      this._bindChanges();
    },

    render: function() {
      this.$el.html('');
      this.$el.append(this.form.render().el);
      return this;
    },

    setFormProperties: function() {
      var field = this._searchFieldByName('Label Text');
      if(field) {
        var b = field.form['text-name'].extra = this.options.table.columnNamesByType('string').concat(this.options.table.columnNamesByType('number'));
        field.form['text-name'].value = b[0];
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
        this.render();
      }, this);
    },

    setFormProperties: function() {
      var b = this.options.form[0].form.property.extra = this.options.table.columnNamesByType('number');
      this.options.form[0].form.property.value = b[0];
    }

  });

  cdb._BubbleWizard = BubbleWizard;

  /**
   * choroplet
   */
  var ChoroplethWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = cdb.admin.forms.choroplet;
      this.setFormProperties();
      SimpleWizard.prototype.initialize.call(this);

      this.type = 'choropleth';

      this.add_related_model(this.options.table);
      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        this.render();
      }, this);
    },

    setFormProperties: function() {
      var b = this.options.form[0].form.property.extra = this.options.table.columnNamesByType('number');
      this.options.form[0].form.property.value = b[0];
    }

  });

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
        self.sql = _.template("WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(CDB_XYZ_Extent({x},{y},{z}), CDB_XYZ_Resolution({z}) * <%= size %>), CDB_XYZ_Resolution({z}) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.<%=prop%>) as points_count FROM hgrid, <%= table_name %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell")({
          prop: prop,
          table: table.get('name'),
          size: this.cartoProperties.get('polygon-size')
        });
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: self.sql
        });
      }, this);
    }

  });




})();
