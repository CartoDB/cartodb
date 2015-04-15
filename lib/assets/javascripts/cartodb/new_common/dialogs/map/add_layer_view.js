var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var LoadingView = require('../../views/loading_view');
var CreateListing = require('../create/create_listing');
var FooterView = require('./add_layer/footer_view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = BaseDialog.extend({

  // TODO: CreateDialog necessary?
  // className: 'Dialog is-opening CreateDialog',

  initialize: function() {
    this.elder('initialize');
    if (!this.model) {
      throw new TypeError('model is required');
    }
    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    this._template = cdb.templates.getTemplate('new_common/dialogs/map/add_layer_template');
    this._initBinds();
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    this.$('.js-footer').append(this._footerView.render().el);
    return this;
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    return this._template({
    });
  },

  // implements cdb.ui.common.Dialog.prototype.ok, called when a .js-ok button is clicked.
  ok: function() {
    // datasets and form scratch handled through model directly, for now this method is only called for import view
    // TODO: implement
    alert('TBD import selected URL or file, and create layer afterwards');
  },

  _initBinds: function() {
    this.model.bind('addLayerDone', this.hide, this);
    this.model.bind('change:contentPane', this._onChangeContentView, this);
    cdb.god.bind('remoteSelected', this.close, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.$('.js-content-container')
    });
    this.addView(this._contentPane);

    this._addTab('listing',
      new CreateListing({
        createModel: this.model,
        user: this.options.user
      })
    );

    this._addTab('loading',
      new LoadingView({
        model: this.model
      })
    );

    this._footerView = new FooterView({
      model: this.model
    });
    this.addView(this._footerView);
  },

  _addTab: function(name, view) {
    view.render();
    this._contentPane.addTab(name, view, {
      active: name === this.model.get('contentPane')
    });
    this.addView(view);
  },

  _onChangeContentView: function() {
    this._contentPane.active(this.model.get('contentPane'));
  }

});
