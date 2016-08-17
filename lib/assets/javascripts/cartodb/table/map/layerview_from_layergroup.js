
  /**
   *  Layer view item for layer selector within app
   */

  cdb.geo.ui.LayerView = cdb.geo.ui.LayerView.extend({

    defaults: {
      template: '\
        <a class="layer" href="#/change-layer"><%- table_name_alias || table_name %></a>\
        <a href="#switch" class="right <%- visible ? "enabled" : "disabled" %> switch"><span class="handle"></span></a>\
      '
    },

    render: function() {
      var attrs = _.clone(this.model.attributes);
      // if synced table, titlecase layer name
      var table_name = attrs.table_name || attrs.table_name_alias || "";
      if (this.model.table.get('synchronization') && this.model.table.get('synchronization').from_external_source) {
        table_name = Sugar.String.titleize(table_name);
      }
      attrs.table_name_alias = table_name;
      this.$el.append(this.template(attrs));
      return this;
    }

  });