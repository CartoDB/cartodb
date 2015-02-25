var $ = require('jquery');
var cdb = require('cartodb.js');
var ImportsCollection = require('../../new_dashboard/background_importer/imports_collection');
var ImportItem = require('../../new_dashboard/background_importer/background_importer_item_view');

/**
 *  Background importer view
 *
 */

module.exports = cdb.core.View.extend({

  className: 'BackgroundImporter',

  events: {
    // 'click .js-hide': 'disable'
  },

  initialize: function() {
    this.user = this.options.user;
    this.items = this.options.items;
    this.router = this.options.router;
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
    this.add_related_model(this.collection);
  },

  _addImport: function(m) {
    var importItem = new ImportItem({
      model: m,
      router: this.router,
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
      if (m.hasFailed()) ++failed;
    });

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
    // this.hide();
    // var self = this;
    // setTimeout(function() {
    //   self._cleanImports();
    // }, 300);
  },

  add: function(imp) {
    if (imp) { this.collection.add(imp) }
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
