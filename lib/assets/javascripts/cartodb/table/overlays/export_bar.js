/* global $:false, _:false */
cdb.admin.ExportBarActions = cdb.core.View.extend({
  initialize: function () {
    this.template_base = cdb.templates.getTemplate('table/overlays/export_bar_actions');
  },

  _enableTipsy: function () {
    var self = this;

    _.each(this.$('a[title]'), function (el) {
      var tooltip = new cdb.common.TipsyTooltip({
        el: $(el)
      });

      self.addView(tooltip);
    });
  },

  render: function () {
    this.clearSubViews();
    this.setElement(this.template_base(this.options));
    this._enableTipsy();

    return this;
  }

});

cdb.admin.ExportBar = cdb.core.View.extend({
  className: 'overlay-properties export-options',

  events: {
    'click': 'killEvent'
  },

  initialize: function () {
    this.overlays = this.options.overlays;
    this.sizeTextChanged = false;
    this._setupModel();
    this._addExportDataModel();
  },

  // return whether current selection is 'Local' export or 'AVMM' from drop-down selection
  getDestinationType: function () {
    return this.exportData.get('destination') || 'AVMM'; // AVMM is default
  },

  _setupModel: function () {
    this.model = this.options.model;
    this.model.bind('remove', this.remove, this);
  },

  _addExportDataModel: function () {
    this.exportData = new cdb.core.Model(this.model.get('export_data'));
    this.exportData.unbind('change', this._setExportDataModel, this);
    this.exportData.bind('change', this._setExportDataModel, this);
  },

  _setExportDataModel: function () {
    this.model.set('export_data', this.exportData.toJSON());

    // only trigger update in export image view if size text field edited
    if (this.sizeTextChanged) {
      this.sizeTextChanged = false;
      var w = this.exportData.get('width');
      var h = this.exportData.get('height');
      this.trigger('custom_size_changed', w, h);
    }
  },

  /*
   * When resizer handles dragged, update the text box sizes
   */
  updateSize: function (width, height) {
    this.sizeTextChanged = false; // do not trigger back on image view

    // set in views
    var customSize = this.form.getFieldByName('Custom Size');
    this.widthInput = customSize.find('input')[0];
    this.heightInput = customSize.find('input')[1];

    this.widthInput.value = width;
    this.heightInput.value = height;

    // set on model
    this.exportData.set({width: width, height: height});
    this._setExportDataModel();

    // once done updating change from export image, listen to text boxes again
    this.sizeTextChanged = true;
  },

  reset: function () {
    this.model.set('export_data', {});
  },

  _addForm: function () {
    var self = this;

    if (!this.form) {
      this.form = new cdb.forms.Form({
        form_data: this.options.form_data,
        model: this.exportData
      }).on('saved', function () {
        self.trigger('saved', self);
      });

      this.addView(this.form);
      this.$el.append(this.form.render().$el);
    }

    var sizeField = this.form.getFieldByName('Size');
    var customSize = this.form.getFieldByName('Custom Size');
    customSize.hide(); // only show when custom size selected

    sizeField.on('change', function (event) {
      self.trigger('export_size_changed', event.val);
    });
  },

  destroy: function () {
    this.off();
    this.model.off(null, null, this);
    this.remove();
  },

  deselectOverlay: function () {
    this.model.set('selected', false);
  },

  compareModel: function (model) {
    return model && this.model === model;
  },

  showField: function (field) {
    var fld = this.form.getFieldByName(field);
    fld.show();
  },

  hideField: function (field) {
    var fld = this.form.getFieldByName(field);
    fld.hide();
  },

  render: function () {
    this._addForm();
    return this;
  }

});
