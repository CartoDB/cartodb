
(function() {

  var simple_form = [
  {
     name: 'Marker Fill',
     form: {
       'polygon-fill': {
             type: 'color' ,
             value: '#00FF00'
        },
        'polygon-opacity': {
             type: 'opacity' ,
             value: 0.6
        }
    }
  },
  {
     name: 'Marker Stroke',
     form: {
        'marker-line-width': {
             type: 'width',
             value: 1
        },
        'marker-line-color': {
             type: 'color' ,
             value: '#00FF00'
        },
        'marker-line-opacity': {
             type: 'opacity',
             value: 0.6
        }
    }
  },
  {
     name: 'Polygon Fill',
     form: {
       'polygon-fill': {
             type: 'color' ,
             value: '#00FF00'
        },
        'polygon-opacity': {
             type: 'opacity' ,
             value: 0.6
        }
    }
  },
  {
     name: 'Polygon Stroke',
     form: {
        'line-width': {
             type: 'width',
             value: 1
        },
        'line-color': {
             type: 'color' ,
             value: '#00FF00'
        },
        'line-opacity': {
             type: 'opacity',
             value: 0.6
        }
    }
  }
  ];





  /**
   * manages all the wizards which render carto
   */
  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    click: {
      'click li': '_changeWizard'
    },

    initialize: function() {
      var self = this;
      this.cartoStylesGeneration = new cdb.admin.CartoStyles({
        table: this.options.table
      });

      this.panels = new cdb.ui.common.TabPane();

      // this is the sole entry point where the catocss in changed
      // wizards only should change cartoStylesGeneration model
      this.cartoStylesGeneration.bind('change:style', function() {
        self.model.set('tile_style', this.get('style'));
      });
    },

    render: function() {
      this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
      this.panels.setElement(this.$('.forms'));

      // render the wizards
      this.panels.addTab('simple', new SimpleWizard({
        model: this.cartoStylesGeneration
      }).render());

      return this;
    },

    _changeWizard: function(e) {
      e.preventDefault();
      var what = $(e.target).html();
      this.panels.activate(what);
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
      this.$el.append(this.form.render().el);
      return this;
    }

  });

  /*var bubble_form = [
  {
     name: 'Column',
     form: {
       'polygon-fill': {
             type: 'color' ,
             value: '#00FF00'
        },
        'polygon-opacity': {
             type: 'opacity' ,
             value: 0.6
        }
    }
  }*/
  /**
   * bubble
   */
  /*
  var BubbleWizard = SimpleWizard.extend({

    initialize: function() {
      this.options.form = bubble_form;
      SimpleWizard.prototype.initialize.call(this);
    },

  });
  */




})();
