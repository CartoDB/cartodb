const DuplicateVisView = require('dashboard/views/dashboard/dialogs/duplicate-vis/duplicate-vis-view');
const VisualizationModel = require('dashboard/data/visualization-model');
const UserModel = require('dashboard/data/user-model');
const MapUrlModel = require('dashboard/data/map-url-model');
const ImportModel = require('builder/data/background-importer/imports-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/dashboard/dialogs/duplicate-vis/duplicate-vis-view', function () {
  beforeEach(function () {
    this.user = new UserModel({
      username: 'pepe'
    });

    this.vis = new VisualizationModel({
      type: 'derived',
      name: 'my name'
    }, {
      configModel: ConfigModelFixture
    });

    spyOn(this.vis, 'copy');
    this.table = this.vis.tableMetadata();

    this.view = new DuplicateVisView({
      model: this.vis,
      table: this.table,
      userModel: this.user,
      configModel: ConfigModelFixture
    });

    this.view.render();
  });

  it('should start the duplication process right away', function () {
    expect(this.vis.copy).toHaveBeenCalled();
  });

  it('should the name of the duplicate vis should be suffixed with copy', function () {
    expect(this.vis.copy.calls.argsFor(0)[0].name).toEqual('my name copy');
  });

  it('should render the loading initially', function () {
    expect(this.innerHTML()).toContain('Duplicating your map');
  });

  describe('when duplication successfully finished', function () {
    beforeEach(function () {
      this.newVis = new VisualizationModel({}, { configModel: ConfigModelFixture });
      this.url = new MapUrlModel({ base_url: 'https://carto.com/user/pepe/viz/abc-123' });
      spyOn(this.newVis, 'viewUrl').and.returnValue(this.url);
      spyOn(this.view, '_redirectTo');
      this.vis.copy.calls.argsFor(0)[1].success(this.newVis);
    });

    it('should redirect to the edit url', function () {
      expect(this.view._redirectTo).toHaveBeenCalledWith(this.url.edit().toString());
      expect(this.newVis.viewUrl).toHaveBeenCalledWith(this.user);
    });
  });

  describe('when duplication fails with a general error', function () {
    beforeEach(function () {
      this.vis.copy.calls.argsFor(0)[1].error.bind(this.vis)({}, { responseText: '' });
    });

    it('should render a fail template', function () {
      expect(this.innerHTML()).toContain('Sorry, something went wrong');
    });
  });

  describe('when duplication fails with an over quota', function () {
    beforeEach(function () {
      this.vis.copy.calls.argsFor(0)[1].error.bind(this.vis)({}, { responseText: 'over account public map quota' });
    });

    it('should render a fail template', function () {
      expect(this.innerHTML()).toContain('upgrade');
    });
  });

  describe('when duplication fails from import error', function () {
    beforeEach(function () {
      var importModel = new ImportModel({
        item_queue_id: 'abc-123',
        error_code: 8003,
        get_error_text: {
          title: 'Error creating table from SQL query',
          what_about: 'We could not create table from your query.'
        }
      }, {
        userModel: this.user,
        configModel: ConfigModelFixture
      });
      this.vis.copy.calls.argsFor(0)[1].error(importModel);
    });

    it('should render a the more detailed fail template', function () {
      expect(this.innerHTML()).toContain('Error creating table');
      expect(this.innerHTML()).toContain('We could not create table from your query');
      expect(this.innerHTML()).toContain('components.background-importer.error-details.send-us-the-error-code');
    });
  });
});
