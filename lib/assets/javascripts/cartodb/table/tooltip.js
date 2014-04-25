
cdb.admin.Tooltip = cdb.geo.ui.Tooltip.extend({

  initialize: function() {
    cdb.geo.ui.Tooltip.prototype.initialize.call(this);
    this.model.bind('change:template_name', this._setTemplate, this);
    this._setTemplate();
    this.add_related_model(this.model);
  },

  _setTemplate: function() {
    this.template = cdb.templates.getTemplate(
      this.model.get('template_name')
    );
    this.render();
  }



});
