
(function() {

  /**
   * manages all the wizards which render carto
   */
  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    events: {
      'click ul.vis_options li a': '_changeWizard'
    },

    initialize: function() {
      var self = this;
      this.cartoStylesGeneration = new cdb.admin.CartoStyles({
        table: this.options.table
      });

      this.panels = new cdb.ui.common.TabPane();
      this.panels.bind("tabEnabled", this._setSelected, this);
    },

    activated: function() {
      var self = this;
      // only save model to the server when there is no changes in one second
      // usually users changes the wizard forms very quickly
      var modelSave = _.debounce(function() {
        self.model.save();
      }, 1000);

      // this is the sole entry point where the catocss in changed
      // wizards only should change cartoStylesGeneration model
      this.cartoStylesGeneration.bind('change:style', function() {
        self.model.set('tile_style', this.get('style'));
        modelSave();
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

      this.panels.addTab('choropleth', new ChoroplethWizard({
        model: this.cartoStylesGeneration,
        table: this.options.table
      }).render());

      this.panels.active('simple');

      return this;
    },

    _changeWizard: function(e) {
      e.preventDefault();
      var what = $(e.target).html();

      this.panels.active(what);
      return false;
    },

    _setSelected: function(name,el) {
      // Change selected class to new one
      this.$el.find("ul.vis_options li a").removeClass("selected");
      this.$el.find("ul.vis_options li a[href=#" + name + "]").addClass("selected");
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

      this.form = new cdb.forms.Form({
        form_data: this.options.form || cdb.admin.forms.simple_form,
        model: this.cartoProperties
      });

      this.cartoProperties.bind('change', function() {
        self.model.set({ 
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes) 
        });
      }, this);
    },

    render: function() {
      this.$el.html('');
      this.$el.append(this.form.render().el);
      return this;
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

      this.model.registerGenerator('bubble', bubble_generator);
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

      this.model.registerGenerator('choropleth', choropleth_generator);
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




})();
