// require('dragster');
const Dropzone = require('dropzone');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const MamufasDialog = require('./mamufas-import-dialog-view');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

/**
 *  Big mamufas to import files
 *  using drag and drop
 *
 */

module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();
    this.model = new Backbone.Model({ visible: false });
  },

  render: function () {
    return this;
  },

  _createDragster: function () {
    if (this.dragster) {
      this._destroyDragster();
    }
    this.dragster = new Dragster(this.$el[0]); // eslint-disable-line
  },

  _createDropzone: function () {
    if (this.dropzone) {
      this._destroyDropzone();
    }
    this.dropzone = new Dropzone(this.$el[0], {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });
  },

  _destroyDragster: function () {
    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
      delete this.dragster;
    }
  },

  _destroyDropzone: function () {
    if (this.dropzone) {
      this.dropzone.destroy();
      delete this.dropzone;
    }
  },

  _initBinds: function () {
    let mamufasDialog;
    let modalModel;

    this.$el.on('dragster:enter', () => {
      modalModel = this._modals.create(function (model) {
        mamufasDialog = new MamufasDialog({
          modalModel: model
        });

        return mamufasDialog;
      });

      this.trigger('dialogOpened');
    });

    this.$el.on('dragster:leave', e => {
      modalModel.destroy();
      this.trigger('dialogClosed');
    });

    this.dropzone.on('drop', event => {
      this.dragster.dragleave(event);
      modalModel.destroy();
      this.dropzone.removeFile(event);

      let files = event.dataTransfer.files;

      if (files && files.length > 0) {
        if (files.length === 1) {
          files = files[0];
        }

        this.trigger('fileDropped', files, this);
      }

      this.trigger('dialogClosed');
    });
  },

  _removeBinds: function () {
    this.$el.off('dragster:enter');
    this.$el.off('dragster:leave');
  },

  enable: function () {
    if (!this.model.get('visible')) {
      this._createDragster();
      this._createDropzone();
      this._initBinds();
      this.model.set('visible', true);
    }
  },

  disable: function () {
    if (this.model.get('visible')) {
      this._removeBinds();
      this._destroyDragster();
      this._destroyDropzone();
      this.model.set('visible', false);
    }
  },

  clean: function () {
    this._removeBinds();
  }
});
