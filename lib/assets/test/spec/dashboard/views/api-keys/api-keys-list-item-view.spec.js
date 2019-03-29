const Backbone = require('backbone');
const ApiKeysListItemView = require('dashboard/views/api-keys/api-keys-list-item-view');
const AlertDialogView = require('dashboard/views/api-keys/alert-dialog-view');
const deleteKeyTemplate = require('dashboard/views/api-keys/alert-delete-key.tpl');
const regenerateKeyTemplate = require('dashboard/views/api-keys/alert-regenerate-key.tpl');

describe('dashboard/views/api-keys/api-keys-list-item-view', function () {
  let view, apiKeyModel;

  const createViewFn = function (options) {
    apiKeyModel = new Backbone.Model({
      type: 'regular',
      name: 'fake_api_key',
      token: 'fake_token'
    });
    apiKeyModel.getApiGrants = () => ['sql', 'maps'];
    apiKeyModel.regenerate = jasmine.createSpy('regenerate');
    spyOn(apiKeyModel, 'destroy');

    const viewOptions = Object.assign({}, {
      apiKeyModel,
      onEdit: jasmine.createSpy('onEdit')
    }, options);

    spyOn(ApiKeysListItemView.prototype, 'render').and.callThrough();

    return new ApiKeysListItemView(viewOptions);
  };

  beforeEach(function () {
    view = createViewFn();
  });

  afterEach(function () {
    // The Dialog closing action occurs within a 120ms delay, so we
    // remove it manually instead of waiting for the dialog to close
    var dialog = document.querySelector('.Dialog');

    if (dialog) {
      dialog.remove();
    }
  });

  it('throws an error when apiKeyModel is missing', function () {
    view = function () {
      return new ApiKeysListItemView({});
    };

    expect(view).toThrowError('apiKeyModel is required');
  });

  it('throws an error when onEdit is missing', function () {
    view = function () {
      return new ApiKeysListItemView({
        apiKeyModel
      });
    };

    expect(view).toThrowError('onEdit is required');
  });

  it('should create a new ModalsService', function () {
    expect(view._modals).toBeDefined();
  });

  describe('._initBinds', function () {
    it('should render the component when apiKeyModel changes', function () {
      apiKeyModel.set('token', 'this_is_a_new_token');
      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('when key is default', function () {
    describe('.render', function () {
      it('should render properly', function () {
        apiKeyModel.set('type', 'default');
        view.render();

        var editButton = view.$('.js-edit');
        expect(editButton.length).toBe(1);
        expect(editButton.text()).toBe(apiKeyModel.get('name'));

        var tokenNode = view.$('.js-token');
        expect(tokenNode.length).toBe(1);
        expect(tokenNode.text()).toBe(apiKeyModel.get('token'));

        expect(view.$('.js-regenerate').length).toBe(0);
        expect(view.$('.js-delete').length).toBe(0);
      });
    });
  });

  describe('when key is master', function () {
    describe('.render', function () {
      it('should render properly', function () {
        apiKeyModel.set('type', 'master');
        view.render();

        var editButton = view.$('.js-edit');
        expect(editButton.length).toBe(0);

        expect(view.$el.text()).toContain(apiKeyModel.get('name'));

        var tokenNode = view.$('.js-token');
        expect(tokenNode.length).toBe(1);
        expect(tokenNode.text()).toBe(apiKeyModel.get('token'));

        expect(view.$('.js-regenerate').length).toBe(1);
        expect(view.$('.js-delete').length).toBe(0);
      });
    });
  });

  describe('when key is regular', function () {
    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        var editButton = view.$('.js-edit');
        expect(editButton.length).toBe(1);
        expect(editButton.text()).toBe(apiKeyModel.get('name'));

        var tokenNode = view.$('.js-token');
        expect(tokenNode.length).toBe(1);
        expect(tokenNode.text()).toBe(apiKeyModel.get('token'));

        expect(view.$('.js-regenerate').length).toBe(1);
        expect(view.$('.js-delete').length).toBe(1);
      });
    });
  });

  describe('._onDeleteClick', function () {
    it('should create an AlertDialogView with deleteKeyTemplate', function () {
      spyOn(AlertDialogView.prototype, 'initialize').and.callThrough();

      view._onDeleteClick();
      expect(AlertDialogView.prototype.initialize).toHaveBeenCalledWith({
        modalModel: jasmine.any(Object),
        onSubmit: jasmine.any(Function),
        template: deleteKeyTemplate
      });
    });

    it('should call apiKeyModel.destroy', function () {
      view._onDeleteClick();
      document.querySelector('.Dialog .js-submit').click();

      expect(apiKeyModel.destroy).toHaveBeenCalled();
    });
  });

  describe('._onRegenerateClick', function () {
    it('should create an AlertDialogView with regenerateKeyTemplate', function () {
      spyOn(AlertDialogView.prototype, 'initialize').and.callThrough();

      view._onRegenerateClick();
      expect(AlertDialogView.prototype.initialize).toHaveBeenCalledWith({
        modalModel: jasmine.any(Object),
        onSubmit: jasmine.any(Function),
        template: regenerateKeyTemplate
      });
    });

    it('should call apiKeyModel.regenerate', function () {
      view._onRegenerateClick();
      document.querySelector('.Dialog .js-submit').click();

      expect(apiKeyModel.regenerate).toHaveBeenCalled();
    });
  });

  describe('._onCopyClick', function () {
    it('should copy api key token', function () {
      view.render();
      spyOn(document, 'execCommand');
      view._onCopyClick();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('._onItemClick', function () {
    it('should call _onEdit when the item is clicked', function () {
      view.render();
      view.$('.js-edit').click();

      expect(view._onEdit).toHaveBeenCalled();
    });
  });
});
