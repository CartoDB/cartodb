var Backbone = require('backbone');
var TablesCollection = require('builder/data/tables-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');

describe('data/tables-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.userModel = new UserModel({
      id: 'uuid',
      username: 'paco',
      organization: {
        id: 'o1'
      }
    }, {
      configModel: configModel
    });
    this.collection = new TablesCollection([], {
      configModel: configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.collection.url()).toEqual('/u/pepe/api/v1/viz');
  });

  describe('.fetch', function () {
    beforeEach(function () {
      spyOn(Backbone.Collection.prototype, 'fetch');
    });

    describe('when called without any args', function () {
      beforeEach(function () {
        this.collection.fetch();
      });

      it('should be called with default options if none is provided', function () {
        expect(Backbone.Collection.prototype.fetch).toHaveBeenCalled();
        var args = Backbone.Collection.prototype.fetch.calls.argsFor(0);
        expect(args[0]).toBeDefined();
        expect(args[0].data).toEqual(jasmine.objectContaining({ type: 'table' }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ page: 1 }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ per_page: jasmine.any(Number) }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ exclude_shared: false }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ tags: '' }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ q: '' }));
      });
    });

    describe('when called with different args', function () {
      beforeEach(function () {
        this.collection.fetch({
          data: {
            exclude_shared: true,
            type: 'remote'
          }
        });
      });

      it('should be called with default options if none is provided', function () {
        expect(Backbone.Collection.prototype.fetch).toHaveBeenCalled();
        var args = Backbone.Collection.prototype.fetch.calls.argsFor(0);
        expect(args[0]).toBeDefined();
        expect(args[0].data).toEqual(jasmine.objectContaining({ type: 'remote' }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ exclude_shared: true }));
      });
    });

    describe('.parse', function () {
      it('should return as many items as visualizations come', function () {
        var items = this.collection.parse({
          visualizations: [{
            type: 'table',
            table: {
              geometry_types: ['point'],
              id: 'hello-table',
              name: 'table1',
              privacy: 'PRIVATE',
              rows_counted: 10,
              table_size: 103423
            }
          }]
        });
        expect(items.length).toBe(1);
        var tableData = items[0];
        expect(tableData.id).toBe('hello-table');
      });

      it('should populate table_type to the items', function () {
        var items = this.collection.parse({
          visualizations: [{
            type: 'remote',
            table: {
              id: 'hello-table2'
            }
          }]
        });
        var tableData = items[0];
        expect(tableData.table_type).toBe('remote');
      });
    });

    describe('.getTotalStat', function () {
      beforeEach(function () {
        this.collection.parse({
          total_shared: 2,
          total_user_entries: 3,
          visualizations: []
        });
      });

      it('should return stats from last collection parse', function () {
        expect(this.collection.getTotalStat('total_shared')).toBe(2);
        this.collection.parse({
          total_shared: 1,
          total_user_entries: 2,
          visualizations: []
        });
        expect(this.collection.getTotalStat('total_shared')).toBe(1);
        expect(this.collection.getTotalStat('total_user_entries')).toBe(2);
      });
    });
  });
});
