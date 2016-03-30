var cdb = require('cartodb-deep-insights.js');
var template = require('./add-layer.tpl');
var FooterView = require('./footer/footer-view');
var NavigationView = require('./content/navigation-view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = cdb.core.View.extend({

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('model is required');
    if (!opts.createModel) throw new TypeError('createModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._modalModel = opts.modalModel;
    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initBinds: function () {
    this._createModel.bind('addLayerDone', this.close, this);
    this._createModel.bind('change:contentPane', this._onChangeContentView, this);
    // cdb.god.bind('importByUploadData', this.close, this);
    console.log("TODO: importByUploadData cdb.god");
    this.add_related_model(this._createModel);
  },

  _initViews: function () {
    this._navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      userModel: this._userModel,
      routerModel: this._createModel.getVisualizationFetchModel(),
      createModel: this._createModel,
      tablesCollection: this._createModel.getTablesCollection()
    });
    this._navigationView.render();
    this.addView(this._navigationView);

    this._footerView = new FooterView({
      createModel: this._createModel,
      userModel: this._userModel
    });
    this.addView(this._footerView);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _onChangeContentView: function () {
    console.log("TODO: make it work with new TabPane");
    var context = this._createModel.get('contentPane');
    // this._contentPane.active(context);
    // if (pane === 'loading') {
    //   this._footerView.hide();
    // }
    // if (pane !== 'listing') {
    //   this._navigationView.hide();
    // }
  }
});
