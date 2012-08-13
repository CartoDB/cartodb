
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
  }
  ];





  var SimpleWizard = cdb.core.View.extend({

    initialize: function() {
      this.form = new cdb.forms.Form({ form_data: simple_form });
    },

    render: function() {
      this.$el.append(this.form.render().el);
      return this;
    }

  });

  cdb.admin.mod.CartoWizard = cdb.core.View.extend({

    click: {
      'click li': '_changeWizard'
    },

    initialize: function() {
      this.panels = new cdb.ui.common.TabPane();
    },

    render: function() {
      this.$el.append(this.getTemplate('table/menu_modules/views/carto_wizard')());
      this.panels.setElement(this.$('.forms'));
      this.panels.addTab('simple', new SimpleWizard().render());
      return this;
    },

    _changeWizard: function(e) {
      e.preventDefault();
      var what = $(e.target).html();
      this.panels.activate(what);
      return false;
    }

  });



})();
