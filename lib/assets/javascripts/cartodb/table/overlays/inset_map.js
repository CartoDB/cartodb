cdb.admin.overlays.InsetMap = cdb.geo.ui.InsetMap.extend({
  // Extend in order to render the placement dropdown

  default_options: {
    template_base: 'table/views/overlays/inset_map',
    timeout: 0,
    msg: ''
  },

  initialize: function () {
    cdb.geo.ui.InsetMap.prototype.initialize.call(this);

    this.model.on('destroy', this._cleanViews, this);
  },

  render: function () {
    if (!this.miniMapControl) {
      return this;
    }

    cdb.geo.ui.InsetMap.prototype.render.call(this);

    if (!this.template_base) {
      this.template_base = cdb.templates.getTemplate(this.options.template_base);
    }
    this.$control.append(this.template_base());

    this.placementDropdown = new cdb.admin.InsetMapPlacementDropdown({
      model: this.model,
      target: this.$control.find('.inset-map-grabber'),
      template_base: 'table/views/overlays/inset_map_placement_dropdown',
      position: 'position',
      tick: 'down',
      vertical_position: 'down',
      horizontal_position: 'right',
      horizontal_offset: '0px'
    });
    this.$control.find('.inset-map-grabber').append(this.placementDropdown.render().el);

    return this;
  },

  _cleanViews: function () {
    if (this.placementDropdown) {
      this.placementDropdown.clean();
    }
  }

});
