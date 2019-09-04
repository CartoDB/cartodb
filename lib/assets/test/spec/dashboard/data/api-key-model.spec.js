const ApiKeyModel = require('dashboard/data/api-key-model');

const modelApiURL = 'wadus.com/api/v3/api_keys';
const apiData = {
  name: 'Awesome map key',
  type: 'regular',
  token: 'NmYvZM80laiQQMv5rUGbJA',
  grants: [
    { type: 'apis', apis: [ 'maps', 'sql' ] },
    { type: 'database',
      tables: [{ 'schema': 'public', 'name': 'untitled_table_14', 'permissions': ['insert', 'update', 'read'] }],
      schemas: [] }
  ]
};

const parsedData = {
  name: 'Awesome map key',
  type: 'regular',
  token: 'NmYvZM80laiQQMv5rUGbJA',
  id: 'Awesome map key',
  apis: { maps: true, sql: true },
  tables: {
    untitled_table_14: {
      schema: 'public',
      name: 'untitled_table_14',
      permissions: {
        insert: true,
        update: true,
        read: true
      }
    }
  },
  datasets: {
    create: false,
    listing: false
  }
};

describe('dashboard/data/api-key-model', function () {
  var model;

  beforeEach(function () {
    model = new ApiKeyModel({}, {
      userModel: {
        getSchema: () => 'public'
      }
    });

    spyOn(model, 'url').and.returnValue(modelApiURL);
  });

  it('should have these attributes by default', function () {
    expect(model.attributes).toEqual({
      name: '',
      token: '',
      apis: {
        maps: false,
        sql: false
      },
      datasets: {
        create: false,
        listing: false
      },
      tables: []
    });
  });

  it('throws an error when userModel is missing', function () {
    model = function () {
      return new ApiKeyModel(null, {});
    };

    expect(model).toThrowError('userModel is required');
  });

  describe('.regenerate', function () {
    it('should sync collection', function () {
      spyOn(model, 'sync');

      model.regenerate();

      var spyCallArguments = model.sync.calls.mostRecent().args;
      expect(model.sync).toHaveBeenCalled();
      expect(spyCallArguments[0]).toBeNull();
      expect(spyCallArguments[1]).toBe(model);
      expect(spyCallArguments[2].url).toBe('wadus.com/api/v3/api_keys/token/regenerate');
      expect(spyCallArguments[2].type).toBe('POST');
    });

    it('should set data on sync success', function () {
      spyOn(model, 'sync').and.callFake(function (method, model, options) {
        options.success && options.success({ name: 'wadus' });
      });

      model.regenerate();

      expect(model.get('name')).toBe('wadus');
    });
  });

  describe('.parse', function () {
    it('should parse data properly', function () {
      const options = {
        userModel: {
          getSchema: () => 'public'
        }
      };
      const parsed = model.parse(apiData, options);
      expect(parsed).toEqual(parsedData);
    });
  });

  describe('.toJSON', function () {
    it('should return data properly', function () {
      model.set(parsedData);
      const data = model.toJSON();

      const expectedJSONData = Object.assign({}, apiData, { id: parsedData.id });
      expect(data).toEqual(expectedJSONData);
    });

    it('should return data properly with create and listing set to true', function () {
      const parsedDataCreateListing = Object.assign(parsedData, { datasets: { create: true, listing: true } });
      model.set(parsedDataCreateListing);
      const data = model.toJSON();
      const apiDataCreateListing = Object.assign({},
        apiData, {
          grants: [
            { type: 'apis', apis: [ 'maps', 'sql' ] },
            { type: 'database',
              tables: [{ 'schema': 'public', 'name': 'untitled_table_14', 'permissions': ['insert', 'update', 'read'] }],
              schemas: [{ name: 'public', permissions: ['create'] }],
              table_metadata: [] }
          ]
        });
      const expectedJSONData = Object.assign({}, apiDataCreateListing, { id: parsedData.id });
      expect(data).toEqual(expectedJSONData);
    });
  });

  describe('.isPublic', function () {
    it('should return true if type is default', function () {
      model.set('type', 'regular');
      expect(model.isPublic()).toBe(false);

      model.set('type', 'default');
      expect(model.isPublic()).toBe(true);
    });
  });

  describe('.getApiGrants', function () {
    it('should return granted API permissions', function () {
      model.set('apis', { maps: true, sql: false });
      expect(model.getApiGrants()).toEqual(['maps']);
    });
  });

  describe('.getTablesGrants', function () {
    it('should return tables with granted permissions', function () {
      const tables = {
        untitled_table_14: {
          schema: 'public',
          name: 'untitled_table_14',
          permissions: {
            insert: true,
            update: true,
            read: false
          }
        }
      };

      model.set('tables', tables);
      expect(model.getTablesGrants()).toEqual([{
        name: 'untitled_table_14',
        schema: 'public',
        permissions: ['insert', 'update']
      }]);
    });
  });

  describe('._parseApiGrants', function () {
    it('should return parsed API grants properly', function () {
      const apiGrants = model._parseApiGrants([{ type: 'apis', apis: [ 'maps' ] }]);
      expect(apiGrants).toEqual({ maps: true, sql: false });
    });
  });

  describe('._parseTableGrants', function () {
    it('should return parsed table grants properly', function () {
      const tableGrants = [{
        type: 'database',
        tables: [{ 'schema': 'public', 'name': 'untitled_table_14', 'permissions': ['insert', 'read'] }]
      }];

      const parsedTableGrants = model._parseTableGrants(tableGrants);

      expect(parsedTableGrants).toEqual({
        untitled_table_14: {
          schema: 'public',
          name: 'untitled_table_14',
          permissions: {
            insert: true,
            read: true
          }
        }
      });
    });
  });

  describe('._parseDatabaseGrants', function () {
    it('should be true after parsing database grants', function () {
      const tableGrants = [{
        type: 'database',
        schema: 'public',
        name: 'untitled_table_14',
        permissions: {
          insert: true,
          read: true
        },
        table_metadata: []
      }];

      const parsedDatabaseGrants = model._parseDatabaseGrants(tableGrants);

      expect(parsedDatabaseGrants).toBe(true);
    });

    it('should be false after parsing database grants', function () {
      const tableGrants = [{
        type: 'database',
        schema: 'public',
        name: 'untitled_table_14',
        permissions: {
          insert: true,
          read: true
        }
      }];

      const parsedDatabaseGrants = model._parseDatabaseGrants(tableGrants);

      expect(parsedDatabaseGrants).toBe(false);
    });
  });

  describe('._parseDatabaseSchemas', function () {
    it('should be true after parsing database schemas', function () {
      const tableGrants = [{
        type: 'database',
        schemas: [{ name: 'public', permissions: ['create'] }]
      }];
      const schemaName = 'public';

      const parsedDatabaseSchemas = model._parseDatabaseSchemas(tableGrants, schemaName);

      expect(parsedDatabaseSchemas).toBe(true);
    });

    it('should be false after parsing database schemas', function () {
      const tableGrants = [{
        type: 'database',
        schemas: []
      }];

      const parsedDatabaseSchemas = model._parseDatabaseSchemas(tableGrants);

      expect(parsedDatabaseSchemas).toBe(false);
    });
  });

  describe('._arrayToObj', function () {
    it('should transform an array to an object', function () {
      expect(model._arrayToObj(['sql', 'maps'])).toEqual({sql: true, maps: true});
    });
  });

  describe('._hasPermissionsSelected', function () {
    it('should return true if any table has permissions', function () {
      spyOn(model, 'getTablesGrants').and.returnValues(
        [{ schema: 'public', name: 'table_with_permissions', permissions: ['insert', 'update', 'read'] }],
        [{ schema: 'public', name: 'table_without_permissions', permissions: [] }]
      );

      expect(model.hasPermissionsSelected()).toBe(true);
      expect(model.hasPermissionsSelected()).toBe(false);
    });
  });
});
