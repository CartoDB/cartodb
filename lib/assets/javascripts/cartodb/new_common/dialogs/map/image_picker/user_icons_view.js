var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  _TEXTS: {
  },

  events: {
  },

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model({ value: '' });
    this.createModel = this.options.model;
    this.template = cdb.templates.getTemplate('new_common/dialogs/map/image_picker/simple_icons_template');

    if (!this.options.icons) {
      cdb.log.info('A list of icons is necessary to make the list available');
    }

    this.collection.bind('add remove reset', this.render,  this);

  },

  _renderAssets: function() {

    var items = this.collection.where({ kind: this.options.kind });
    var self = this;

    _(items).each(function(mdl) {
      var item = new cdb.admin.AssetsItem({
        className: 'AssetItem',
        model: mdl
      });
      item.bind('selected', self._selectItem, self);

      self.$('ul').append(item.render().el);
      self.addView(item);
    });

  
  },

  render: function() {
    this._destroyBinds();
    // Set binds
    this._initBinds();

    // clean old views
    this.clearSubViews();

    this.$el.html(this.template());

    this._renderAssets();

    // White shadows...
    var scrolls = new cdb.admin.CustomScrolls({
      el:     this.$('ul'),
      parent: this.$el
    });
    this.addView(scrolls);

    return this;
  },

  _selectItem: function(m) {
    this.model.set('value', m.get('public_url'));
    this.trigger('fileChosen', this);
    this._unselectItems(m);
  },

  // Unselect all images expect the new one 
  _unselectItems: function(m) {
    this.collection.each(function(mdl) {
      if (mdl != m && mdl.get('state') == 'selected') {
        mdl.set('state', 'idle');
      }
    });
  },

  ////////////////////
  // TABS && PANES! //
  ////////////////////

  _setUploadModel: function(d) {
  },

  _initBinds: function() {
  },

  _destroyBinds: function() {
  },

  clean: function() {
    this._destroyBinds();
    cdb.core.View.prototype.clean.call(this);
  }

});
