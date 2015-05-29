var $ = require('jquery');
var cdb = require('cartodb.js');
var ImportItem = require('./background_importer_item_view');
var ImportLimitItem = require('./background_importer_limit_view');
var ImportsModel = require('./imports_model');

/**
 *  Background importer view
 *
 */

module.exports = cdb.core.View.extend({

  className: 'BackgroundImporter',

  events: {},

  initialize: function() {
    this.user = this.options.user;
    this.items = this.options.items;
    this.createVis = this.options.createVis;
    this.collection = this.model.importsCollection;
    this.template = cdb.templates.getTemplate('common/background_importer/background_importer');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  },

  _initBinds: function() {
    this.collection.bind('add', this._addImport, this);
    this.collection.bind('add remove', this._checkCollectionSize, this);
    this.collection.bind('all', this._updateBadges, this);
    cdb.god.bind('importByUploadData', this._addDataset, this);
    cdb.god.bind('fileDropped', this._onDroppedFile, this);
    this.add_related_model(this.collection);
    this.add_related_model(cdb.god);
  },

  _addImport: function(m) {
    var importItem = new ImportItem({
      showSuccessDetailsButton: this.model.get('showSuccessDetailsButton'),
      model: m,
      user: this.user
    });

    importItem.bind('remove', function(mdl) {
      this.collection.remove(mdl);
    }, this);

    importItem.bind('completed', function(mdl) {
      this.items.fetch();
      this.user.fetch();
    }, this);

    this.$('.BackgroundImporter-list').prepend(importItem.render().el);
    this.addView(importItem);

    this.enable();
  },

  _checkCollectionSize: function() {
    if (this.collection.size() > 0) {
      this.show();
    } else {
      this.hide();
    }
  },

  _updateBadges: function() {
    var failed = this.collection.failedItems().length;

    if (this.$('.BackgroundImporter-headerBadgeCount').length === 0 && failed > 0) {
      var $span = $('<span>').addClass("BackgroundImporter-headerBadgeCount Badge Badge--negative").text(failed);
      this.$('.BackgroundImporter-headerBadge')
        .append($span)
        .addClass('has-failures');
    } else if (this.$('.BackgroundImporter-headerBadgeCount').length > 0 && failed > 0) {
      this.$('.BackgroundImporter-headerBadgeCount').text(failed);
    } else if (failed === 0) {
      this.$('.BackgroundImporter-headerBadgeCount').remove();
      this.$('.BackgroundImporter-headerBadge').removeClass('has-failures');
    }
  },

  // Enable background polling checking
  // ongoing imports
  enable: function() {
    this.collection.pollCheck();
  },

  // Disable/stop background polling
  disable: function() {
    this.collection.destroyCheck();
  },

  _addDataset: function(d) {
    if (d) {
      this._addImportsItem(d);
    }
  },

  _onDroppedFile: function(files) {
    if (files) {
      this._addImportsItem({
        type: 'file',
        value: files,
        create_vis: this.createVis
      });
    }
  },

  _addImportsItem: function(uploadData) {
    if (this.collection.canImport()) {
      this._removeLimitItem();
    } else {
      this._addLimitItem();
      return false;
    }

    var imp = new ImportsModel({}, {
      upload: uploadData,
      user: this.user
    });
    this.collection.add(imp);
  },

  _addLimitItem: function() {
    if (!this.model.get('importLimit')) {
      var v = new ImportLimitItem({
        user: this.user
      });
      this.$('.BackgroundImporter-list').prepend(v.render().el);
      this.addView(v);
      this.model.set('importLimit', v);
    }
  },

  _removeLimitItem: function() {
    var v = this.model.get('importLimit');
    if (v) {
      v.clean();
      this.removeView(v);
      this.model.unset('importLimit');
    }
  },

  show: function() {
    this.$el.addClass('is-visible');
  },

  hide: function() {
    this.$el.removeClass('is-visible');
  },

  clean: function() {
    this.disable();
    this.elder('clean');
  }

});
