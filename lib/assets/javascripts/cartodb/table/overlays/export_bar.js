/* global $:false, _:false */
cdb.admin.ExportBarActions = cdb.core.View.extend({
  initialize: function () {
    this.template_base = cdb.templates.getTemplate(this.options.template_base);
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
  className: 'overlay-properties',

  events: {
    'click': 'killEvent'
  },

  initialize: function () {
    this.overlays = this.options.overlays;
    this._setupModel();
    this._addExportDataModel();
  },

  _setupModel: function () {
    this.model = this.options.model;
    this.model.bind('remove', this._remove, this);
  },


  _addExportDataModel: function () {
    this.exportData = new cdb.core.Model(this.model.get('export_data'));
    this.exportData.unbind('change', this._setExportDataModel, this);
    this.exportData.bind('change', this._setExportDataModel, this);
  },

  _setExportDataModel: function () {
    this.model.set('export_data', this.exportData.toJSON());
  },

  _doLocalExport: function () {
    // TODO:
    console.log('_doLocalExport');
  },

  _doAVMMExport: function () {
    // TODO:
    console.log('_doAVMMExport');
  },

  reset: function() {
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

    var destinationField = this.form.getFieldByName('Destination');

    ///////////////////////////////
    // TODO: show destination selector again when implemented
    destinationField.hide();

    /*
    destinationField.on('change', function (event) {
      if (event.val === 'AVMM') {
        self._doAVMMExport();
      } else {
        // local
        self._doLocalExport();
      }
    });
    */
    //////////////////////////////

    var sizeField = this.form.getFieldByName('Size');
    var customSize = this.form.getFieldByName('Custom Size');
    customSize.hide(); // only show when custom size selected

    sizeField.on('change', function (event) {
      cdb.god.trigger('export_size_changed', event.val);
    });
  },

  _remove: function (a, test) {
    cdb.god.unbind('closeDialogs', this._remove, this);
    this.trigger('remove', this);
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

    cdb.god.bind('closeDialogs', this._remove, this);
    return this;
  }

});
