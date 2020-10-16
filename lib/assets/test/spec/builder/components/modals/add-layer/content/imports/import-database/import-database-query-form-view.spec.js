const _ = require('underscore');
const ImportDatabaseQueryFormView = require('builder/components/modals/add-layer/content/imports/import-database/import-database-query-form-view');
const userModel = require('fixtures/builder/user-model.fixture');
const configModel = require('fixtures/builder/config-model.fixture');
const UploadModel = require('builder/data/upload-model');

describe('components/modals/add-layer/content/imports/import-database/import-database-query-form-view', function () {
  const importOptions = { name: 'postgresql', title: 'PostgreSQL', type: 'database', service: 'postgres', placeholder_query: 'SELECT * FROM table' };
  const _userModel = userModel({});
  const _configModel = configModel({});
  const model = new UploadModel({
    type: importOptions.type,
    service_name: importOptions.service
  }, {
    userModel: _userModel,
    configModel: _configModel
  });

  beforeEach(function () {
    this.view = new ImportDatabaseQueryFormView(
      _.extend(
        importOptions,
        {
          userModel: _userModel,
          configModel: _configModel,
          model: model,
          title: importOptions.title,
          service: importOptions.service,
          placeholder_query: importOptions.placeholder_query
        }
      )
    );
    this.view.render();
  });

  describe('render', function () {
    it('should be rendered properly', function () {
      expect(this.view.$('.ImportOptions__CodeMirror').length).toBe(1);
    });
  });

  describe('_onTextChanged', function () {
    beforeEach(function () {
      this.view.codeEditor.setValue('select * from mytable');
      this.view.$('.js-textInput')[0].value = 'dbtable';
      this.view._onTextChanged();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    describe('when the form is filled', function () {
      it('should enable submit button', function () {
        expect(this.view.$('.js-submit').attr('disabled')).toBeFalsy();
      });

      it('should remove CSS class from submit button', function () {
        expect(this.view.$('.js-submit').hasClass('is-disabled')).toBeFalsy();
      });
    });
  });

  describe('_onSubmitForm', function () {
    beforeEach(function () {
      this.view.codeEditor.setValue('select * from mytable');
      this.view.$('.js-textInput')[0].value = 'dbtable';
      this.view.dbConnectorsClient.dryRun = function (_s, _p, c) { c(); };
    });

    it('should get the entered query in CodeMirror', function () {
      spyOn(this.view.codeEditor, 'getValue').and.returnValue('select * from mytable');
      this.view.$('.js-form').submit();
      expect(this.view.codeEditor.getValue).toHaveBeenCalled();
    });

    it('should trigger `urlSelected` event', function () {
      spyOn(this.view, 'trigger');
      this.view.$('.js-form').submit();
      expect(this.view.trigger).toHaveBeenCalledWith('urlSelected', jasmine.any(Object));
    });

    it('should update the uploadModel', function () {
      spyOn(this.view.model, 'setUpload');
      this.view.$('.js-form').submit();
      expect(this.view.model.setUpload).toHaveBeenCalledWith({
        type: 'service',
        value: 'select * from mytable',
        service_item_id: 'select * from mytable',
        state: 'idle'
      });
    });

    it('should set model state `selected`', function () {
      this.view.$('.js-form').submit();
      expect(this.view.model.get('state')).toEqual('selected');
    });

    it('should trigger `urlSubmitted` event', function () {
      spyOn(this.view, 'trigger');
      this.view.$('.js-form').submit();
      expect(this.view.trigger).toHaveBeenCalledWith('urlSubmitted', jasmine.any(Object));
    });
  });

  describe('_updateUploadModel', function () {
    const connection = {
      server: 'localhost',
      port: '1234',
      database: 'mydatabase',
      username: 'username',
      password: 'password'
    };

    const formFields = {
      sqlQuery: 'select * from mytable',
      importAs: 'dbtable'
    };

    beforeEach(function () {
      this.view.formFields = formFields;
      this.view.model.connection = connection;
      this.view.model.set('service_item_id', 'select * from mytable');
    });

    it('should update model service_item_id with correct params', function () {
      console.log(this.view.model.connection);
      const connector = {
        provider: 'postgres',
        connection: connection,
        sql_query: formFields.sqlQuery,
        import_as: formFields.importAs
      };

      this.view._updateUploadModel();
      expect(this.view.model.get('service_item_id')).toEqual(JSON.stringify(connector));
    });
  });
});
