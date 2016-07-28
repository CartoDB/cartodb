var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var template = require('./basemap-content.tpl');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapsCollection = require('./basemap-content-views/basemaps-collection');
var BasemapCategoriesView = require('./basemap-content-views/basemap-categories-view');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');

var BASEMAP_ICONS = {
  gmaps: require('./basemap-content-views/basemap-icons/basemap-gmaps.tpl'),
  carto: require('./basemap-content-views/basemap-icons/basemap-carto.tpl'),
  stamen: require('./basemap-content-views/basemap-icons/basemap-stamen.tpl'),
  color: require('./basemap-content-views/basemap-icons/basemap-color.tpl'),
  mapbox: require('./basemap-content-views/basemap-icons/basemap-mapbox.tpl'),
  custom: require('./basemap-content-views/basemap-icons/basemap-custom.tpl'),
  here: require('./basemap-content-views/basemap-icons/basemap-here.tpl')
};

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.basemaps) throw new Error('basemaps is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();
    this._userLayersCollection = this._userModel.layers;

    this._initCollections(opts.basemaps);
    this._initBinds();
  },

  _initCollections: function (basemaps) {
    this._basemapsCollection = new BasemapsCollection();

    // google maps basemaps not supported yet
    var basemapList = _.clone(basemaps);
    delete basemapList['GMaps'];
    delete basemapList['Google'];

    // basemaps defined in app_config.yml
    _(basemapList).each(function (categoryBasemaps, category) {
      _.map(categoryBasemaps, function (b) {
        this._basemapsCollection.add(_.extend(b, {
          category: category,
          selected: this._baseLayer.get('className') === b.className
        }), {
          parse: true,
          silent: true
        });
      }, this);
    }, this);

    // userlayers basemaps
    _.map(this._userModel.get('layers'), function (l) {
      this._basemapsCollection.add(l, {
        parse: true,
        silent: true
      });
    }, this);

    this._basemapsCollection.add({
      default: false,
      color: this._baseLayer.get('color') || '',
      image: this._baseLayer.get('image') || '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: this._baseLayer.get('className') === 'plain',
      val: 'plain',
      label: 'plain',
      template: function () {
        return 'plain';
      }
    }, {
      silent: true
    });

    this._categoriesCollection = new CarouselCollection(
      _.map(this._basemapsCollection.getCategories(), function (category) {
        return {
          selected: this._getBaseLayerCategory() === category,
          val: category,
          label: category,
          template: function (opts) {
            var template = this._getTemplateForCategory(category.toLowerCase());
            return template(opts);
          }.bind(this)
        };
      }, this)
    );
  },

  _getTemplateForCategory: function (categoryName) {
    var template = BASEMAP_ICONS[categoryName.toLowerCase()];
    if (!template) {
      template = function () {
        return categoryName;
      };
    }
    return template;
  },

  _initBinds: function () {
    this._categoriesCollection.bind('change:selected', this._onChangeSelectedCategory, this);
    this.add_related_model(this._categoriesCollection);

    this._basemapsCollection.bind('remove', function (mdl) {
      var userLayersMdl = this._userLayersCollection.get(mdl.get('userLayerId'));
      userLayersMdl.destroy();
    }, this);
    this._basemapsCollection.bind('add remove', function () {
      this._renderSelect();
    }, this);
    this._basemapsCollection.bind('change:selected', this._onChangeSelectedBasemap, this);
    this.add_related_model(this._basemapsCollection);

    this._layerDefinitionsCollection.bind('change', function () {
      this._renderHeader();

      this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();
      this._updateSelectedCategory(this._baseLayer.get('category'));
    }, this);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _updateSelectedCategory: function (cat) {
    var oldCategory = this._categoriesCollection.getSelected();
    var newCategory = this._categoriesCollection.find(function (mdl) {
      return mdl.get('val') === cat;
    });

    if (oldCategory.getName() === newCategory.getName()) return;

    oldCategory && oldCategory.set({ selected: false });
    newCategory.set({ selected: true });
  },

  _getSelectedCategory: function () {
    var selectedCategory = this._categoriesCollection.find(function (mdl) {
      return mdl.get('selected');
    }, this);

    return selectedCategory && selectedCategory.get('val');
  },

  _getBaseLayerCategory: function () {
    // baseLayer has no category at map creation, or if baseLayer is Plain
    var category = this._basemapsCollection.getDefaultCategory();

    if (this._baseLayer.get('category')) {
      category = (this._baseLayer.get('category') === 'CartoDB') ? 'CARTO' : this._baseLayer.get('category');
    } else if (this._baseLayer.get('type') === 'Plain') {
      category = 'Color';
    }

    return category;
  },

  _initViews: function () {
    this._renderHeader();
    this._renderCategories();
    this._renderSelect();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new BasemapHeaderView({
      model: this._layerDefinitionsCollection.getBaseLayer(),
      category: this._getBaseLayerCategory()
    });
    this.addView(this._headerView);
    this.$('.js-basemapHeader').html(this._headerView.render().el);
  },

  _renderCategories: function () {
    if (this._categoriesView) {
      this.removeView(this._categoriesView);
      this._categoriesView.clean();
    }

    this._categoriesView = new BasemapCategoriesView({
      categoriesCollection: this._categoriesCollection
    });

    this.addView(this._categoriesView);
    this.$('.js-basemapCategory').html(this._categoriesView.render().el);
  },

  _onChangeSelectedBasemap: function (mdl, isSelected) {
    if (isSelected) {
      this._userLayersCollection.updateSelected(mdl.get('userLayerId'));
    }
  },

  _onChangeSelectedCategory: function (mdl, isSelected) {
    if (isSelected) {
      this._renderCategories();
      this._renderSelect();
    }
  },

  _renderSelect: function () {
    if (this._selectView) {
      this.removeView(this._selectView);
      this._selectView.clean();
    }

    this._selectView = new BasemapSelectView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      selectedCategoryVal: this._getSelectedCategory(),
      userLayersCollection: this._userLayersCollection,
      modals: this._modals
    });
    this.addView(this._selectView);
    this.$('.js-basemapSelect').html(this._selectView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
