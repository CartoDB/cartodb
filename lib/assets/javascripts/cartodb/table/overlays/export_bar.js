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
    this._addStyleModel();
  },

  _setupModel: function () {
    this.model = this.options.model;
    this.model.bind('remove', this._remove, this);
  },

  _addStyleModel: function () {
    this.style = new cdb.core.Model(this.model.get('style'));

    this.style.unbind('change', this._setStyle, this);
    this.style.bind('change', this._setStyle, this); // every time the style changes, store it back in the main model
  },

  _setStyle: function () {
    this.model.set('style', this.style.toJSON());
  },

  _doLocalExport: function () {
    // TODO:
    console.log('_doLocalExport');
  },

  _doAVMMExport: function () {
    // TODO:
    console.log('_doAVMMExport');
  },

  _addForm: function () {
    var self = this;

    if (!this.form) {
      this.form = new cdb.forms.Form({
        form_data: this.options.form_data,
        model: this.style
      }).on('saved', function () {
        self.trigger('saved', self);
      });

      this.addView(this.form);
      this.$el.append(this.form.render().$el);
    }

    var destinationField = this.form.getFieldByName('Destination');
    destinationField.on('change', function (event) {
      if (event.val === 'AVMM') {
        self._doAVMMExport();
      } else {
        // local
        self._doLocalExport();
      }
    });

    var sizeField = this.form.getFieldByName('Size');
    var customSize = this.form.getFieldByName('Custom Size');
    customSize.hide();
    sizeField.on('change', function (event) {
      if (event.val === 'Custom') {
        customSize.show();
      } else {
        customSize.hide();
      }
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

  showField: function (field) {},

  hideField: function (field) {},

  render: function () {
    this._addForm();

    cdb.god.bind('closeDialogs', this._remove, this);
    return this;
  }

});
