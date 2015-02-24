var $ = require('jquery');
var cdb = require('cartodb.js');
var MamufasDialog = require('./dialogs/mamufas_import_dialog_view');

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
    this._initViews();
    return this;
  },

  _initViews: function() {
    this._createDialog();
  },

  _createDialog: function() {
    this.mamufasDialog = new MamufasDialog();
  },

  _destroyDialog: function(d) {
    if (this.mamufasDialog) this.mamufasDialog.clean();
  },

  _initBinds: function() {
    var $body = this.$el;
    var self = this;

    $body.on('dragenter dragleave', function (e) {
      e.preventDefault();

      if (!self.model.get('visible')) {
        self._createDialog();
        self.model.set('visible', true);
        self.mamufasDialog.appendToBody();
      }

      var $hierarchy = $(e.target).parents().add(e.target),
          $droppables = $hierarchy.filter('.MamufasDialog'),
          countOffset = e.type === 'dragenter' ? 1 : -1;

      $droppables.add($body).each(function () {
        var dragCount = ($(this).data('dragCount') || 0) + countOffset;

        $(this).data('dragCount', dragCount);

        if (dragCount === 0) {
          self.mamufasDialog.bind('hide', self._destroyDialog, self);
          self.mamufasDialog.close();
          self.model.set('visible', false);
        }
      });
    });

    $body.on('dragover', function (e) {
      e.preventDefault();

      var isDroppable = false;
      self.mamufasDialog.$el.each(function () {
        if($(this).data('dragCount') > 0)
          isDroppable = true;
      });
    });

    $body.on('drop', function (e) {
      e.preventDefault();
      var files = e.originalEvent.dataTransfer.files;
      if (files && files.length > 0) {
        if (files.length === 1) { files = files[0] }
        self.trigger('onDrop', files, this);
      }

      self.mamufasDialog.bind('hide', self._destroyDialog, self);
      self.mamufasDialog.close();
      self.model.set('visible', false);
      self.mamufasDialog.$el.add($body).removeData('dragCount');
    });
  },

  _removeBinds: function() {
    this.$el.off('dragenter dragleave');
    this.$el.off('dragover');
    this.$el.off('drop');
  },

  enable: function() {
    this._initBinds();
  },

  disable: function() {
    this._removeBinds();
    this._destroyDialog();
  },

  clean: function() {
    this._removeBinds();
    this._destroyDialog();
    this.elder('clean');
  }
});