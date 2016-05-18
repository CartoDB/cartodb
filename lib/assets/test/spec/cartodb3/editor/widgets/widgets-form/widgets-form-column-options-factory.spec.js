var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var WidgetsFormColumnOptionsFactory = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-column-options-factory');

describe('editor/widgets/widgets-form/widgets-form-column-options-factory', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * from foobar'
    }, {
      configModel: configModel
    });

    this.factory = new WidgetsFormColumnOptionsFactory(this.querySchemaModel);
  });

  describe('.unavailableColumnsHelpMessage', function () {
    it('should return a string if columns are not available', function () {
      this.querySchemaModel.set('status', 'fetched');
      expect(this.factory.unavailableColumnsHelpMessage()).toBeUndefined();

      this.querySchemaModel.set('status', 'unavailable');
      expect(this.factory.unavailableColumnsHelpMessage()).toEqual(jasmine.any(String));
    });
  });

  describe('.create', function () {
    describe('when columns are not yet fetched', function () {
      beforeEach(function () {
        this.querySchemaModel.set('status', 'fetching');
      });

      it('should return a disable option with loading message', function () {
        expect(this.factory.create()).toEqual([{val: jasmine.any(String)}]);
      });

      describe('when columns are not available for whatever reason', function () {
        beforeEach(function () {
          this.querySchemaModel.set('status', 'unavailable');
        });

        it('should return the current val', function () {
          expect(this.factory.create('current')).toEqual([{val: 'current'}]);
        });
      });

      describe('when columns are finally fetched', function () {
        beforeEach(function () {
          this.querySchemaModel.columnsCollection.reset([
            {name: 'cartodb_id', type: 'number'},
            {name: 'title', type: 'string'},
            {name: 'created_at', type: 'date'}
          ]);
          this.querySchemaModel.set('status', 'fetched');
        });

        it('should return the columns', function () {
          expect(this.factory.create('current')).toEqual([
            {
              label: 'cartodb_id',
              val: 'cartodb_id',
              type: 'number'
            }, {
              label: 'title',
              val: 'title',
              type: 'string'
            }, {
              label: 'created_at',
              val: 'created_at',
              type: 'date'
            }
          ]);
        });

        it('should return only valid columns if filter is given', function () {
          var noStringsFilter = function (m) {
            return m.get('type') !== 'string';
          };
          expect(this.factory.create('current', noStringsFilter)).toEqual([
            {
              label: 'cartodb_id',
              val: 'cartodb_id',
              type: 'number'
            }, {
              label: 'created_at',
              val: 'created_at',
              type: 'date'
            }
          ]);
        });
      });
    });
  });
});
