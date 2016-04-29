var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisTableModel = require('../../../../javascripts/cartodb3/data/analysis-table-model');

describe('data/analysis-table-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new AnalysisTableModel({
      table_name: 'foobar'
    }, {
      configModel: configModel
    });
  });

  it('should have a columns collection', function () {
    expect(this.model.columnsCollection).toBeDefined();
  });

  it('should not be fetched initially', function () {
    expect(this.model.get('fetched')).toBe(false);
  });

  describe('.fetch', function () {
    beforeEach(function () {
      spyOn(this.model._tableQueryModel, 'fetch');
    });

    describe('when there is a query', function () {
      beforeEach(function () {
        this.model.set('query', 'SELECT a, b FROM foobar');
        this.model.fetch();
      });

      it('should fetch data for query model', function () {
        expect(this.model._tableQueryModel.fetch).toHaveBeenCalled();
      });

      describe('when synced', function () {
        beforeEach(function () {
          this.col = {};
          this.model._tableQueryModel.columnsCollection.reset([this.col]);
          this.model._tableQueryModel.trigger('sync');
        });

        it('should update the columns', function () {
          expect(this.model.columnsCollection.models).toEqual(this.model._tableQueryModel.columnsCollection.models);
        });
      });
    });
  });
});
