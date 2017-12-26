var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var DeleteAccountView = require('../../../../javascripts/cartodb/common/delete_account_view_static');
var CartoNode = require('../../../../../../vendor/assets/javascripts/carto-node/carto-node');
var client = new CartoNode.AuthenticatedClient();

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
      onError: this.onErrorsSpy,
      client: client
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
      expect(this.view.$('.js-form')).toBeDefined();
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
      this.onErrorsSpy = jasmine.createSpy('onError');

      this.user = new cdb.admin.User({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'FREE'
      });

      this.view = new DeleteAccountView({
        clean_on_hide: true,
        user: this.user,
        onError: this.onErrorsSpy,
        client: client
      });

      this.view.render();
    });

    describe('success', function () {
      it('should should delete account', function () {
        var successResponse = {
          message: 'Success'
        };

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({
            status: 200,
            contentType: 'application/json; charset=utf-8',
            responseText: JSON.stringify(successResponse)
          });

        spyOn(this.view, '_onSuccess');
        var event = $.Event('click');

        spyOn(this.view, 'killEvent');

        this.view._onClickDelete(event);

        expect(this.view.killEvent).toHaveBeenCalledWith(event);
        expect(this.view._onSuccess).toHaveBeenCalledWith(successResponse);
      });
    });

    describe('error', function () {
      it('should fail', function () {
        var errorResponse = {
          message: 'Error'
        };

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({
            status: 400,
            contentType: 'application/json; charset=utf-8',
            responseText: JSON.stringify(errorResponse)
          });

        spyOn(this.view, '_onError');

        var event = $.Event('click');

        spyOn(this.view, 'killEvent');

        this.view._onError({}, errorResponse);
        this.view._onClickDelete(event);

        expect(this.view.killEvent).toHaveBeenCalledWith(event);
        expect(this.view._onError).toHaveBeenCalledWith({}, errorResponse);
      });
    });
  });

  describe('._onError', function () {
    var errorResponse = {
      message: 'Error'
    };

    jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
      .andReturn({
        status: 400,
        contentType: 'application/json; charset=utf-8',
        responseText: JSON.stringify(errorResponse)
      });

    it('should throw error and close', function () {
      spyOn(this.view, 'close');

      this.view._onError({}, errorResponse);

      expect(this.onErrorsSpy).toHaveBeenCalledWith({}, errorResponse);
      expect(this.view.close).toHaveBeenCalled();
    });
  });

  describe('._onSuccess', function () {
    it('should set href and close', function () {
      var successResponse = {
        message: 'Success',
        logout_url: '/logout'
      };

      jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
        .andReturn({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          responseText: JSON.stringify(successResponse)
        });

      var logout_url = '/logout';

      spyOn(this.view, '_setHref');
      spyOn(this.view, 'close');

      this.view._onSuccess({ logout_url: logout_url }, 'success', jasmine.any(Object));

      expect(this.view._setHref).toHaveBeenCalledWith(logout_url);
      expect(this.view.close).toHaveBeenCalled();
    });
  });
});
