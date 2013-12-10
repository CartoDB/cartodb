
  /**
   *  Default infowindow pane: allows toggling titles
   *
   */


  cdb.admin.mod.InfowindowFieldsPane = cdb.admin.mod.InfowindowBasePane.extend({

    className: "fieldPane",

    events: {
      'click .selectall': '_manageAll',
      "click .reset": "_onResetClick"
    },

    initialize: function() {
      this._setupModel();
      this._setupTemplate();
      this.render();
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template);
      this._toggleContent();

      this.$el.find('.fields').sortable("destroy")
      this.renderFields();
      this.$selectAll = this.$el.find(".selectall");
      this.renderSelectAll();

      return this;
    },

    _setupModel: function() {
      this.model.bind('remove:fields',          this.renderSelectAll, this);
      this.model.bind('add:fields',             this.renderSelectAll, this);
      this.model.bind("change:template",        this._toggleContent,  this);
      this.options.table.bind('change:schema',  this.render,          this);

      this.bind('reset', this.render, this);

      this.add_related_model(this.options.table);
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_fields_pane");
    },

    renderSelectAll: function() {
      var select_all = true
        , self = this;
      _(this.getColumnNames()).each(function(f) {
        if (!self.model.containsField(f)) {
          select_all = false;
        }
      });

      this.selectedAll = select_all;

      this._changeSelectAll();
    },

    _changeSelectAll: function() {
      if (!this.working) {
        this.$selectAll.removeClass("working");

        if (!this.selectedAll) {
          this.$selectAll.addClass("disabled").removeClass("enabled");
        } else {
          this.$selectAll.addClass("enabled").removeClass("disabled");
        }
      } else {
        this.$selectAll.addClass("enabled working");
      }
    },

    _manageAll: function(e) {
      var self = this;
      this.killEvent(e);

      if (this.working) return;

      self.model.clearFields();

      if (!self.selectedAll) self._selectAll();
      else self._unselectAll();
    },

    _selectAll: function() {
      var self = this;

      var
      names    = this.getColumnNames(),
      count    = _.size(names) - 1,
      promises = [];

      _(names).each(function(f) {
        self.working = true;
        promises.push(self.model._addField(f));
      });

      $.when.apply($, promises).then(function() {
        self.working = false;
        self.model.sortFields();
        self.model.trigger('change:fields');

        self._toggleSelectAll();
      });
    },

    _unselectAll: function() {
      this.model.trigger('change:fields');
      this._toggleSelectAll();
    },

    _toggleSelectAll: function() {
      this.selectedAll = !this.selectedAll;
      this._changeSelectAll();
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();

      // If there isn't any valid column available
      // show the message in the background
      if (names.length == 0) {
        this._showNoContent();
        return false;
      }

      names.sort(function(a, b) {
        var pos_a = self.model.getFieldPos(a, 'position');
        var pos_b = self.model.getFieldPos(b, 'position');
        return pos_a - pos_b;
      });

      _(names).each(function(f) {
        var v = new cdb.admin.mod.InfowindowField({ model: self.model,  field: f , position: self.model.getFieldPos(f) });
        self.addView(v);
        $f.append(v.render().el);
      });

      // Sorteable list, except theme field!
      $f.sortable({
        items: 'li',
        handle: 'span.ellipsis',
        stop: function(ev, ui) {
          self._reasignPositions();
        }
      });
    },

    _showNoContent: function() {
      this.$('.no_content').show();
      this.$('div.all').hide();
    },

    // when fields are sorted in the iu we should recalculate all models positions
    _reasignPositions: function() {
      var self = this;
      this.$el.find('.drag_field').each(function(i, el) {
        var v = self._subviews[$(el).attr('cid')];
        v.model.setFieldProperty(v.fieldName, 'position', i);
        v.position = i;
      });
    }

  });
