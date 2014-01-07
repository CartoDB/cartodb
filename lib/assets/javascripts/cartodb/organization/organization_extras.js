
  /**
   *  Organization extras
   *
   *  - Such as a switch (geocoding, sync-tables,...).
   *  - Such as a combo.
   *  ...
   *
   */


  // Combo extra type
  cdb.admin.organization.Combo = cdb.core.View.extend();


  // Switch extra type
  cdb.admin.organization.Switch = cdb.core.View.extend({

    initialize: function() {
      var enabled = this.options.$component.is(':checked');
      this.model = new cdb.core.Model({ enabled: enabled });
      this.model.bind('change', this._onModelChange, this);
    },

    render: function() {
      var sw = new cdb.forms.Switch({
        model: this.model,
        property: 'enabled'
      });

      this.$el.html(sw.render().el);
      this.addView(sw);

      this.options.$component.hide();

      return this;
    },

    _onModelChange: function() {
      this.options.$component.attr('checked', this.model.get('enabled'))
    },

    clear: function() {
      this.options.$component.show();
      cdb.core.View.prototype.clean.call(this);
    }

  });


  // Manage all extras
  cdb.admin.organization.Extras = cdb.core.View.extend({

    _EXTRAS: {
      "select": cdb.admin.organization.Combo,
      "input-checkbox": cdb.admin.organization.Switch
    },

    render: function() {
      var self = this;
      this.clearSubViews();

      this.$('.extra input, .extra select').each(function(i,el){
        var $el = $(el);
        var tag = $el.prop("tagName").toLowerCase();
        var type = $el.attr("type").toLowerCase();
        var extra_type = tag + ( type ? "-" + type : "");

        var extra = new self._EXTRAS[extra_type]({ $component: $el });

        $el.after(extra.render().el);
        self.addView(extra);
      })
    }

  });