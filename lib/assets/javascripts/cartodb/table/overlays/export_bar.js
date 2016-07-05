/* global $:false, _:false */
cdb.admin.ExportBarActions = cdb.core.View.extend({
  events: {
    'click .do_export': '_doExport',
    'click .cancel': '_cancel'
  },

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

  _doExport: function () {
      console.log('export');
  },

  _cancel: function () {
      console.log('cancel');
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
    this.model.bind('remove', this.remove, this);
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

  /*
   * When resizer handles dragged, update the text box sizes
   */
  updateSize: function(width, height) {
    //set in views
    var customSize = this.form.getFieldByName('Custom Size');
    this.widthInput = customSize.find('input')[0];
    this.heightInput = customSize.find('input')[1];

    this.widthInput.value = width;
    this.heightInput.value = height;

    // set on model
    this.exportData.width = width;
    this.exportData.height = height;
    this._setExportDataModel();
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

    setTimeout(function() {
      customSize = self.form.getFieldByName('Custom Size');
      customSize.on('change', function(event) {
        self.trigger('custom_size_changed',
                     customSize.find('input')[0].value,
                     customSize.find('input')[1].value);
      });
    }, 250);

    sizeField.on('change', function (event) {
      self.trigger('export_size_changed', event.val);
    });
  },

  remove: function () {
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
    return this;
  }

});
