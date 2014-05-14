
cdb.admin.Tooltip = cdb.geo.ui.Tooltip.extend({

  _TEMPLATE_URL: 'table/views/tooltip/templates',

  events: {
    'mouseover': '_lock',
    'mouseout': '_unlock'
    //'click .edit_data': '_editData',
    //'click .edit_geo':  '_editGeom',
    //'click .remove':    '_removeGeom',
  },

  initialize: function() {
    this.table = this.options.table;
    this.options.empty_fields = true; // render empty fields
    cdb.geo.ui.Tooltip.prototype.initialize.call(this);
    this.model.bind('change:template_name', this._setTemplate, this);
    this.model.bind('change:template', this._compileTemplate, this);
    this.model.bind('change:fields',this._changeFields, this);
    this.model.bind('change:alternative_names',this._alternameNames, this);
    this._setTemplate();
    this._alternameNames();
    this._changeFields();
    if (this.model.get('template')) {
      this._compileTemplate();
    }
    this.targetPos = null;
    this.locked = false;
    this.hideTimeout = -1;
  },

  render: function(data) {
    if (this.model.fieldCount()) {
      cdb.geo.ui.Tooltip.prototype.render.call(this, data);
    } else {
      this.el.innerHTML = '';
    }
    /*
    this.$('.cartodb-tooltip-content-wrapper')
      .append(cdb.templates.getTemplate('table/views/infowindow/infowindow_footer')({ "cartodb_id": "" }));

    if (this.table.isReadOnly()) {
      this.$('.cartodb-tooltip-content-wrapper')
        .find('a.remove, a.edit_data, a.edit_geo').addClass('disabled');
    }
    */

    return this;
  },

  _lock: function(e) {
    this.locked = true;
    clearTimeout(this.hideTimeout);
  },

  _unlock: function(e) {
    this.locked = false;
  },

  _changeFields: function() {
    this.setFields(this.model.get('fields'));
  },

  _alternameNames: function() {
    this.options.alternative_names = this.model.get('alternative_names');
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
  },

  _move: function() {
    if (!this.targetPos) return;
    var pos = this.$el.position();
    var dx = this.targetPos.x - pos.left;
    var dy = this.targetPos.y - pos.top;
    pos.left += dx*0.05;
    pos.top += dy*0.05;
    this.$el.css(pos);
    if (!this.locked && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
      L.Util.requestAnimFrame(this._move, this);
    }
  },

/*
  hide: function() {
    // dont hide if the mouse is hovering it
    if (!this.locked) {
      var self = this;
      // wait a little bit to close it to give some time
      // to the user to over it
      clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(function() {
        self.$el.fadeOut(80);
      }, 80);
    }
  },

  // overwrite show since we need the movement of the tooltip is different
  show: function(pos, data) {
    clearTimeout(this.hideTimeout);
    this.cartodb_id = data.cartodb_id;
    if (this.locked) return;
    if (this._filter && !this._filter(data)) {
      return this;
    }
    this.render(_.omit(data, 'cartodb_id'));
    this.targetPos = {
      x: pos.x,
      y: pos.y + (this.options.offset_top || this.DEFAULT_OFFSET_TOP)
    };
    if(!this.showing) {
      this.$el.css({
        left: this.targetPos.x,
        top: this.targetPos.y
      });
    }
    this.$el.show();
    L.Util.requestAnimFrame(this._move, this);
    return this;
  },

  _triggerAction: function(action) {
    this._unlock();
    this.hide();
    var row = this.table.data().getRow(this.cartodb_id, {
      no_add: true
    });
    this.trigger(action, row);
  },

  _editGeom: function(e) {
    this.killEvent(e);
    this._triggerAction('editGeom');
  },

  _editData: function(e) {
    this.killEvent(e);
    this._triggerAction('editData');
  },

  _removeGeom: function(e) {
    this.killEvent(e);
    this._triggerAction('removeGeom');
  }
  */

});
