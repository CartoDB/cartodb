const Backbone = require('backbone');
const ApiKeysFormView = require('dashboard/views/api-keys/api-keys-form-view');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');
const ApiKeyModel = require('dashboard/data/api-key-model');
const UserTablesModel = require('dashboard/data/user-tables-model');

describe('dashboard/views/api-keys/api-keys-form-view', function () {
  let view, userModel, apiKeyModel, stackLayoutModel, spyOnFormChanged;

  const createViewFn = function (options) {
    userModel = new Backbone.Model({
      base_url: 'wadus.com'
    });
    userModel.getSchema = () => 'public';

    apiKeyModel = new ApiKeyModel({
      id: 'fake_id',
      type: 'regular',
      name: 'fake_api_key',
      token: 'fake_token'
    }, { userModel });

    apiKeysCollection = new ApiKeysCollection([], { userModel });

    stackLayoutModel = new Backbone.Model();
    stackLayoutModel.goToStep = jasmine.createSpy('goToStep');

    userTablesModel = new UserTablesModel(null, { userModel });

    const viewOptions = Object.assign({}, {
      apiKeysCollection,
      stackLayoutModel,
      userTablesModel,
      userModel,
      apiKeyModel
    }, options);

    spyOnFormChanged = spyOn(ApiKeysFormView.prototype, '_onFormChanged');

    const view = new ApiKeysFormView(viewOptions);
    return view;
  };

  afterEach(function () {
    view.clean && view.clean();
  });

  it('throws an error when apiKeysCollection is missing', function () {
    view = function () {
      return createViewFn({
        apiKeysCollection: undefined
      });
    };

    expect(view).toThrowError('apiKeysCollection is required');
  });

  it('throws an error when stackLayoutModel is missing', function () {
    view = function () {
      return createViewFn({
        stackLayoutModel: undefined
      });
    };

    expect(view).toThrowError('stackLayoutModel is required');
  });

  it('throws an error when userTablesModel is missing', function () {
    view = function () {
      return createViewFn({
        userTablesModel: undefined
      });
    };

    expect(view).toThrowError('userTablesModel is required');
  });

  it('throws an error when userModel is missing', function () {
    view = function () {
      return createViewFn({
        userModel: undefined
      });
    };

    expect(view).toThrowError('userModel is required');
  });

  it('should call onFormChanged when formView changes', function () {
    view = createViewFn();
    view._formView.trigger('change');
    expect(view._onFormChanged).toHaveBeenCalled();
  });

  it('should call onFormChanged when apiKeyModel tables property changes', function () {
    view = createViewFn();
    apiKeyModel.set({ tables: ['fake_table'] });
    expect(view._onFormChanged).toHaveBeenCalled();
  });

  it('should generate a new apiKeyModel if options does not provide one', function () {
    view = createViewFn({
      apiKeyModel: undefined
    });

    expect(view._apiKeyModel).toBeDefined();
    expect(view._apiKeyModel.isNew()).toBe(true);
  });

  it('should generate a new form', function () {
    view = createViewFn();
    expect(view._formView).toBeDefined();
  });

  describe('when an existing apiKeyModel is provided', function () {
    beforeEach(function () {
      view = createViewFn();
    })

    describe('.render', function () {
      it('should render properly', function () {
        spyOn(view, '_renderTooltip').and.callThrough();

        view.render();

        expect(_.size(view._subviews)).toBe(1);
        expect(view.$('.js-submit').length).toBe(0);

        expect(view.$('.js-api-keys-form').html().length).not.toBe(0);
        expect(view.$('.js-api-keys-tables').html().length).not.toBe(0);

        expect(view.$('input[name=token]').val()).toBe(apiKeyModel.get('token'));
      });
    });

    describe('._generateForm', function () {
      it('should render all fields properly', function () {
        const formView = view._generateForm();
        formView.render();

        expect(formView.$('input[name=name]').length).toBe(1);
        expect(formView.$('input[name=name]').attr('disabled')).toBe('disabled');

        expect(formView.$('input[name=token]').length).toBe(1);
        expect(formView.$('input[name=token]').attr('disabled')).toBe('disabled');

        expect(formView.$('input[name=sql]').length).toBe(1);
        expect(formView.$('input[name=sql]').attr('disabled')).toBe('disabled');

        expect(formView.$('input[name=maps]').length).toBe(1);
        expect(formView.$('input[name=maps]').attr('disabled')).toBe('disabled');
      })
    });
  });

  describe('when an existing apiKeyModel is not provided', function () {
    beforeEach(function () {
      view = createViewFn({
        apiKeyModel: undefined
      });
    })

    describe('.render', function () {
      it('should render properly', function () {
        spyOn(view, '_renderTooltip').and.callThrough();

        view.render();

        expect(_.size(view._subviews)).toBe(2);
        expect(view.$('.js-submit').length).toBe(1);

        expect(view.$('.js-api-keys-form').html().length).not.toBe(0);
        expect(view.$('.js-api-keys-tables').html().length).not.toBe(0);
      });
    });

    describe('._generateForm', function () {
      it('should render all fields properly', function () {
        const formView = view._generateForm();
        formView.render();

        expect(formView.$('input[name=name]').length).toBe(1);
        expect(formView.$('input[name=name]').attr('disabled')).not.toBe('disabled');

        expect(formView.$('input[name=token]').length).toBe(1);
        expect(formView.$('input[name=token]').attr('disabled')).toBe('disabled');

        expect(formView.$('input[name=sql]').length).toBe(1);
        expect(formView.$('input[name=sql]').attr('disabled')).not.toBe('disabled');

        expect(formView.$('input[name=maps]').length).toBe(1);
        expect(formView.$('input[name=maps]').attr('disabled')).not.toBe('disabled');
      })
    });
  });

  describe('._onClickBack', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should go to step 0 when clicking back', function () {
      view._onClickBack();
      expect(stackLayoutModel.goToStep).toHaveBeenCalledWith(0);
    });
  });

  describe('._renderTooltip', function () {
    beforeEach(function () {
      view = createViewFn();
    })

    it('should render the tooltip properly', function () {
      const currentViews = _.size(view._subviews);
      view._renderTooltip();
      expect(_.size(view._subviews)).toBe(currentViews + 1);
    });
  });

  describe('._hasErrors', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should return true if form has errors', function () {
      spyOn(view._formView, 'validate').and.returnValue({
        name: {
          type: 'required',
          message: 'Required'
        }
      });

      expect(view._hasErrors()).toBe(true);
    });

    it('should return true if form has errors', function () {
      spyOn(view._formView, 'validate').and.returnValue(null);
      spyOn(view._apiKeyModel, 'hasPermissionsSelected').and.returnValue(false);

      expect(view._hasErrors()).toBe(true);
    });
  });

  describe('._addApiKeyNameError', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should show a tooltip and add has-error class', function () {
      view.render();

      const currentSubviews = _.size(view._subviews);
      view._addApiKeyNameError();

      expect(_.size(view._subviews)).toBe(currentSubviews + 1);
      expect(view.$('#js-api-key-name').hasClass('has-error')).toBe(true);
    });
  });

  describe('._onFormChanged', function () {
    beforeEach(function () {
      view = createViewFn({
        apiKeyModel: undefined
      });
      spyOnFormChanged.and.callThrough();
    });

    it('should remove has-error class in #js-api-key-name and clean errorTooltip', function () {
      view.render();
      view._addApiKeyNameError();
      spyOn(view._errorTooltip, 'clean').and.callThrough();

      view._onFormChanged();

      expect(view.$('#js-api-key-name').hasClass('has-error')).toBe(false);
      expect(view._errorTooltip.clean).toHaveBeenCalled();
    });
  });

  describe('when the form has errors', function () {
    beforeEach(function () {
      view = createViewFn({
        apiKeyModel: undefined
      });
    });

    describe('._onFormChanged', function () {
      beforeEach(function () {
        spyOnFormChanged.and.callThrough();
      });

      it('should add is-disabled class to submit button', function () {
        view.render();
        view._onFormChanged();

        expect(view.$('.js-submit').hasClass('is-disabled')).toBe(true);
      });

      it('should add the error tooltip', function () {
        spyOn(view, '_renderTooltip').and.callThrough();
        view.render();

        view._onFormChanged();
        view._onFormChanged();

        expect(view._validationTooltip).toBeDefined();
        expect(view._renderTooltip).toHaveBeenCalledTimes(1);
      });
    });

    describe('._onFormSubmit', function () {
      it('should return', function () {
        view._generateForm();
        spyOn(view._formView, 'commit');

        view._onFormSubmit();

        expect(view._formView.commit).not.toHaveBeenCalled();
      });
    });
  });

  describe('when the form has no errors', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOnFormChanged.and.callThrough();
      spyOn(view, '_hasErrors').and.returnValue(false);
    });

    describe('._onFormChanged', function () {
      it('should not add is-disabled class to submit button', function () {
        view.render();
        view._onFormChanged();

        expect(view.$('.js-submit').hasClass('is-disabled')).toBe(false);
      });

      it('should clean validation tooltip if any', function () {
        view._validationTooltip = {
          clean: jasmine.createSpy('clean')
        };

        view._onFormChanged();

        expect(view._validationTooltip.clean).toHaveBeenCalled();
      });
    });

    describe('._onFormSubmit', function () {
      it('should render the form with data returned from server', function () {
        var newModel = new Backbone.Model();

        spyOn(view, '_generateForm');
        spyOn(view, 'render');
        spyOn(view._apiKeysCollection, 'create').and.callFake(function (attributes, options) {
          options.success && options.success(newModel);
        });

        view._onFormSubmit();

        expect(view._apiKeyModel).toBe(newModel);
        expect(view._generateForm).toHaveBeenCalled();
        expect(view.render).toHaveBeenCalled();
      });

      it('should add api key name error when request fails', function () {
        spyOn(view, '_addApiKeyNameError');
        spyOn(view._apiKeysCollection, 'create').and.callFake(function (attributes, options) {
          options.success && options.error(null, {
            responseText: 'Name has already been taken'
          });
        });

        view._onFormSubmit();

        expect(view._addApiKeyNameError).toHaveBeenCalled();
      });
    });
  });

  describe('._clean', function () {
    it('should clear userTablesModel parameters when cleaning view', function () {
      spyOn(userTablesModel, 'clearParams');

      view.clean();

      expect(userTablesModel.clearParams).toHaveBeenCalled();
    });
  });
});