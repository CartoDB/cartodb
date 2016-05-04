var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleFormView = require('./style-form/style-form-view');
var StylesFactory = require('./styles-factory');
var CarouselFormView = require('../../components/carousel-form-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerTableModel = this._layerDefinitionModel.layerTableModel;
    this._columnsCollection = this._layerTableModel.columnsCollection;
    this._styleModel = this._layerDefinitionModel._styleModel;
    this._modals = opts.modals;

    if (!this._layerTableModel.get('fetched')) {
      this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderCarousel();
    this._renderForm();
    return this;
  },

  _renderCarousel: function () {
    var carouselCollection = new CarouselCollection(
      _.map(StylesFactory.getStyleTypes(this._layerTableModel), function (type) {
        return {
          selected: this._styleModel.get('type') === type.value,
          val: type.value,
          label: type.label,
          template: function () {
            return type.value;
          }
        };
      }, this)
    );

    carouselCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        this._styleModel.set('type', mdl.getValue());
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./style-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _renderForm: function () {
    var styleForm = new StyleFormView({
      styleModel: this._styleModel,
      layerTableModel: this._layerTableModel
    });
    this.$el.append(styleForm.render().el);
    this.addView(styleForm);
  }

});
