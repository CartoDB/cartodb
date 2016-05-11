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
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel._styleModel;
    this._modals = opts.modals;

    this._querySchemaModel = opts.querySchemaModel;
    this._queryGeometryModel = opts.queryGeometryModel;

    if (this._querySchemaModel.get('status') === 'unfetched') {
      this._listenQuerySchemaModelChanges();
      this._querySchemaModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderCarousel();
    this._renderForm();
    return this;
  },

  _listenQuerySchemaModelChanges: function () {
    this._querySchemaModel.bind('change:status', function (status) {
      if (this._querySchemaModel.get('status') === 'fetched') {
        this._renderForm();
        this._querySchemaModel.unbind(null, null, this);
      }
    }, this);
    this.add_related_model(this._querySchemaModel);

    this._queryGeometryModel.bind('change:geometry_type', function (status) {
      this.render();
      this._queryGeometryModel.unbind(null, null, this);
    }, this);
    this.add_related_model(this._queryGeometryModel);
  },

  _renderCarousel: function () {
    var carouselCollection = new CarouselCollection(
      _.map(StylesFactory.getStyleTypes(this._queryGeometryModel.get('geometry_type')), function (type) {
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
    if (this._styleForm) {
      this._styleForm.clean();
      this.removeView(this._styleForm);
    }

    this._styleForm = new StyleFormView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      styleModel: this._styleModel,
      querySchemaModel: this._querySchemaModel
    });
    this.$el.append(this._styleForm.render().el);
    this.addView(this._styleForm);
  }

});
