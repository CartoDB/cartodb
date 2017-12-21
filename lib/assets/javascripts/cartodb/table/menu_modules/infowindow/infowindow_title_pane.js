
  /**
   *  Infowindow title editor pane
   *
   */


  cdb.admin.mod.InfowindowTitlePane = cdb.admin.mod.InfowindowBasePane.extend({

    className: "titlePane",

    initialize: function() {
      this.fields_pane = this.options.fields_pane;
      this._setupModel();
      this._setupTemplate();
      this.render();
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template);
      this._toggleContent();

      this.renderFields();

      return this;
    },

    _setupModel: function() {
      this.model.bind('change:fields',          this.render,         this);
      this.model.bind("change:template",        this._toggleContent, this);
      this.options.table.bind('change:schema',  this.render,         this);

      this.add_related_model(this.options.table);
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_title_pane");
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();
      var fields = [];

      // If there isn't any valid column available,
      // don't render anything.
      if (names.length == 0) {
        return false;
      }

      // Getting fields position from 'fields pane' and
      // trying to reproduce the same list order.
      if (this.fields_pane) {
        names = [];
        this.fields_pane.$('ul.fields li').each(function(i,li){
          names.push($(li).find('span.ellipsis').text());
        });
      }
      
      // names.sort(function(a, b) {
      //   var pos_a = self.model.getFieldPos(a, 'position');
      //   var pos_b = self.model.getFieldPos(b, 'position');
      //   return pos_a - pos_b;
      // });

      _(names).each(function(f) {

        var title = false;
        if (self.model.containsField(f)) {
          var pos = _.indexOf(_(self.model.get('fields')).pluck('name'), f);
          title = self.model.get('fields')[pos] && self.model.get('fields')[pos].title;
        }

        var obj = { name: f, title: title };
        var v = new cdb.admin.mod.InfowindowFieldItem({ model: self.model,  field: obj , position: self.model.getFieldPos(f) });
        
        self.addView(v);
        $f.append(v.render().el);
      });

    }

  });