
(function() {

  var simple_form = [
    {
       name: 'Marker Fill',
       form: {
         'polygon-fill': { type: 'color' , value: '#00FF00' },
          'polygon-opacity': { type: 'opacity' , value: 0.6 }
      }
    },
    {
       name: 'Marker Stroke',
       form: {
          'marker-line-width': { type: 'width', value: 1 },
          'marker-line-color': { type: 'color' , value: '#00FF00' },
          'marker-line-opacity': { type: 'opacity', value: 0.6 }
      }
    },
    {
       name: 'Polygon Fill',
       form: {
         'polygon-fill': { type: 'color' , value: '#00FF00' },
          'polygon-opacity': { type: 'opacity' , value: 0.6 }
      }
    },
    {
       name: 'Polygon Stroke',
       form: {
          'line-width': { type: 'width', value: 1 },
          'line-color': { type: 'color' , value: '#00FF00' },
          'line-opacity': { type: 'opacity', value: 0.6 }
      }
    }
  ];





  /**
   * manages all the wizards which render carto
   */
  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    events: {
      'click li a': '_changeWizard'
    },

    initialize: function() {
      var self = this;
      this.cartoStylesGeneration = new cdb.admin.CartoStyles({
        table: this.options.table
      });

      this.panels = new cdb.ui.common.TabPane();
    },

    activated: function() {
      var self = this;
      // this is the sole entry point where the catocss in changed
      // wizards only should change cartoStylesGeneration model
      this.cartoStylesGeneration.bind('change:style', function() {
        self.model.set('tile_style', this.get('style'));
      });
    },

    deactivated: function() {
      this.cartoStylesGeneration.unbind(null, null, this);
    },

    render: function() {
      this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
      this.panels.setElement(this.$('.forms'));

      // render the wizards
      this.panels.addTab('simple', new SimpleWizard({
        model: this.cartoStylesGeneration
      }).render());

      this.panels.addTab('bubble', new BubbleWizard({
        model: this.cartoStylesGeneration,
        table: this.options.table
      }).render());

      return this;
    },

    _changeWizard: function(e) {
      e.preventDefault();
      var what = $(e.target).html();
      this.panels.active(what);
      return false;
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

      this.form = new cdb.forms.Form({
        form_data: this.options.form || simple_form,
        model: this.cartoProperties
      });

      this.cartoProperties.bind('change', function() {
        self.model.set({ properties: _.clone(self.cartoProperties.attributes) });
      });
    },

    render: function() {
      this.$el.html('');
      this.$el.append(this.form.render().el);
      return this;
    }

  });

  var bubble_form = [
    {
       name: 'Column',
       form: { 'property': { type: 'select' } } /* value is filled by wizard */
    },
    {
       name: 'Radius',
       form: {
         'radius_min': { type: 'number', value: 1 },
         'radius_max': { type: 'number', value: 10 }
       }
    },
    {
       name: 'Bubble fill',
       form: {
         'marker-fill': { type: 'color', value: '#00FF00' },
         'marker-opacity': { type: 'opacity', value: 0.9 }
       }
    },
    {
       name: 'Bubble stroke',
       form: {
         'marker-line-width': { type: 'number', value: 1 },
         'marker-line-color': { type: 'color', value: '#00FF00' },
         'marker-line-opacity': { type: 'opacity', value: 0.9 }
       }
    }
  ];

  /**
   * bubble
   */
  var BubbleWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = bubble_form;

      this.setFormProperties();

      this.model.registerGenerator('bubble', bubble_generator);
      this.model.set( {'type': 'bubble'}, {silent: true});
      SimpleWizard.prototype.initialize.call(this);

      this.add_related_model(this.options.table);
      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        this.render();
      }, this);
    },

    setFormProperties: function() {
      var b = this.options.form[0].form.property.extra = this.options.table.columnNames();
      this.options.form[0].form.property.value = b[0];
    }

  });

  cdb._BubbleWizard = BubbleWizard;



})();
