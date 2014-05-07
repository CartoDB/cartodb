
cdb.admin.Tooltip = cdb.geo.ui.Tooltip.extend({

  _TEMPLATE_URL: 'table/views/tooltip/templates',

  initialize: function() {
    this.table = this.options.table;
    cdb.geo.ui.Tooltip.prototype.initialize.call(this);
    this.model.bind('change:template_name', this._setTemplate, this);
    this.model.bind('change:template',      this._compileTemplate, this);
    this._setTemplate();
    this.options.wrapdata = true;
  },

  render: function(data) {
    cdb.geo.ui.Tooltip.prototype.render.call(this, data);

    this.$('.cartodb-tooltip-content-wrapper')
      .append(cdb.templates.getTemplate('table/views/infowindow/infowindow_footer')({ "cartodb_id": "" }));

    if(this.table.isReadOnly()) {
      this.$('.cartodb-tooltip').find('a.remove, a.edit_data, a.edit_geo').addClass('disabled');
    }

    return this;
  },

  /**
   *  Compile template of the tooltip
   */
  _compileTemplate: function() {
    var template = this.model.get('template') ?
      this.model.get('template') :
      cdb.templates.getTemplate(this._getModelTemplate());

    if(typeof(template) !== 'function') {
      this.template = new cdb.core.Template({
        template: template,
        type: this.model.get('template_type') || 'mustache'
      }).asFunction()
    } else {
      this.template = template
    }

    this.render();
  },

  _setTemplate: function() {
    if (this.model.get('template_name')) {
      this.template = cdb.templates.getTemplate(this._getModelTemplate());
      this.render();
    }
  },

  _getModelTemplate: function() {
    return this._TEMPLATE_URL + "/" + this.model.get('template_name')
  }

});
