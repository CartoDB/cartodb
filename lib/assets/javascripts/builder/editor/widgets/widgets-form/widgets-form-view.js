var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('builder/components/carousel-form-view');
var CarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');
var WidgetFormFactory = require('./widgets-form-factory');
var WidgetsFormFieldsView = require('./widgets-form-fields-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var loadingTemplate = require('builder/editor/layers/panel-loading-template.tpl');

var TIME_SERIES_TYPE = 'time-series';
var REQUIRED_OPTS = [
  'userActions',
  'widgetDefinitionModel',
  'modals',
  'querySchemaModel',
  'configModel',
  'userModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._initBinds();

    this._shouldFetchQuery();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (!this._querySchemaModel.isFetched()) {
      this.$el.html(loadingTemplate());
    } else {
      this._renderCarousel();
      this._renderForm();
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._widgetDefinitionModel, 'change:type', this._renderFormAndValidate);
    this.listenTo(this._querySchemaModel, 'change:status', this.render);
    this.listenTo(this._querySchemaModel, 'change:query', this._shouldFetchQuery);
  },

  _shouldFetchQuery: function () {
    if (this._querySchemaModel.shouldFetch()) {
      this._querySchemaModel.fetch();
    }
  },

  _renderCarousel: function () {
    var filteredDataTypes = this._getFilteredDataTypes();
    var carouselCollection = new CarouselCollection(
      _.map(filteredDataTypes, function (type) {
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
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./widgets-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _getFilteredDataTypes: function () {
    var containsTimeSeries = false;
    var modelCollection = this._widgetDefinitionModel.collection;
    if (modelCollection) {
      containsTimeSeries = modelCollection.any(function (model) {
        return model.get('type') === TIME_SERIES_TYPE;
      });
    }
    var filteredDataTypes = _.filter(WidgetFormFactory.getDataTypes(this._querySchemaModel), function (type) {
      // Do not allow to change the widget to time-series if there is already a time-series widget
      return (!containsTimeSeries ||
              type.value !== TIME_SERIES_TYPE ||
              this._widgetDefinitionModel.get('type') === TIME_SERIES_TYPE);
    }, this);
    return filteredDataTypes;
  },

  _renderFormAndValidate: function () {
    this._renderForm();

    if (this._formView.validateForm() === null) {
      this._userActions.saveWidget(this._widgetDefinitionModel);
    }
  },

  _renderForm: function () {
    if (this._formView) {
      this.removeView(this._formView);
      this._formView.clean();
    }
    this._formView = new WidgetsFormFieldsView({
      userActions: this._userActions,
      widgetDefinitionModel: this._widgetDefinitionModel,
      querySchemaModel: this._querySchemaModel,
      modals: this._modals,
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.addView(this._formView);
    this.$el.append(this._formView.render().el);
  }
});
