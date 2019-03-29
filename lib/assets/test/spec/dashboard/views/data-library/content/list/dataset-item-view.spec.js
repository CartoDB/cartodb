const _ = require('underscore');
const Backbone = require('backbone');
const DatasetItemView = require('dashboard/views/data-library/content/list/dataset-item-view');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/data-library/content/list/dataset-item-view', function () {
  let view, model;

  const createViewFn = function (options) {
    model = new Backbone.Model({
      id: '13_37',
      table: { size: 10 },
      display_name: 'Dataset display name',
      name: 'Dataset no-display name',
      permission: {
        owner: { username: 'rick' }
      },
      created_at: 1519642909379,
      updated_at: 1519542909379
    });

    const viewOptions = Object.assign({}, { model, configModel }, options);
    const view = new DatasetItemView(viewOptions);

    return view;
  };

  afterEach(function () {
    if (view) {
      view.clean();
      view = undefined;
    }
  });

  it('throws an error when configModel is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        configModel: undefined
      });
    };

    expect(viewFactory).toThrowError('configModel is required');
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();

      spyOn(view, '_renderMapThumbnail');
      spyOn(view, '_getDatasetSize').and.returnValue(['24', 'kB']);
      spyOn(view, '_getGeometryType').and.returnValue('point');
      spyOn(Date, 'now').and.returnValue(1519643909379);

      view.render();
    });

    it('should call _renderMapThumbnail', function () {
      expect(view._renderMapThumbnail).toHaveBeenCalled();
    });

    it('renders the display name of the dataset', function () {
      expect(view.$el.html()).toContain(model.get('display_name'));
    });

    it('renders the name of the dataset if there is no display name', function () {
      model.unset('display_name');

      expect(view.$el.html()).toContain(model.get('name'));
    });

    it('should render the datasetSize', function () {
      expect(view.$('.MapCardIcon-counter').text()).toEqual('24');
      expect(view.$('.MapCardIcon-label').text()).toEqual('kB');
    });

    it('should render the created_at date by default', function () {
      expect(view.$('.DefaultTimeDiff').text()).toContain('17 minutes ago');
    });

    it('should render the updated_at date if vis is ordered by updated_at', function () {
      model.set('order', 'updated_at');

      view.render();

      expect(view.$('.DefaultTimeDiff').text()).toContain('a day ago');
    });

    it('should add a class based on the geomType', function () {
      expect(view.$('.is--pointDataset').length).toBe(1);
    });
  });

  describe('._renderMapThumbnail', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should add the thumbnail as subview', function () {
      expect(_.size(view._subviews)).toBe(0);

      view._renderMapThumbnail();

      expect(_.size(view._subviews)).toBe(1);
    });

    it('should call loadUrl if imageURL is defined', function () {
      const imageURL = 'http://wadus.com/test.jpg';
      view.imageURL = imageURL;
      spyOn(MapCardPreview.prototype, 'loadURL');

      view._renderMapThumbnail();

      expect(MapCardPreview.prototype.loadURL).toHaveBeenCalledWith(imageURL);
    });

    it('should call load if imageURL is not defined', function () {
      spyOn(MapCardPreview.prototype, 'load');

      view._renderMapThumbnail();

      expect(MapCardPreview.prototype.load).toHaveBeenCalled();
    });

    it('should set the imageURL after load', function () {
      const url = 'http://newurl-wadus.com';
      view._renderMapThumbnail();
      const mapCardView = _.values(view._subviews)[0];
      mapCardView.trigger('loaded', url);

      expect(view.imageURL).toEqual(url);
    });
  });

  describe('._getGeometryType', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should return undefined if there is no geomTypes', function () {
      expect(view._getGeometryType()).toBeUndefined();
    });

    it('should return the first dataset geomType if is valid', function () {
      expect(view._getGeometryType(['ST_Point'])).toEqual('point');
    });
  });

  describe('._getDatasetSize', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should return 0 if no size is given', function () {
      expect(view._getDatasetSize()).toBe(0);
    });

    it('should return the size formatted', function () {
      expect(view._getDatasetSize(1024)).toEqual(['1', 'kB']);
    });
  });
});
