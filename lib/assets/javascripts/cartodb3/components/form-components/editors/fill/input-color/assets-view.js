var CoreView = require('backbone/core-view');
var template = require('./assets-view.tpl');
var ScrollView = require('../../../../scroll/scroll-view');

var AssetsListView = require('./assets-list-view');

var MakiIcons = require('./assets/maki-icons');
var PinIcons = require('./assets/pin-icons');
var SimpleIcons = require('./assets/simple-icons');

module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onSetImage'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._renderAssets();

    if (this.model.get('image')) {
      this.$('.js-add').removeClass('is-disabled');
    }

    return this;
  },

  _initBinds: function () {
    this.model.on('change:image', this._onChangeModel, this);
  },

  _onChangeModel: function () {
    this.$('.js-add').removeClass('is-disabled');
  },

  _renderAssets: function () {
    this.$el.html(template());

    var view = new ScrollView({
      createContentView: function () {
        var view = new CoreView();

        var pinIcons = new AssetsListView({
          model: this.model,
          title: 'Pin icons',
          icons: PinIcons.icons,
          disclaimer: PinIcons.disclaimer,
          folder: 'pin-maps',
          size: ''
        });

        view.$el.append(pinIcons.render().$el);

        var simpleIcons = new AssetsListView({
          model: this.model,
          title: 'Simple icons',
          icons: SimpleIcons.icons,
          disclaimer: SimpleIcons.disclaimer,
          folder: 'simpleicon',
          size: ''
        });

        view.$el.append(simpleIcons.render().$el);

        var makiIcons = new AssetsListView({
          model: this.model,
          title: 'Maki icons',
          icons: MakiIcons.icons,
          disclaimer: MakiIcons.disclaimer,
          folder: 'maki-icons',
          size: 18
        });

        view.$el.append(makiIcons.render().$el);

        return view;
      }.bind(this)
    });

    this.addView(view);
    this.$('.js-body').append(view.render().el);
  },

  _onSetImage: function (e) {
    this.killEvent(e);
    this.trigger('change', this.model.get('image'), this);
    this._modalModel.destroy(this.model);
  }
});
