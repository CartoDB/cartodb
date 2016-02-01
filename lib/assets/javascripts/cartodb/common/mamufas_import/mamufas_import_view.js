var cdb = require('cartodb.js-v3');
var MamufasDialog = require('./mamufas_import_dialog_view');

/**
 *  Big mamufas to import files
 *  using drag and drop
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model({ visible: false });
  },

  render: function() {
    return this;
  },

  _createDragster: function() {
    if (this.dragster) {
      this._destroyDragster();
    }
    this.dragster = new Dragster(this.$el[0]);
  },

  _createDropzone: function() {
    if (this.dropzone) {
      this._destroyDropzone();
    }
    this.dropzone = new Dropzone(this.$el[0], {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });
  },

  _destroyDragster: function() {
    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
      delete this.dragster;
    }
  },

  _destroyDropzone: function() {
    if (this.dropzone) {
      this.dropzone.destroy();
      delete this.dropzone;
    }
  },

  _initBinds: function() {
    var self = this;
    var mamufas = new MamufasDialog({ clean_on_hide: true });

    this.$el.on( "dragster:enter", function (e) {
      mamufas.appendToBody();
    });

    this.$el.on( "dragster:leave", function (e) {
      mamufas.hide();
    });

    this.dropzone.on("drop", function (ev) {
      self.dragster.dragleave(ev);
      mamufas.hide();
      self.dropzone.removeFile(ev);

      var files = ev.dataTransfer.files;
      if (files && files.length > 0) {
        if (files.length === 1) { files = files[0] }
        cdb.god.trigger('fileDropped', files, this);
      }
    });
  },

  _removeBinds: function() {
    this.$el.off("dragster:enter");
    this.$el.off("dragster:leave");
  },

  enable: function() {
    if (!this.model.get('visible')) {
      this._createDragster();
      this._createDropzone();
      this._initBinds();
      this.model.set('visible', true);
    }
  },

  disable: function() {
    if (this.model.get('visible')) {
      this._removeBinds();
      this._destroyDragster();
      this._destroyDropzone();
      this.model.set('visible', false);
    }
  },

  clean: function() {
    this._removeBinds();
    this.elder('clean');
  }
});
