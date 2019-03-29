const Backbone = require('backbone');
const AvatarSelector = require('dashboard/components/avatar-selector/avatar-selector-view');
const ConfigModel = require('fixtures/dashboard/config-model.fixture');
const AssetModel = require('dashboard/data/asset-model');

describe('dashboard/components/avatar-selector/avatar-selector-view', function () {
  let view;

  const createViewFn = function () {
    const view = new AvatarSelector({
      renderModel: new Backbone.Model({
        inputName: 'user[avatar_url]',
        name: 'test',
        avatar_url: 'avatar-url',
        id: 'uuuu-uuuu'
      }),
      configModel: ConfigModel
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.FormAccount-avatarPreviewImage').length).toBe(1);
    expect(view.$('.js-fileAvatar').length).toBe(1);
  });

  it('should disable input and show loader when file is chosen', function () {
    AssetModel.prototype.save = function (a, b, opts) {};

    view.$(':file').trigger('change');

    expect(view._model.get('state')).toBe('loading');
    expect(view.$('.btn[disabled]').length).toBe(1);
  });

  it('should enable input and remove loader when upload fails', function (done) {
    AssetModel.prototype.save = function (a, b, opts) {
      setTimeout(function () {
        b.error();
      }, 1);
    };

    view.$(':file').trigger('change');

    setTimeout(() => {
      expect(view._model.get('state')).toBe('error');
      expect(view.$('.btn[disabled]').length).toBe(0);
      expect(view.$('.FormAccount-rowInfoText--error').length).toBe(1);
      done();
    }, 100);
  });

  it('should enable input and remove loader when upload is completed', function (done) {
    AssetModel.prototype.save = function (a, b, opts) {
      setTimeout(function () {
        b.success(a, { public_url: 'hello' });
      }, 1);
    };

    view.$(':file').trigger('change');

    setTimeout(function () {
      expect(view._model.get('state')).toBe('success');
      expect(view.$('.FormAccount-rowInfoText--error').length).toBe(0);
      expect(view.$('img').attr('src')).toBe('hello');
      expect(view.$('.btn[disabled]').length).toBe(0);
      done();
    }, 100);
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
