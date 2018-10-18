var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ProfileFormView = require('../../../../javascripts/cartodb/profile/profile_form_view');

var DISPLAY_EMAIL = 'admin@carto.com';
var DESCRIPTION = 'description';
var AVATAR_URL = 'avatar_url';
var NAME = 'name';
var LAST_NAME = 'last_name';
var WEBSITE = 'website';
var TWITTER_USERNAME = 'twitter_username';
var DISQUS_SHORTNAME = 'disqus_shortname';
var AVAILABLE_FOR_HIRE = true;
var LOCATION = 'location';

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
      description: DESCRIPTION,
      avatar_url: AVATAR_URL,
      name: NAME,
      last_name: LAST_NAME,
      website: WEBSITE,
      twitter_username: TWITTER_USERNAME,
      disqus_shortname: DISQUS_SHORTNAME,
      available_for_hire: AVAILABLE_FOR_HIRE,
      location: LOCATION,
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
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small u-rspace-s" id="user_name" name="user[name]" placeholder="profile.views.form.first_name" size="30" type="text" value="' + NAME + '">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small" id="user_last_name" name="user[last_name]" placeholder="profile.views.form.last_name" size="30" type="text" value="' + LAST_NAME + '">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_website" name="user[website]" size="30" type="text" value="' + WEBSITE + '">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_location" name="user[location]" size="30" type="text" value="' + LOCATION + '">');
      expect(this.view.$el.html()).toContain('<textarea class="CDB-Textarea CDB-Text FormAccount-textarea FormAccount-input FormAccount-input--totalwidth" cols="40" id="user_description" name="user[description]" rows="20">' + DESCRIPTION + '</textarea>');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_twitter_username" name="user[twitter_username]" size="30" type="text" value="' + TWITTER_USERNAME + '">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_disqus_shortname" name="user[disqus_shortname]" placeholder="profile.views.form.disqus_placeholder" size="30" type="text" value="' + DISQUS_SHORTNAME + '">');
      expect(this.view.$el.html()).toContain('<input name="user[available_for_hire]" type="hidden" value="0"><input id="available_for_hire" name="user[available_for_hire]" type="checkbox" value="' + AVAILABLE_FOR_HIRE + '" checked="checked">');
      expect(this.view.$el.html()).toContain('profile.views.form.builder');
      expect(this.view.$el.html()).toContain('profile.views.form.write_access');
    });
  });

  describe('is viewer', function () {
    beforeEach(function () {
      this.user.set('viewer', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('profile.views.form.viewer');
        expect(this.view.$el.html()).toContain('profile.views.form.read_only');
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
        spyOn(this.view, '_getOrgAdminEmail').and.returnValue(DISPLAY_EMAIL);

        this.view.render();

        expect(this.view.$el.html()).toContain('<a href="mailto:' + DISPLAY_EMAIL + '">profile.views.form.become_builder</a>');
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
      expect(this.view._userModel).toBe(this.user);
      expect(this.view.config).toBe(CONFIG);
      expect(this.view._renderModel).toEqual(this.model);
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
        description: DESCRIPTION,
        avatar_url: AVATAR_URL,
        name: NAME,
        last_name: LAST_NAME,
        website: WEBSITE,
        twitter_username: TWITTER_USERNAME,
        disqus_shortname: DISQUS_SHORTNAME,
        available_for_hire: AVAILABLE_FOR_HIRE,
        location: LOCATION
      });
    });
  });

  describe('._getDestinationValues', function () {
    var destDescription = '_description';
    var destAvatarUrl = '_avatar';
    var destName = '_name';
    var destLastName = '_last_name';
    var destWebsite = '_website';
    var destTwitterUsername = '_twitter_username';
    var destDisqusShortname = '_disqus_shortname';
    var destAvailableForHire = false;
    var destLocation = '_location';

    it('should get destination values', function () {
      spyOn(this.view, '_description').and.returnValue(destDescription);
      spyOn(this.view, '_avatar').and.returnValue(destAvatarUrl);
      spyOn(this.view, '_name').and.returnValue(destName);
      spyOn(this.view, '_last_name').and.returnValue(destLastName);
      spyOn(this.view, '_website').and.returnValue(destWebsite);
      spyOn(this.view, '_twitter_username').and.returnValue(destTwitterUsername);
      spyOn(this.view, '_disqus_shortname').and.returnValue(destDisqusShortname);
      spyOn(this.view, '_available_for_hire').and.returnValue(destAvailableForHire);
      spyOn(this.view, '_location').and.returnValue(destLocation);

      expect(this.view._getDestinationValues()).toEqual({
        description: destDescription,
        avatar_url: destAvatarUrl,
        name: destName,
        last_name: destLastName,
        website: destWebsite,
        twitter_username: destTwitterUsername,
        disqus_shortname: destDisqusShortname,
        available_for_hire: destAvailableForHire,
        location: destLocation
      });
    });
  });

  describe('._onClickSave', function () {
    it('should save user', function () {
      var destName = 'Carlos';
      var event = $.Event('click');

      spyOn(this.view, 'killEvent');
      spyOn(this.view, '_getUserFields').and.returnValue({
        name: NAME
      });
      spyOn(this.view, '_getDestinationValues').and.returnValue({
        name: destName
      });
      spyOn(this.view._userModel, 'save');

      this.view._onClickSave(event);

      expect(this.view.killEvent).toHaveBeenCalledWith(event);
      expect(this.view._userModel.save).toHaveBeenCalledWith({
        user: {
          name: destName
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

      expect(this.view._description()).toBe(DESCRIPTION);
    });
  });

  describe('._avatar', function () {
    it('should return user avatar', function () {
      this.view.render();

      expect(this.view._avatar()).toBe(AVATAR_URL);
    });
  });

  describe('._name', function () {
    it('should return user name', function () {
      this.view.render();

      expect(this.view._name()).toBe(NAME);
    });
  });

  describe('._last_name', function () {
    it('should return user last name', function () {
      this.view.render();

      expect(this.view._last_name()).toBe(LAST_NAME);
    });
  });

  describe('._website', function () {
    it('should return user website', function () {
      this.view.render();

      expect(this.view._website()).toBe(WEBSITE);
    });
  });

  describe('._twitter_username', function () {
    it('should return user twitter username', function () {
      this.view.render();

      expect(this.view._twitter_username()).toBe(TWITTER_USERNAME);
    });
  });

  describe('._disqus_shortname', function () {
    it('should return user disqus shortname', function () {
      this.view.render();

      expect(this.view._disqus_shortname()).toBe(DISQUS_SHORTNAME);
    });
  });

  describe('._available_for_hire', function () {
    it('should return user available for hire', function () {
      this.view.render();

      expect(this.view._available_for_hire()).toBe(AVAILABLE_FOR_HIRE);
    });
  });

  describe('._location', function () {
    it('should return user location', function () {
      this.view.render();

      expect(this.view._location()).toBe(LOCATION);
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
