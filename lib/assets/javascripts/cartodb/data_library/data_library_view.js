var cdb = require('cartodb.js');
var ViewFactory = require('../common/view_factory');
var MapCardPreview = require('../common/views/mapcard_preview');
var randomQuote = require('../common/view_helpers/random_quote');
var VisualizationDropdown = require('./data_library_dropdown');
var DataLibraryHeader = require('./data_library_header');
var DatasetsCollection = require('./datasets_collection');

module.exports = cdb.core.View.extend({
  tagName: 'div',

  // _SORT: {
  //   'administrative-regions': 'Administrative regions',
  //   'cultural-datasets': 'Cultural datasets',
  //   'physical-datasets': 'Physical datasets',
  //   'historic': 'Historic',
  //   'building-footprints': 'Building footprints',
  //   'us-census': 'US Census'
  // },

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function() {
    this._initTemplates();

    this.model = new cdb.core.Model({
      q: '',
      order: 'updated_at',
      page: 1,
      tags: [],
      bbox: [],
      source: [],
      activeMap: false
    });

    this.collection = new DatasetsCollection();
    this._initBindings();
  },

  render: function() {
    this.$el.html(this.template());
    this._renderItems();
    this._renderLoader();
    this._setupVisualizationDropdown();
    this._setupDataLibraryHeader();
    this._fetchItems();

    return this;
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('data_library/data_library_template');
    this.mapTemplate = cdb.templates.getTemplate('data_library/dataset_item_template');
    this.loaderTemplatePath = 'data_library/loading';
  },
  //
  // _initBindings: function() {
  //   this.model.bind('change:show_more', this._onChangeShowMore, this);
  //   this.model.bind('change:show_loader', this._onChangeShowLoader, this);
  //   this.model.bind('change:vis_count', this._onChangeVisCount, this);
  //   this.model.bind('change:order', this._onChangeOrderBy, this);
  //   this.model.bind('change:tags', this._onChangeTag, this);
  //   this.model.bind('change:bounds', this._onChangeBounds, this);
  //   this.model.bind('change:show_countries', this._onChangeCountries, this);
  // },

  _initBindings: function() {
    this.collection.bind('reset', function() {
      this._hideLoader();
      this._renderVisualizations();
      // Check if view more button should be enabled

    }, this); // And hide loader
    this.collection.bind('loading', function() {
      // Show loader
      this._showLoader();
    }, this);
    this.model.bind('change:bounds', this._onChangeBounds, this);
  },

  _setupDataLibraryHeader: function() {
    this.dataLibraryHeader = new DataLibraryHeader({
      model: this.model
    });

    this.addView(this.dataLibraryHeader);
    $('.js-Header--datalibrary').append(this.dataLibraryHeader.render().el);
    this.dataLibraryHeader.load();
  },

  _setupVisualizationDropdown: function() {
    this.visualizationDropdown = new VisualizationDropdown({
      target: this.$('.js-dropdown'),
      horizontal_position: 'horizontal_left',
      horizontal_offset: -110,
      tick: 'center',
      model: this.model,
      position: 'offset',
      vertical_offset: 0
    });

    this.addView(this.visualizationDropdown);
    cdb.god.bind('closeDialogs', this.visualizationDropdown.hide, this.visualizationDropdown);
    this.add_related_model(cdb.god);
    $('body').append(this.visualizationDropdown.render().el);
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('data_library/data_library_template');
    this.mapTemplate = cdb.templates.getTemplate('data_library/dataset_item_template');
    this.loaderTemplatePath = 'data_library/loading';
  },

  _initModels: function() {
    this.model = new cdb.core.Model({
      type: 'table',
      page: 1,
      order: 'likes',
      tags: null,
      size: 'small',
      bounds: null,
      show_countries: false
    });

    this.collection = new Visualizations();
    this.collection.bind('reset', this._renderVisualizations, this);
  },

  _onChangeCountries: function() {
    if (this.model.get('show_countries')) {
      this.dataLibraryHeader.show();
    } else {
      this.dataLibraryHeader.hide();
    }
  },

  _hideLoader: function() {
    this.loader && this.loader.hide();
  },

  _showLoader: function() {
    this.loader && this.loader.show();
  },

  _onChangeVisCount: function() {
    if (this.model.get('vis_count') >= this.collection.total_entries) {
      this.model.set({ show_more: false });
    } else {
      this.model.set({ show_more: true });
    }
  },

  _onChangeShowMore: function() {
    this.$('.js-more').toggleClass('is-hidden', !this.model.get('show_more'));
  },

  _renderItems: function() {

  },

  _renderLoader: function() {
    this.loader = ViewFactory.createByTemplate(this.loaderTemplatePath, {
      title: this._LOADER_TITLE,
      quote: randomQuote()
    });

    this.$el.append(this.loader.render().$el);
  },

  _selectTag: function(tag) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 150 }, { duration: 250, complete: function() {
      self.model.set({ tags: tag });
    }});
  },

  _sort: function(method) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 150 }, { duration: 250, complete: function() {
      self.model.set({ order: method });
    }});
  },

  _resetOptions: function() {

  },

  _fetchItems: function() {
    var opts = {
      type: "table",
      order: this.model.get('order'),
      page: this.model.get('page'),
      tags: this.model.get('tags')
    };
    var bbox = this.model.get('bbox');

    if (!_.isEmpty(bbox)) {
      opts.bbox = bbox.join(',');
    }

    this.collection.options.set(opts);
    this.collection.fetch();
  },

  _getGeometryType: function(geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function(type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });

    } else {
      return null;
    }
  },

  _getDatasetSize: function(size) {
    return size ? cdb.Utils.readablizeBytes(size, true).split(' ') : 0;
  },

  _renderVisualizations: function() {
    this.model.set({
      vis_count: this.model.get('vis_count') + this.collection.length,
      show_loader: false,
      show_more: true,
      show_filters: true
    });

    this.collection.each(function(item) {
      var template = this.mapTemplate;

      var el = template({
        vis: item.attributes,
        date: this.model.get('order') === 'updated_at' ? item.get('updated_at') : item.get('created_at'),
        datasetSize: this._getDatasetSize(item.get('table')['size']),
        geomType: this._getGeometryType(item.get('table')['geometry_types']),
        account_host: cdb.config.get('account_host')
      });

      this.$('.js-items').append(el);

      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');

      if (!item.get('rendered_' + this.model.get('size'))) {
        this._renderStaticMap(item, $item);
      }
    }, this);
  },

  _renderStaticMap: function(vis, $el) {
    var visId = vis.get('id');
    var username = vis.get('permission').owner.username;
    var className = 'is-' + this.model.get('size');

    if (visId && username) {
      vis.set('rendered_' + this.model.get('size'), true);

      this.addView(
        new MapCardPreview({
          el: $el.find('.js-header'),
          width: 298,
          height: 220,
          username: username,
          visId: visId,
          className: className,
          mapsApiHost: cdb.config.getMapsApiHost()
        }).load()
      );
    }
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.model.set('page', this.model.get('page') + 1);
    this._fetchItems();
  },

  _onChangeTag: function() {
    var tag = (this.model.get('tags') === null) ? 'Category' : this._SORT[this.model.get('tags')];

    this.$('.js-dropdownLabel').text(tag);
    this._fetchItems(true);
  },

  _onChangeBounds: function() {
    this._fetchItems(true);
  }

});
