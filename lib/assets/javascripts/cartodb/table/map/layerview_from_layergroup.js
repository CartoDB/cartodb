
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
      attrs.table_name_alias = attrs.table_name_alias || "";
      this.$el.append(this.template(attrs));
      return this;
    }

  });