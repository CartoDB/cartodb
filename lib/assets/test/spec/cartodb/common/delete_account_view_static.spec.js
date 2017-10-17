var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var DeleteAccountView = require('../../../../javascripts/cartodb/common/delete_account_view_static');

describe('common/delete_account_view_static', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    this.onErrorsSpy = jasmine.createSpy('onError');

    this.view = new DeleteAccountView({
      clean_on_hide: true,
      user: this.user,
      onError: this.onErrorsSpy
    });

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view._userModel).toBe(this.user);
    });
  });

  describe('.render_content', function () {
    it('should render properly', function () {
      expect(this.view.render_content()).toContain('<form accept-charset="UTF-8" action="/api/v3/me" method="post" class="js-form">');
    });

    describe('needs password confirmation', function () {
      beforeEach(function () {
        this.user.set('needs_password_confirmation', true);
      });

      it('should render properly', function () {
        var content = this.view.render_content();

        expect(content).toContain('In any case, you need to type your password.');
        expect(content).toContain('<input type="password" id="deletion_password_confirmation" name="deletion_password_confirmation" class="CDB-InputText CDB-Text Form-input Form-input--long" value=""/>');
      });
    });
  });

  describe('._onClickDelete', function () {
    beforeEach(function () {
      this.user = new cdb.admin.User({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'FREE'
      });

      this.onErrorsSpy = jasmine.createSpy('onError');

      this.view = new DeleteAccountView({
        clean_on_hide: true,
        user: this.user,
        onError: this.onErrorsSpy
      });

      this.view.render();
    });

    describe('success', function () {
      it('should should delete account', function () {
        spyOn(this.view, '_onSuccess');
        var event = $.Event('click');

        spyOn(this.view, 'killEvent');

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({ status: 200 });

        this.view._onClickDelete(event);

        expect(this.view.killEvent).toHaveBeenCalledWith(event);
        expect(this.view._onSuccess).toHaveBeenCalledWith(null, 'success', jasmine.any(Object));
      });
    });

    describe('error', function () {
      it('should fail', function () {
        spyOn(this.view, '_onError');
        var event = $.Event('click');

        spyOn(this.view, 'killEvent');

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({ status: 400 });

        this.view._onClickDelete(event);

        expect(this.view.killEvent).toHaveBeenCalledWith(event);
        expect(this.view._onError).toHaveBeenCalledWith(jasmine.any(Object), 'error', '');
      });
    });
  });

  describe('._onError', function () {
    it('should throw error and close', function () {
      spyOn(this.view, 'close');

      this.view._onError(jasmine.any(Object), 'error', '');

      expect(this.onErrorsSpy).toHaveBeenCalledWith(null, jasmine.any(Object));
      expect(this.view.close).toHaveBeenCalled();
    });
  });

  describe('._onSuccess', function () {
    it('should set href and close', function () {
      var logout_url = '/logout';

      spyOn(this.view, '_setHref');
      spyOn(this.view, 'close');

      this.view._onSuccess({ logout_url: logout_url }, 'success', jasmine.any(Object));

      expect(this.view._setHref).toHaveBeenCalledWith(logout_url);
      expect(this.view.close).toHaveBeenCalled();
    });
  });
});
