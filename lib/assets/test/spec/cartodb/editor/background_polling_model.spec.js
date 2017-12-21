var BackgroundPollingModel = require('../../../../javascripts/cartodb/editor/background_polling_model');
var ImportCollection = require('../../../../javascripts/cartodb/common/background_polling/models/imports_collection');
var ImportsModel = require('../../../../javascripts/cartodb/common/background_polling/models/imports_model');

describe('editor/background_polling_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com'
    });
    this.importsCollection = new ImportCollection(undefined, {
      user: this.user
    });

    this.vis = new cdb.admin.Visualization({
      name: 'my-map'
    });

    this.model = new BackgroundPollingModel({}, {
      vis: this.vis,
      user: this.user,
      importsCollection: this.importsCollection
    });
  });

  describe('when an import starts but map doesn\'t allow more layers', function() {

    beforeEach(function() {
      this.user.set('limits', {
        concurrent_imports: 2,
        max_layers: 3
      });
    });

    it('should set error state for new import', function() {
      spyOn(this.user, 'canAddLayerTo').and.returnValue(false);
      this.model.addImportItem(
        new ImportsModel(
          {},
          {
            upload: {
              type: 'file',
              value: { name: 'fake.csv', size: 1 }
            }
          }
        )
      );
      var imp = this.importsCollection.at(0);
      var error = imp.getError();
      expect(imp.get('state')).toBe('error');
      expect(error.error_code).toBe(8005);
    });

  });

  describe('when an imports model changes state', function() {
    beforeEach(function() {
      this.importsCollection.reset({
        step: 'import'
      });
      this.importsModel = this.importsCollection.at(0);

      // "all is good" is defined like this, was extracted from background importer view at some point
      this.importsModel.imp.set({
        tables_created_count: 1,
        service_name: 'other',
        table_name: 'foobar'
      });

      spyOn(this.vis.map, 'addCartodbLayerFromTable');
    });

    it('should do nothing if import did not complete successfully', function() {
      this.importsModel.imp.set({
        step: 'import',
        state: 'fail'
      });
      expect(this.vis.map.addCartodbLayerFromTable).not.toHaveBeenCalled();
    });

    describe('when import is completed', function() {
      beforeEach(function() {
        this.importsModel.imp.set({
          step: 'import',
          state: 'complete'
        });
        this.args = this.vis.map.addCartodbLayerFromTable.calls.argsFor(0);
      });

      it('should add the imported dataset as a new layer', function() {
        expect(this.vis.map.addCartodbLayerFromTable).toHaveBeenCalled();
      });

      it('should created layer for current user and vis', function() {
        expect(this.args[0]).toEqual('foobar');
        expect(this.args[1]).toEqual('pepe');
        expect(this.args[2].vis).toEqual(this.vis);
      });

      describe('when layer is created successfully', function() {
        beforeEach(function() {
          spyOn(this.vis.map.layers, 'saveLayers');
          this.args[2].success();
        });

        it('should save layers', function() {
          expect(this.vis.map.layers.saveLayers).toHaveBeenCalled();
        });

        it('should remove the model from the collection', function() {
          expect(this.importsCollection.length).toEqual(0);
        });
      });

      describe('when layer could not be create for whatever reason', function() {
        beforeEach(function() {
          this.model.bind('importLayerFail', function(errorMsg) {
            this.lastErrorMsg = errorMsg;
          }, this);
          spyOn(this.vis.map.layers, 'saveLayers');
          this.args[2].error();
        });

        it('should not tried to save layers', function() {
          expect(this.vis.map.layers.saveLayers).not.toHaveBeenCalled();
        });

        it('should remove the model from the collection', function() {
          expect(this.importsCollection.length).toEqual(0);
        });

        it('should set last error', function() {
          expect(this.lastErrorMsg).toEqual(jasmine.any(String));
        });
      });
    });
  });
});
