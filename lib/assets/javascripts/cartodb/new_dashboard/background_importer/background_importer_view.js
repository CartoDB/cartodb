var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var ImportsCollection = require('../../new_dashboard/background_importer/imports_collection');
var ImportItem = require('../../new_dashboard/background_importer/background_importer_item_view');
var ImportLimitItem = require('../../new_dashboard/background_importer/background_importer_limit_view');
var ImportsModel = require('../../new_common/imports_model');

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
    this.model = new cdb.core.Model();
    this.collection = new ImportsCollection(null, { user: this.user });
    this.template = cdb.templates.getTemplate('new_dashboard/views/background_importer/background_importer_view');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  },

  _initBinds: function() {
    this.collection.bind('add', this._addImport, this);
    this.collection.bind('add remove', this._checkCollectionSize, this);
    this.collection.bind('change add remove reset', this._checkImports, this);
    cdb.god.bind('datasetSelected remoteSelected', this._addDataset, this);
    cdb.god.bind('fileDropped', this._onDroppedFile, this);
    this.add_related_model(this.collection);
    this.add_related_model(cdb.god);
  },

  _addImport: function(m) {
    var importItem = new ImportItem({
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

  _checkImports: function() {
    var failed = 0;

    this.collection.each(function(m) {
      if (m.hasFailed()) {
        ++failed;
      }
    });

    // The args will depend on what kind of event calls it (see binds)
    var c = arguments[1];
    if (c && c.changes && c.changes.state) {
      // Since c.changes exists the 1st argument is the model (instance of ImportsModel)
      var mdl = arguments[0];

      // Redirect to dataset/map url?
      if (( this.collection.size() - failed ) === 1 &&
          mdl && mdl.shouldRedirectAfterComplete() &&
          !this.model.get('importLimit')) {
        this._goTo(mdl);
      }
    }

    // Badge changes
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

  _cleanImports: function() {
    this.collection.each(function(m) {
      m.trigger('remove', m);
    }, this);
    this.collection.reset();
    this._checkImports();
  },

  enable: function() {
    this.collection.pollCheck();
  },

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
        upload: {
          type: 'file',
          value: files,
          create_vis: this.createVis
        }
      });
    }
  },

  _addImportsItem: function(d) {
    if (this.collection.canImport()) {
      this._removeLimitItem();
    } else {
      this._addLimitItem();
      return false;
    }

    var attrs = _.omit(d, 'upload');
    var imp = new ImportsModel(attrs, {
      upload: d.upload,
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

  _goTo: function(mdl) {
    var url = '';

    var vis = mdl.importedVis();
    if (vis) {
      url = encodeURI(vis.viewUrl(this.user).edit());
    }

    this._redirect(url);
  },

  _redirect: function(url) {
    window.location = url;
  },

  clean: function() {
    this.disable();
    this.elder('clean');
  }

});
