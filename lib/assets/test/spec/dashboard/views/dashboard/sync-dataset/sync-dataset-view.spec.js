const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const VisualizationModel = require('dashboard/data/visualization-model');
const SyncView = require('dashboard/views/dashboard/sync-dataset/sync-dataset-view');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/dashboard/sync-dataset/sync-dataset-view', function () {
  beforeEach(function () {
    this.modals = new ModalsServiceModel();
    this.tablemetadata = {
      name: '"paco".my_dataset',
      row_count: 9000,
      size: 1000,
      geometry_types: ['st_point']
    };

    this.vis = new VisualizationModel({
      name: 'my_dataset',
      type: 'table',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      table: this.tablemetadata,
      permission: {
        owner: {
          base_url: 'http://team.carto.com/u/paco',
          username: 'paco'
        }
      }
    }, { configModel });

    var synchronization = {
      id: 1234,
      interval: 3600,
      name: 'citibike_1',
      quoted_fields_guessing: true,
      ran_at: '2015-05-19T09:49:32+00:00',
      retried_times: 0,
      run_at: '2015-05-19T11:13:09+00:00',
      service_item_id: '/Public/citibike.csv',
      service_name: 'dropbox',
      state: 'success',
      type_guessing: true,
      fromExternalSource: false,
      updated_at: '2015-05-19T10:13:09+00:00',
      user_id: 'a9263a25-2ed0-4688-898a-04f4cffbd736'
    };

    synchronization.urlRoot = '/';

    this.vis.get('table').synchronization = synchronization;

    this.table = this.vis.tableMetadata();
    spyOn(this.table, 'fetch');
    this.view = new SyncView({
      table: this.table,
      modalModel: this.modals
    });

    this.view.render();
  });

  it('should render the loading screen to start with', function () {
    expect(this.innerHTML()).not.toContain('Sync dataset options');
  });

  describe('when table fetch fails', function () {
    beforeEach(function () {
      this.table.fetch.calls.argsFor(0)[0].error();
    });

    it('should render default error', function () {
      expect(this.innerHTML()).toContain('error');
    });
  });

  describe('when table fetch succeeds', function () {
    beforeEach(function () {
      this.table.fetch.calls.argsFor(0)[0].success();
    });

    it('should render the view as expected', function () {
      expect(this.innerHTML()).toContain('Sync dataset options');
      expect(this.innerHTML()).toContain('Dropbox file');
      expect(this.innerHTML()).toContain('/Public/citibike.csv');
      expect(this.innerHTML()).toContain('Every hour');
      expect(this.innerHTML()).toContain('Every day');
      expect(this.innerHTML()).toContain('Every week');
      expect(this.innerHTML()).toContain('Never');
      expect(this.view.$('input[type="radio"][checked]').parent().find('label').text()).toContain('Every hour');
    });

    it('should render when item is an url', function () {
      this.table.synchronization.set({
        service_name: '',
        service_item_id: '',
        url: 'http://fake.url/point.csv'
      });
      this.view.render();
      expect(this.innerHTML()).not.toContain('Dropbox file');
      expect(this.innerHTML()).toContain('Your dataset is in sync with a  file');
      expect(this.innerHTML()).toContain('http://fake.url/point.csv');
    });

    describe('when select an interval', function () {
      beforeEach(function () {
        this.view.$('.CDB-Radio:nth(2)').click();
      });

      it('should only have one selected', function () {
        expect(this.view.$('input[type="radio"][checked]').parent().find('label').text()).toContain('Every week');
      });
    });

    describe('when click save', function () {
      beforeEach(function () {
        spyOn(this.modals, 'destroy');
        spyOn(this.table.synchronization, 'save');
        this.view.$('.CDB-Radio:nth(1)').click();
        this.view.$('button.ok').click();
      });

      describe('when save succeeds', function () {
        beforeEach(function () {
          this.table.synchronization.save.calls.argsFor(0)[1].success();
        });

        it('should save the checked interval', function () {
          // interval: Every day
          expect(this.table.synchronization.save.calls.argsFor(0)[0]).toEqual({
            interval: 60 * 60 * 24
          });
        });

        it('should close view', function () {
          expect(this.modals.destroy).toHaveBeenCalled();
        });
      });

      describe('when save fails', function () {
        beforeEach(function () {
          this.table.synchronization.save.calls.argsFor(0)[1].error();
        });

        it('should render default error', function () {
          expect(this.innerHTML()).toContain('error');
        });
      });
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
