const _ = require('underscore');
const ImportDatabaseConnectFormView = require('builder/components/modals/add-layer/content/imports/import-database/import-database-connect-form-view');
const userModel = require('fixtures/builder/user-model.fixture');
const configModel = require('fixtures/builder/config-model.fixture');
const UploadModel = require('builder/data/upload-model');

describe('components/modals/add-layer/content/imports/import-database/import-database-connect-form-view', function () {
  const params = [
    { key: 'server', type: 'text' },
    { key: 'port', type: 'number' },
    { key: 'database', type: 'text' },
    { key: 'username', type: 'text' },
    { key: 'password', type: 'password' }
  ];
  const importOptions = { name: 'postgresql', title: 'PostgreSQL', type: 'database', service: 'postgres', params };
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
    this.view = new ImportDatabaseConnectFormView(
      _.extend(
        importOptions,
        {
          userModel: _userModel,
          configModel: _configModel,
          model: model,
          title: importOptions.title,
          service: importOptions.service,
          params: importOptions.params
        }
      )
    );
    this.view.render();
  });

  describe('render', function () {
    it('should be rendered properly', function () {
      expect(this.view.$('.ImportPanel-sidebar').length).toBe(1);
    });
  });

  describe('_onTextChanged', function () {
    beforeEach(function () {
      this.view.$('.js-server').val('localhost');
      this.view.$('.js-port').val('1234');
      this.view.$('.js-database').val('mydatabase');
      this.view.$('.js-username').val('username');
      this.view.$('.js-password').val('password');

      this.view.$('.js-server').trigger('keyup');
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
    it('should get the params from the form', function () {
      spyOn(this.view, '_getFormParams');
      this.view.$('.js-form').submit();
      expect(this.view._getFormParams).toHaveBeenCalled();
    });

    it('should check the connection', function () {
      spyOn(this.view, '_checkConnection');
      this.view.$('.js-form').submit();
      expect(this.view._checkConnection).toHaveBeenCalled();
    });
  });

  describe('_getFormParams', function () {
    beforeEach(function () {
      this.view.$('.js-server').val('localhost');
      this.view.$('.js-port').val('1234');
      this.view.$('.js-database').val('mydatabase');
      this.view.$('.js-username').val('username');
      this.view.$('.js-password').val('password');

      this.view.$('.js-server').trigger('keyup');
    });

    it('should return an object with all the params of the form', function () {
      const params = this.view._getFormParams();

      expect(params).toEqual({
        server: 'localhost',
        port: '1234',
        database: 'mydatabase',
        username: 'username',
        password: 'password'
      });
    });
  });

  describe('_checkConnectionSuccess', function () {
    it('should set model state `connected`', function () {
      this.view._checkConnectionSuccess();
      expect(this.view.model.get('state')).toEqual('connected');
    });
  });

  describe('_checkConnectionError', function () {
    it('should set an error message if Import API call returns errors and `connected` is false', function () {
      this.view._checkConnectionError({ status: 400, responseJSON: { connected: false } });
      expect(this.view.model.get('errorMessage')).toBe('components.modals.add-layer.imports.database.connection-error');
    });

    it('should set a general error message if Import API call returns errors', function () {
      this.view._checkConnectionError({ status: 400 });
      expect(this.view.model.get('errorMessage')).toBe('components.modals.add-layer.imports.database.general-error');
    });
  });
});
