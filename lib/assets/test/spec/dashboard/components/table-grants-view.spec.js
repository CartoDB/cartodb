const TableGrantsView = require('dashboard/components/table-grants/table-grants-view');
const ApiKeyModel = require('dashboard/data/api-key-model');
const UserTablesModel = require('dashboard/data/user-tables-model');
const userModel = require('fixtures/dashboard/user-model.fixture');

describe('dashboard/components/table-grants/table-grants-view', function () {
  let view, apiKeyModel, userTablesModel;

  const createViewFn = function (options) {
    apiKeyModel = new ApiKeyModel({
      type: 'default',
      name: 'fake_api_key',
      token: 'fake_token'
    }, { userModel });

    userTablesModel = new UserTablesModel(null, { userModel });
    spyOn(userTablesModel, 'fetchPublicDatasets');

    const viewOptions = Object.assign({}, {
      apiKeyModel,
      userTablesModel
    }, options);

    spyOn(TableGrantsView.prototype, '_renderFormView').and.callThrough();
    const view = new TableGrantsView(viewOptions);
    return view;
  };

  afterEach(function () {
    view && view.clean();
  });

  describe('.initialize', function () {
    it('throws an error when apiKeyModel is missing', function () {
      const throwableFnView = function () {
        return createViewFn({
          apiKeyModel: undefined
        });
      };

      expect(throwableFnView).toThrowError('apiKeyModel is required');
    });

    it('throws an error when userTablesModel is missing', function () {
      const throwableFnView = function () {
        return createViewFn({
          userTablesModel: undefined
        });
      };

      expect(throwableFnView).toThrowError('userTablesModel is required');
    });

    it('should fetch public datasets when ApiKeyModel is public', function () {
      view = createViewFn();
      expect(view._userTablesModel.fetchPublicDatasets).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call _renderFormView when userTablesModel changes status', function () {
      userTablesModel.getStateModel().set({ status: 'fetched' });
      expect(view._renderFormView).toHaveBeenCalled();
    });
  });

  describe('._renderFormView', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should render loading if userTablesModel is fetched', function () {
      userTablesModel.getStateModel().set({ status: 'fetching' });
      view.render();
      expect(view.$('.ApiKeys-list-loader').length).toBe(1);
    });

    it('should render Api Keys list', function () {
      spyOn(userTablesModel, 'isFetched').and.returnValue(true);
      spyOn(userTablesModel, 'isEmpty').and.returnValue(false);
      spyOn(view, '_createFormView').and.callThrough();

      view._renderFormView();

      expect(view._createFormView).toHaveBeenCalled();
    });

    it('should render placeholder with "0 datasets found" when search results are empty', function () {
      spyOn(userTablesModel, 'isFetched').and.returnValue(true);
      spyOn(userTablesModel, 'isEmpty').and.returnValue(true);
      spyOn(userTablesModel, 'hasQuery').and.returnValue(true);

      view.render();

      expect(view.$('.ApiKeys-list-placeholder').length).toBe(1);
      expect(view.$el.text()).toContain('0 datasets found');
    });

    it('should render placeholder with "There are no datasets" when user has no datasets', function () {
      spyOn(userTablesModel, 'isFetched').and.returnValue(true);
      spyOn(userTablesModel, 'isEmpty').and.returnValue(true);
      spyOn(userTablesModel, 'hasQuery').and.returnValue(false);

      view.render();

      expect(view.$('.ApiKeys-list-placeholder').length).toBe(1);
      expect(view.$el.text()).toContain('There are no datasets');
    });
  });

  describe('._createFormView', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should create the form with the proper values', function () {
      const tableName = 'test_table';
      spyOn(view, '_getTables').and.returnValue({
        [tableName]: { name: tableName, permissions: { select: false, insert: true, update: false, delete: false } }
      });

      const formView = view._createFormView().render();

      expect(formView.$(`#${tableName}`).length).toBe(1);
      expect(formView.$el.text()).toContain(tableName);
      expect(formView.$(`#${tableName} input`).length).toBe(4);
      expect(formView.$(`#${tableName} input[name=insert]`).is(':checked')).toBe(true);
    });
  });

  describe('._generateFormMarkup', function () {
    it('should return form markup for Backbone Forms', function () {
      const tableName = 'test_table';
      view.data = { [tableName]: { select: false, insert: true, update: false, delete: false } };

      const formMarkup = view._generateFormMarkup();

      expect(formMarkup).toContain(tableName);
      expect(formMarkup).toContain(`<div data-fields="${tableName}"></div>`);
    });
  });

  describe('._getTables', function () {
    beforeEach(function () {
      view = createViewFn();

      apiKeyModel.set({
        tables: {
          'fake_table': { name: 'fake_table', permissions: { select: false, insert: true, update: false, delete: false } }
        }
      });

      userTablesModel.set({
        'another_fake_table': {
          name: 'another_fake_table', permissions: { select: false, insert: true, update: false, delete: false } }
      });
    });

    it('should return userTablesModel attributes when apiKeyModel has no id or is public', function () {
      const tables = view._getTables();
      expect(tables).toEqual(userTablesModel.attributes);
    });

    it('should return apiKeyModel tables when apiKeyModel has id and is not public', function () {
      apiKeyModel.set({ type: 'master', id: 'fake_id' });
      const tables = view._getTables();
      expect(tables).toEqual(apiKeyModel.get('tables'));
    });

    it('should return apiKeyModel tables when apiKeyModel has id and is not public', function () {
      apiKeyModel.set({ id: 'fake_id' });
      const tables = view._getTables();
      expect(tables).toEqual(userTablesModel.attributes);
    });
  });

  describe('._onFormViewChanged', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should merge existing tables with new form values', function () {
      const form = {
        getValue: () => ({
          fake_table: { select: false, insert: false, update: false, delete: false },
          fake_table2: { select: false, insert: false, update: true, delete: false }
        })
      };

      apiKeyModel.set({
        tables: {
          fake_table: { permissions: { select: true, insert: true, update: true, delete: true } }
        }
      });

      view._onFormViewChanged(form);
      expect(apiKeyModel.get('tables')).toEqual({
        fake_table: { permissions: { select: false, insert: false, update: false, delete: false } },
        fake_table2: { permissions: { select: false, insert: false, update: true, delete: false } }
      });
    });
  });

  describe('._onSearchChanged', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call userTablesModel.setQuery', function () {
      spyOn(userTablesModel, 'setQuery');

      const event = {
        target: {
          value: ''
        }
      };

      view._onSearchChanged(event);

      setTimeout(function () {
        expect(userTablesModel.setQuery).toHaveBeenCalledWith(event.target.value);
      }, 600);
    });
  });
});
