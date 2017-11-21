var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PublicMapDatasetsStatic = require('../../../../javascripts/cartodb/public_map/public_map_datasets_static');
var vizdataJson = require('../../vizdata_sample.json');
var relatedCanonicalJson = require('../../related_canonical_visualizations_sample.json');

var ONE_CANONICAL_VISUALIZATION = relatedCanonicalJson;
var PRIVATE_VISUALIZATION = _.clone(ONE_CANONICAL_VISUALIZATION[0]).privacy = 'PRIVATE';
var VIZDATA = vizdataJson;
var MAP_OWNER_USER = new cdb.admin.User(VIZDATA.permission.owner);

describe('public_map/public_map_datasets_static', function () {
  beforeEach(function () {
    this.$el = $('<div id="PublicMapDatasetsTest"></div>');
  });

  it('should render', function () {
    this.view = new PublicMapDatasetsStatic({
      el: this.$el,
      mapOwnerUser: MAP_OWNER_USER
    });

    this.view.render();

    expect(this.view.el).toBeDefined();
    expect(this.view.template).toBeDefined();
    expect(this.view.$('.PublicMap-secondaryTitle').text()).toEqual('public_map.datasets.title');
  });

  it('should not be shown if there is no datasets', function () {
    this.view = new PublicMapDatasetsStatic({
      el: this.$el,
      mapOwnerUser: MAP_OWNER_USER
    });

    this.view.render();

    expect(this.view.$('.DatasetsList-item').length).toEqual(0);
  });

  it('should show a list with the public datasets', function () {
    this.view = new PublicMapDatasetsStatic({
      el: this.$el,
      mapOwnerUser: MAP_OWNER_USER,
      relatedCanonicalVisualizations: ONE_CANONICAL_VISUALIZATION
    });

    this.view.render();

    expect(this.view.$('.DatasetsList-item').length).toEqual(1);
    expect(this.view.$('.DatasetsList-itemPrimaryInfo > h3').text().trim()).toEqual(ONE_CANONICAL_VISUALIZATION[0].name);
  });

  it('should not be shown if there is no public datasets', function () {
    this.view = new PublicMapDatasetsStatic({
      el: this.$el,
      mapOwnerUser: MAP_OWNER_USER,
      relatedCanonicalVisualizations: [PRIVATE_VISUALIZATION],
      relatedCanonicalVisualizationsCount: 1
    });

    this.view.render();

    expect(this.view.$('.DatasetsList-item').length).toEqual(1);
  });

  it('should show both public datasets and a the count of non public datasets', function () {
    this.view = new PublicMapDatasetsStatic({
      el: this.$el,
      mapOwnerUser: MAP_OWNER_USER,
      relatedCanonicalVisualizations: [
        ONE_CANONICAL_VISUALIZATION[0],
        PRIVATE_VISUALIZATION,
        PRIVATE_VISUALIZATION
      ],
      relatedCanonicalVisualizationsCount: 3
    });

    this.view.render();

    expect(this.view.$('.DatasetsList-item').length).toEqual(2);
  });

  afterEach(function () {
    this.view.clean();
    window.defaultFallbackBasemapTemplateUrl = undefined;
    delete window.defaultFallbackBasemapTemplateUrl;
  });
});
