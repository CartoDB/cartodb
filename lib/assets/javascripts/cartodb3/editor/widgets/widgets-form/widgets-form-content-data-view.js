var cdb = require('cartodb.js');
var _ = require('underscore');
var CarouselFormView = require('../../../components/carousel-form-view');
var CarouselCollection = require('../../../components/custom-carousel/custom-carousel-collection');
var WidgetFormFactory = require('./widgets-form-factory');
var WidgetsDataFormView = require('./widgets-form-data-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerTableModel = opts.layerTableModel;

    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._layerTableModel.get('fetched')) {
      this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var carouselCollection = new CarouselCollection(
      _.map(WidgetFormFactory.getDataTypes(this._layerTableModel), function (type) {
        return {
          selected: this._widgetDefinitionModel.get('type') === type.value,
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
        this._widgetDefinitionModel.changeType(mdl.getValue());
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./widgets-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);

    var formWidgetDataView = new WidgetsDataFormView({
      widgetDefinitionModel: this._widgetDefinitionModel,
      layerTableModel: this._layerTableModel
    });
    this.addView(formWidgetDataView);
    this.$el.append(formWidgetDataView.render().el);

    return this;
  }
});
