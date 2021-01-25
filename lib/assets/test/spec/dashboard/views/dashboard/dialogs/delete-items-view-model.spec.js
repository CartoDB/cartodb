const $ = require('jquery');
const VisualizationModel = require('dashboard/data/visualization-model');
const UserModel = require('dashboard/data/user-model');
const DeleteItemsViewModel = require('dashboard/views/dashboard/dialogs/delete-items/delete-items-view-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('common/dialogs/delete_items_view_model', function () {
  beforeEach(function () {
    this.models = [
      new VisualizationModel({}, { configModel: ConfigModelFixture }),
      new VisualizationModel({}, { configModel: ConfigModelFixture })
    ];
    this.opts = {
      contentType: 'maps'
    };

    this.createViewModel = function () {
      this.viewModel = new DeleteItemsViewModel(this.models, this.opts);
    };
  });

  describe('.isDeletingDatasets', function () {
    describe('when content type is datasets', function () {
      beforeEach(function () {
        this.opts.contentType = 'datasets';
        this.createViewModel();
      });

      it('should return true', function () {
        expect(this.viewModel.isDeletingDatasets()).toBeTruthy();
      });
    });

    describe('when content type is maps', function () {
      beforeEach(function () {
        this.opts.contentType = 'maps';
        this.createViewModel();
      });

      it('should return false', function () {
        expect(this.viewModel.isDeletingDatasets()).toBeFalsy();
      });
    });
  });

  describe('.loadingPrerequisites', function () {
    describe('when content type is maps', function () {
      beforeEach(function () {
        this.opts.contentType = 'maps';
        this.createViewModel();
        this.viewModel.loadPrerequisites();
      });

      it('should change state to confirm deletion directly', function () {
        expect(this.viewModel.state()).toEqual('ConfirmDeletion');
      });
    });

    describe('when content type is datasets', function () {
      beforeEach(function () {
        this.opts.contentType = 'datasets';

        this.models.forEach(function (m) {
          spyOn(m.tableMetadata(), 'fetch');
        }, this);

        this.createViewModel();

        this.changeCount = 0;
        this.viewModel.bind('change', function () {
          this.changeCount++;
        }, this);
        this.viewModel.bind('ConfirmDeletion', function () {
          this.confirmDeletionCalled = true;
        }, this);
        this.viewModel.bind('LoadPrerequisitesFail', function () {
          this.loadPrerequisitesFailCalled = true;
        }, this);

        this.viewModel.loadPrerequisites();
      });

      it('should have state set to loading prerequisites', function () {
        expect(this.viewModel.state()).toEqual('LoadingPrerequisites');
      });

      it('should call .fetch on the metadata models', function () {
        var metadata = this.models[0].tableMetadata();
        expect(metadata.fetch).toHaveBeenCalled();
        expect(metadata.fetch.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wait: true }));
      });

      it('should trigger a change once', function () {
        expect(this.changeCount).toEqual(1);
      });

      describe('when all prerequisites are loaded', function () {
        beforeEach(function () {
          this.models.forEach(function (m) {
            var metadata = m.tableMetadata();
            metadata.fetch.calls.argsFor(0)[0].success();
          });
        });

        it('should trigger a change event again', function () {
          expect(this.changeCount).toEqual(2);
        });

        it('should trigger a confirm deletion event', function () {
          expect(this.confirmDeletionCalled).toBeTruthy();
        });
      });

      describe('when an prerequisites load fails', function () {
        beforeEach(function () {
          var metadata = this.models[0].tableMetadata();
          metadata.fetch.calls.argsFor(0)[0].error(this.models[0], {
            responseText: 'internal server error, or such'
          });
        });

        it('should trigger a change event again', function () {
          expect(this.changeCount).toEqual(2);
        });

        it('should trigger a fail event', function () {
          expect(this.loadPrerequisitesFailCalled).toBeTruthy();
        });
      });
    });
  });

  describe('.deleteItems', function () {
    beforeEach(function () {
      this.createViewModel();
      this.modelDeferreds = [];
      this.models.forEach(function (model, i) {
        var dfd = $.Deferred();
        spyOn(model, 'destroy').and.returnValue(dfd.promise());
        this.modelDeferreds[i] = dfd;
      }, this);

      this.changeCount = 0;
      this.changeSpy = jasmine.createSpy('change');
      this.viewModel.bind('change', this.changeSpy);
      this.deleteItemsDoneSpy = jasmine.createSpy('DeleteItemsDone');
      this.deleteItemsFailSpy = jasmine.createSpy('DeleteItemsFail');
      this.viewModel.bind('DeleteItemsDone', this.deleteItemsDoneSpy);
      this.viewModel.bind('DeleteItemsFail', this.deleteItemsFailSpy);

      this.viewModel.deleteItems();
    });

    it('should change state to deleting deletion', function () {
      expect(this.viewModel.state()).toEqual('DeletingItems');
    });

    it('should call destroy and wait to be removed from any parent collection until confirmed deletion from server', function () {
      expect(this.models[0].destroy).toHaveBeenCalled();
      expect(this.models[0].destroy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wait: true }));

      // destroy should not be called until 1st model's destroy is resolved
      expect(this.models[1].destroy).not.toHaveBeenCalled();
      this.modelDeferreds[0].resolve();
      expect(this.models[1].destroy).toHaveBeenCalled();
    });

    it('should trigger a change once', function () {
      expect(this.changeSpy.calls.count()).toEqual(1);
    });

    describe('when all items are deleted', function () {
      beforeEach(function () {
        this.modelDeferreds.forEach(function (dfd) {
          dfd.resolve();
        });
      });

      it('should trigger a change event again', function () {
        expect(this.changeSpy.calls.count()).toEqual(2);
      });

      it('should trigger a done event', function () {
        expect(this.deleteItemsDoneSpy).toHaveBeenCalled();
      });
    });

    describe('when an deletion fail', function () {
      beforeEach(function () {
        this.modelDeferreds[0].reject('oups');
      });

      it('should trigger a change event again', function () {
        expect(this.changeSpy.calls.count()).toEqual(2);
      });

      it('should trigger a fail event', function () {
        expect(this.deleteItemsFailSpy).toHaveBeenCalled();
      });
    });
  });

  describe('.affectedEntities', function () {
    describe('when there are no users who share item', function () {
      beforeEach(function () {
        this.createViewModel();
      });

      it('should return an empty list', function () {
        expect(this.viewModel.affectedEntities()).toEqual([]);
      });
    });

    describe('when there are users who share item', function () {
      beforeEach(function () {
        var newUser = function (opts) {
          return new UserModel({
            id: opts.id,
            name: 'user name ' + opts.id
          });
        };

        this.users = [
          newUser({ id: 1 }),
          newUser({ id: 2 }),
          newUser({ id: 3 }),
          newUser({ id: 4 }),
          newUser({ id: 5 })
        ];

        spyOn(this.models[0], 'sharedWithEntities').and.returnValue(this.users.slice(0, 2));
        spyOn(this.models[1], 'sharedWithEntities').and.returnValue(this.users.slice(2));

        this.createViewModel();
      });

      it('should return a list with them', function () {
        expect(this.viewModel.affectedEntities()).toEqual(this.users);
      });
    });
  });

  describe('.affectedVisData', function () {
    describe('when there are no affected vis', function () {
      beforeEach(function () {
        this.createViewModel();
      });

      it('should return an empty list', function () {
        expect(this.viewModel.affectedVisData()).toEqual([]);
      });
    });

    describe('when there are affected vis', function () {
      var vis1, vis2, vis3;
      var fakeTableMetadata = function fakeTableMetadata (depVisualizations, nonDepVisualizations) {
        var metadata = {
          get: function (attr) {
            if (attr === 'dependent_visualizations') {
              return depVisualizations;
            }
            if (attr === 'non_dependent_visualizations') {
              return nonDepVisualizations;
            }
          }
        };
        return metadata;
      };

      beforeEach(function () {
        vis1 = new VisualizationModel({ id: 'vis1' }, { configModel: ConfigModelFixture });
        vis2 = new VisualizationModel({ id: 'vis2' }, { configModel: ConfigModelFixture });
        vis3 = new VisualizationModel({ id: 'vis3' }, { configModel: ConfigModelFixture });

        this.models = [vis1, vis2, vis3];
      });

      it('should return a list with the affected vis', function () {
        spyOn(vis1, 'tableMetadata').and.returnValue(
          fakeTableMetadata([{ id: 'vis2' }], [{ id: 'vis3' }])
        );

        this.createViewModel();

        expect(this.viewModel.affectedVisData()).toEqual([
          { id: 'vis2' }, { id: 'vis3' }
        ]);
      });

      it('should NOT return duplicated visualizations', function () {
        spyOn(vis1, 'tableMetadata').and.returnValue(
          fakeTableMetadata([{ id: 'vis2' }], [{ id: 'vis3' }])
        );
        spyOn(vis2, 'tableMetadata').and.returnValue(
          fakeTableMetadata([{ id: 'vis1' }], [{ id: 'vis3' }])
        );

        this.createViewModel();

        expect(this.viewModel.affectedVisData()).toEqual([
          { id: 'vis2' }, { id: 'vis3' }, { id: 'vis1' }
        ]);
      });
    });
  });
});
