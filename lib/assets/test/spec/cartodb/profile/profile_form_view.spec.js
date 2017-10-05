var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ProfileFormView = require('../../../../javascripts/cartodb/profile/profile_form_view');

var DISPLAY_EMAIL = 'admin@carto.com';

var CONFIG = {
  avatar_valid_extensions: ['jpeg', 'jpg', 'gif', 'png']
};

describe('profile/profile_form_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      description: 'description',
      avatar_url: 'avatar_url',
      name: 'name',
      last_name: 'last_name',
      website: 'website',
      twitter_username: 'twitter_username',
      disqus_shortname: 'disqus_shortname',
      available_for_hire: true,
      location: 'location',
      viewer: false
    });

    this.setLoadingSpy = jasmine.createSpy('setLoading');
    this.showSuccessSpy = jasmine.createSpy('showSuccess');
    this.showErrorsSpy = jasmine.createSpy('showErrors');

    this.model = new cdb.core.Model();

    this.view = new ProfileFormView({
      user: this.user,
      config: CONFIG,
      setLoading: this.setLoadingSpy,
      onSaved: this.showSuccessSpy,
      onError: this.showErrorsSpy,
      renderModel: this.model
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<form accept-charset="UTF-8" action="/profile" method="post">');
      expect(this.view.$el.html()).toContain('<div class="CDB-Text js-avatarSelector FormAccount-avatarSelector">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small u-rspace-s" id="user_name" name="user[name]" placeholder="First name" size="30" type="text" value="name">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small" id="user_last_name" name="user[last_name]" placeholder="Last name" size="30" type="text" value="last_name">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_website" name="user[website]" size="30" type="text" value="website">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_location" name="user[location]" size="30" type="text" value="location">');
      expect(this.view.$el.html()).toContain('<textarea class="CDB-Textarea CDB-Text FormAccount-textarea FormAccount-input FormAccount-input--totalwidth" cols="40" id="user_description" name="user[description]" rows="20">description</textarea>');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_twitter_username" name="user[twitter_username]" size="30" type="text" value="twitter_username">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_disqus_shortname" name="user[disqus_shortname]" placeholder="If empty, it will not appear" size="30" type="text" value="disqus_shortname">');
      expect(this.view.$el.html()).toContain('<input name="user[available_for_hire]" type="hidden" value="0"><input id="available_for_hire" name="user[available_for_hire]" type="checkbox" value="true" checked="checked">');
      expect(this.view.$el.html()).toContain('BUILDER');
      expect(this.view.$el.html()).toContain('Write access for editing and building datasets and maps');
    });
  });

  describe('is viewer', function () {
    beforeEach(function () {
      this.user.set('viewer', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('VIEWER');
        expect(this.view.$el.html()).toContain('Read-only access for datasets and maps');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      spyOn(this.user, 'isInsideOrg').and.returnValue(true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        spyOn(this.user, 'isViewer').and.returnValue(true);
        spyOn(this.view, '_getOrgAdminEmail').and.returnValue('admin@carto.com');

        this.view.render();

        expect(this.view.$el.html()).toContain('<a href="mailto:admin@carto.com">Become a Builder</a>');
      });
    });

    describe('._getOrgAdminEmail', function () {
      it('should get org admin email', function () {
        this.user.organization = {
          display_email: DISPLAY_EMAIL
        };

        expect(this.view._getOrgAdminEmail()).toBe(DISPLAY_EMAIL);
      });
    });
  });

  describe('._getOrgAdminEmail', function () {
    it('should return null', function () {
      expect(this.view._getOrgAdminEmail()).toBeNull();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view.user).toEqual(this.user);
      expect(this.view.config).toEqual(CONFIG);
      expect(this.view.renderModel).toEqual(this.model);
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(1);
    });
  });

  describe('._getField', function () {
    it('should get field', function () {
      expect(this.view._getField('username')).toBe('pepe');
    });
  });

  describe('._getUserFields', function () {
    it('should get user fields', function () {
      expect(this.view._getUserFields()).toEqual({
        description: 'description',
        avatar_url: 'avatar_url',
        name: 'name',
        last_name: 'last_name',
        website: 'website',
        twitter_username: 'twitter_username',
        disqus_shortname: 'disqus_shortname',
        available_for_hire: true,
        location: 'location'
      });
    });
  });

  describe('._getDestinationValues', function () {
    it('should get destination values', function () {
      spyOn(this.view, '_description').and.returnValue('_description');
      spyOn(this.view, '_avatar').and.returnValue('_avatar_url');
      spyOn(this.view, '_name').and.returnValue('_name');
      spyOn(this.view, '_last_name').and.returnValue('_last_name');
      spyOn(this.view, '_website').and.returnValue('_website');
      spyOn(this.view, '_twitter_username').and.returnValue('_twitter_username');
      spyOn(this.view, '_disqus_shortname').and.returnValue('_disqus_shortname');
      spyOn(this.view, '_available_for_hire').and.returnValue(false);
      spyOn(this.view, '_location').and.returnValue('_location');

      expect(this.view._getDestinationValues()).toEqual({
        description: '_description',
        avatar_url: '_avatar_url',
        name: '_name',
        last_name: '_last_name',
        website: '_website',
        twitter_username: '_twitter_username',
        disqus_shortname: '_disqus_shortname',
        available_for_hire: false,
        location: '_location'
      });
    });
  });

  describe('._onClickSave', function () {
    it('should save users', function () {
      var event = $.Event('click');

      spyOn(this.view, 'killEvent');
      spyOn(this.view, '_getUserFields').and.returnValue({
        name: 'name'
      });
      spyOn(this.view, '_getDestinationValues').and.returnValue({
        name: 'Carlos'
      });
      spyOn(this.view.user, 'save');

      this.view._onClickSave(event);

      expect(this.view.killEvent).toHaveBeenCalledWith(event);
      expect(this.view.user.save).toHaveBeenCalledWith({
        user: {
          name: 'Carlos'
        }
      }, {
        wait: true,
        url: '/api/v3/me',
        success: this.showSuccessSpy,
        error: this.showErrorsSpy
      });
    });
  });

  describe('._description', function () {
    it('should return user description', function () {
      this.view.render();

      expect(this.view._description()).toBe('description');
    });
  });

  describe('._avatar', function () {
    it('should return user avatar', function () {
      this.view.render();

      expect(this.view._avatar()).toBe('avatar_url');
    });
  });

  describe('._name', function () {
    it('should return user name', function () {
      this.view.render();

      expect(this.view._name()).toBe('name');
    });
  });

  describe('._last_name', function () {
    it('should return user last name', function () {
      this.view.render();

      expect(this.view._last_name()).toBe('last_name');
    });
  });

  describe('._website', function () {
    it('should return user website', function () {
      this.view.render();

      expect(this.view._website()).toBe('website');
    });
  });

  describe('._twitter_username', function () {
    it('should return user twitter username', function () {
      this.view.render();

      expect(this.view._twitter_username()).toBe('twitter_username');
    });
  });

  describe('._disqus_shortname', function () {
    it('should return user disqus shortname', function () {
      this.view.render();

      expect(this.view._disqus_shortname()).toBe('disqus_shortname');
    });
  });

  describe('._available_for_hire', function () {
    it('should return user available for hire', function () {
      this.view.render();

      expect(this.view._available_for_hire()).toBe(true);
    });
  });

  describe('._location', function () {
    it('should return user location', function () {
      this.view.render();

      expect(this.view._location()).toBe('location');
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
