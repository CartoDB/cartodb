var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var cdb = require('cartodb.js');
var template = require('./add-layer.tpl');

// var CreateListing = require('../create/create_listing');
// var FooterView = require('./add_layer/footer_view');
// var ViewFactory = require('../../view_factory');
// var randomQuote = require('../../view_helpers/random_quote');
// var NavigationView = require('../create/listing/navigation_view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = cdb.core.View.extend({

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('model is required');
    if (!opts.addLayerModel) throw new TypeError('addLayerModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._modalModel = opts.modalModel;
    this._addLayerModel = opts.addLayerModel;
    this._userModel = opts.userModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(template());
    this._initViews();
  },

  _initBinds: function () {
    this._addLayerModel.bind('addLayerDone', this.close, this);
    this._addLayerModel.bind('change:contentPane', this._onChangeContentView, this);
    // cdb.god.bind('importByUploadData', this.close, this);
    console.log("TODO: importByUploadData cdb.god");
    this.add_related_model(this._addLayerModel);
  },

  _initViews: function () {
    // this.$('.js-footer').append(this._footerView.render().el);
  }

  /*
  initialize: function () {
    this.elder('initialize');
    if (!this.model) {
      throw new TypeError('model is required');
    }
    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    this._template = cdb.templates.getTemplate('common/dialogs/map/add_layer_template');
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

  _initBinds: function() {
    this.model.bind('addLayerDone', this.close, this);
    this.model.bind('change:contentPane', this._onChangeContentView, this);
    cdb.god.bind('importByUploadData', this.close, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.$('.js-content-container')
    });
    this.addView(this._contentPane);

    this._navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      user: this.options.user,
      routerModel: this.model.visFetchModel,
      createModel: this.model,
      collection: this.model.collection
    });
    this._navigationView.render();
    this.addView(this._navigationView);

    this._addTab('listing',
      new CreateListing({
        createModel: this.model,
        user: this.options.user
      })
    );
    this._addTab('creatingFromScratch',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Creating empty dataset…',
        quote: randomQuote()
      })
    );
    this._addTab('addingNewLayer',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Adding new layer…',
        quote: randomQuote()
      })
    );
    this._addTab('addLayerFailed',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not add layer'
      })
    );
    this._contentPane.active(this.model.get('contentPane'));

    this._footerView = new FooterView({
      model: this.model,
      user: this.options.user
    });
    this.addView(this._footerView);
  },

  _addTab: function(name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  },

  _onChangeContentView: function() {
    var pane = this.model.get('contentPane');
    this._contentPane.active(pane);
    if (pane === 'loading') {
      this._footerView.hide();
    }
    if (pane !== "listing") {
      this._navigationView.hide();
    }
  }

  */
});
