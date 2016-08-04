var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../components/carousel-form-view');
var CarouselCollection = require('../../../components/custom-carousel/custom-carousel-collection');
var WidgetFormFactory = require('./widgets-form-factory');
var WidgetsFormFieldsView = require('./widgets-form-fields-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._userActions = opts.userActions;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._initBinds();
    this._querySchemaModel.fetch();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _initBinds: function () {
    this._widgetDefinitionModel.on('change:type', this._renderForm, this);
    this.add_related_model(this._widgetDefinitionModel);

    this._querySchemaModel.on('change:status', this.render, this);
    this.add_related_model(this._querySchemaModel);
  },

  _renderCarousel: function () {
    var carouselCollection = new CarouselCollection(
      _.map(WidgetFormFactory.getDataTypes(this._querySchemaModel), function (type) {
        return {
          selected: this._widgetDefinitionModel.get('type') === type.value,
          val: type.value,
          label: type.label,
          template: function () {
            return (type.iconTemplate && type.iconTemplate({ makeItBig: true })) || type.value;
          }
        };
      }, this)
    );

    carouselCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        this._widgetDefinitionModel.changeType(mdl.getValue());
        this._userActions.saveWidget(this._widgetDefinitionModel);
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./widgets-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _renderForm: function () {
    if (this._formView) {
      this.removeView(this._formView);
      this._formView.clean();
    }
    this._formView = new WidgetsFormFieldsView({
      userActions: this._userActions,
      widgetDefinitionModel: this._widgetDefinitionModel,
      querySchemaModel: this._querySchemaModel
    });
    this.addView(this._formView);
    this.$el.append(this._formView.render().el);
  }
});
