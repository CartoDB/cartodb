
  /**
   *  Infowindow title editor pane
   *
   */


  cdb.admin.mod.InfowindowTitlePane = cdb.admin.mod.InfowindowBasePane.extend({

    className: "titlePane",

    initialize: function() {
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
      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

      this.model.bind("change:fields", this.render, this);
      this.model.bind("change:custom_html", this._toggleContent, this);
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_title_pane");
    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();

      names.sort(function(a, b) {
        var pos_a = self.model.getFieldPos(a, 'position');
        var pos_b = self.model.getFieldPos(b, 'position');
        return pos_a - pos_b;
      });

      _(names).each(function(f) {
        var v = new cdb.admin.mod.InfowindowFieldItem({ model: self.model,  field: f , position: self.model.getFieldPos(f) });
        self.addView(v);
        $f.append(v.render().el);
      });
    }

  });