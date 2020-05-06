const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const ProfileFormView = require('dashboard/views/profile/profile-form/profile-form-view');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const UserModel = require('dashboard/data/user-model');
const modals = new ModalsServiceModel();

const DISPLAY_EMAIL = 'admin@carto.com';
const DESCRIPTION = 'description';
const AVATAR_URL = 'avatar_url';
const NAME = 'name';
const LAST_NAME = 'last_name';
const EMAIL = 'pepe@carto.com';
const COMPANY = 'CARTO';
const JOB_ROLE = 'Developer';
const INDUSTRY = 'GIS and Mapping';
const COMPANY_EMPLOYEES = '1-5';
const USE_CASE = 'Data Monetization';
const PHONE = '+34666666666';
const WEBSITE = 'website';
const TWITTER_USERNAME = 'twitter_username';
const DISQUS_SHORTNAME = 'disqus_shortname';
const AVAILABLE_FOR_HIRE = true;
const LOCATION = 'location';
const BUILDER_ROLE_DISPLAY = 'builder';
const VIEWER_ROLE_DISPLAY = 'viewer';
const CUSTOM_ROLE_DISPLAY = 'custom';
const PASSWORD = 'password';
const MALICIOUS_TEXT = '/><script>alert("wadus");</script>';
const ESCAPED_TEXT = '/&gt;&lt;script&gt;alert(&quot;wadus&quot;);&lt;/script&gt;';
const ESCAPED_TEXT_MAX = '/&gt;&lt;script&gt;alert(';

describe('dashboard/views/profile/profile-form/profile-form-view', function () {
  let userModel, model, configModel, view, setLoadingSpy, showSuccessSpy, showErrorsSpy;

  const createViewFn = function (options) {
    userModel = new UserModel(
      _.extend({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: EMAIL,
        account_type: 'FREE',
        job_role: JOB_ROLE,
        industry: INDUSTRY,
        company_employees: COMPANY_EMPLOYEES,
        use_case: USE_CASE,
        company: COMPANY,
        phone: PHONE,
        description: DESCRIPTION,
        avatar_url: AVATAR_URL,
        name: NAME,
        last_name: LAST_NAME,
        website: WEBSITE,
        twitter_username: TWITTER_USERNAME,
        disqus_shortname: DISQUS_SHORTNAME,
        available_for_hire: AVAILABLE_FOR_HIRE,
        location: LOCATION,
        viewer: false,
        role_display: BUILDER_ROLE_DISPLAY,
        needs_password_confirmation: true
      }, options)
    );

    setLoadingSpy = jasmine.createSpy('setLoading');
    showSuccessSpy = jasmine.createSpy('showSuccess');
    showErrorsSpy = jasmine.createSpy('showErrors');

    model = new Backbone.Model();

    configModel = new Backbone.Model({
      avatar_valid_extensions: ['jpeg', 'jpg', 'gif', 'png']
    });
    configModel.prefixUrl = () => '';

    const view = new ProfileFormView({
      userModel,
      configModel,
      setLoading: setLoadingSpy,
      onSaved: showSuccessSpy,
      onError: showErrorsSpy,
      renderModel: model,
      modals
    });

    return view;
  };

  beforeEach(function () {
    spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped(PASSWORD);
      }
    );

    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view.$el.html()).toContain('<form accept-charset="UTF-8" action="/profile" method="post">');
      expect(view.$el.html()).toContain('<div class="CDB-Text js-avatarSelector FormAccount-avatarSelector">');
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small u-rspace-s" id="user_name" name="user[name]" placeholder="profile.views.form.first_name" size="30" type="text" value="${NAME}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--small" id="user_last_name" name="user[last_name]" placeholder="profile.views.form.last_name" size="30" type="text" value="${LAST_NAME}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="user_email" name="user[email]" size="30" type="text" value="${EMAIL}" readonly="readonly">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_company" name="user[company]" size="30" type="text" value="${COMPANY}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_phone" name="user[phone]" size="30" type="text" value="${PHONE}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_website" name="user[website]" size="30" type="text" value="${WEBSITE}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_location" name="user[location]" size="30" type="text" value="${LOCATION}">`);
      expect(view.$el.html()).toContain(`<textarea class="CDB-Textarea CDB-Text FormAccount-textarea FormAccount-input FormAccount-input--totalwidth" cols="40" id="user_description" name="user[description]" rows="20">${DESCRIPTION}</textarea>`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_twitter_username" name="user[twitter_username]" size="30" type="text" value="${TWITTER_USERNAME}">`);
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_disqus_shortname" name="user[disqus_shortname]" placeholder="profile.views.form.disqus_placeholder" size="30" type="text" value="${DISQUS_SHORTNAME}">`);
      expect(view.$el.html()).toContain(`
        <input name="user[available_for_hire]" type="hidden" value="0">
        <input id="available_for_hire" name="user[available_for_hire]" type="checkbox" value="${AVAILABLE_FOR_HIRE}" checked="checked">
      `);
      expect(view.$el.html()).toContain('profile.views.form.builder');
      expect(view.$el.html()).toContain('profile.views.form.write_access');
      expect(view.$el.html()).toContain(`<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_job_role" name="user[job_role]" size="30" type="text" value="${JOB_ROLE}">`);

      // Industry
      const industryDropdown = view.$('#user_industry');
      expect(industryDropdown.find('option').length).toBe(24);
      expect(industryDropdown.find('option:checked').text()).toContain(INDUSTRY);
    });

    it('should render the company employees dropdown', function () {
      view.render();

      const companyEmployeesDropdown = view.$('#user_company_employees');
      expect(companyEmployeesDropdown.find('option').length).toBe(8);
      expect(companyEmployeesDropdown.find('option:checked').text()).toContain(COMPANY_EMPLOYEES);
    });

    it('should render the use case dropdown', function () {
      view.render();

      const useCaseDropdown = view.$('#user_use_case');
      expect(useCaseDropdown.find('option').length).toBe(16);
      expect(useCaseDropdown.find('option:checked').text()).toContain(USE_CASE);
    });
  });

  describe('escape inputs', function () {
    beforeEach(function () {
      view = createViewFn({
        name: MALICIOUS_TEXT,
        last_name: MALICIOUS_TEXT,
        email: MALICIOUS_TEXT,
        job_role: MALICIOUS_TEXT,
        company: MALICIOUS_TEXT,
        phone: MALICIOUS_TEXT,
        description: MALICIOUS_TEXT,
        avatar_url: MALICIOUS_TEXT,
        website: MALICIOUS_TEXT,
        twitter_username: MALICIOUS_TEXT,
        disqus_shortname: MALICIOUS_TEXT
      });
    });

    it('should escape the inputs when saving', function () {
      const event = $.Event('click');
      spyOn(view._userModel, 'save');

      view.render();
      view._onClickSave(event);

      const newUser = {
        description: ESCAPED_TEXT,
        avatar_url: ESCAPED_TEXT,
        name: ESCAPED_TEXT_MAX,
        last_name: ESCAPED_TEXT_MAX,
        email: ESCAPED_TEXT_MAX,
        company: ESCAPED_TEXT_MAX,
        phone: ESCAPED_TEXT_MAX,
        job_role: ESCAPED_TEXT_MAX,
        website: ESCAPED_TEXT_MAX,
        twitter_username: ESCAPED_TEXT_MAX,
        disqus_shortname: ESCAPED_TEXT_MAX
      };

      expect(view._userModel.save).toHaveBeenCalledWith(
        newUser,
        {
          wait: true,
          url: '/api/v3/me',
          success: showSuccessSpy,
          error: showErrorsSpy,
          attrs: {
            user: _.extend({ password_confirmation: PASSWORD }, newUser)
          }
        }
      );
    });
  });

  describe('errors', function () {
    describe('email', function () {
      describe('.render', function () {
        it('should render properly', function () {
          view._renderModel.set('errors', {
            email: ['error']
          });

          view.render();

          expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_email" name="user[email]" size="30" type="text" value="' + EMAIL + '" readonly="readonly">');
        });
      });
    });
  });

  describe('is viewer', function () {
    beforeEach(function () {
      spyOn(userModel, 'role').and.returnValue(VIEWER_ROLE_DISPLAY);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('profile.views.form.viewer');
        expect(view.$el.html()).toContain('profile.views.form.read_only');
      });
    });
  });

  describe('has custom role', function () {
    beforeEach(function () {
      spyOn(userModel, 'role').and.returnValue(CUSTOM_ROLE_DISPLAY);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();
        expect(view.$el.html()).toContain(CUSTOM_ROLE_DISPLAY);
      });
    });
  });

  describe('is viewer inside org', function () {
    beforeEach(function () {
      spyOn(userModel, 'role').and.returnValue(VIEWER_ROLE_DISPLAY);
      spyOn(userModel, 'isInsideOrg').and.returnValue(true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        spyOn(view, '_getOrgAdminEmail').and.returnValue(DISPLAY_EMAIL);

        view.render();

        expect(view.$el.html()).toContain(`<a href="mailto:${DISPLAY_EMAIL}">profile.views.form.become_builder</a>`);
      });
    });

    describe('._getOrgAdminEmail', function () {
      it('should get org admin email', function () {
        userModel.organization = {
          display_email: DISPLAY_EMAIL
        };

        expect(view._getOrgAdminEmail()).toBe(DISPLAY_EMAIL);
      });
    });
  });

  describe('can change email', function () {
    beforeEach(function () {
      userModel.set('can_change_email', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med" id="user_email" name="user[email]" size="30" type="text" value="' + EMAIL + '">');
      });
    });
  });

  describe('._getOrgAdminEmail', function () {
    it('should return null', function () {
      expect(view._getOrgAdminEmail()).toBeNull();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(view._userModel).toBe(userModel);
      expect(view._configModel).toBe(configModel);
      expect(view._renderModel).toEqual(model);
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      view.render();

      expect(_.size(view._subviews)).toBe(1);
    });

    it('should support previous job role values', function () {
      view = createViewFn({ job_role: 'unexpected value' });

      view.render();

      expect(view.$('#user_job_role').val()).toEqual('unexpected value');
    });

    it('should support previous industry values', function () {
      view = createViewFn({ industry: 'unexpected value' });
      view.render();

      expect(view.$('#user_industry').text()).toContain('unexpected value');
    });
  });

  describe('._getUserFields', function () {
    it('should get user fields', function () {
      expect(view._getUserFields()).toEqual({
        description: DESCRIPTION,
        avatar_url: AVATAR_URL,
        name: NAME,
        last_name: LAST_NAME,
        email: EMAIL,
        company: COMPANY,
        phone: PHONE,
        job_role: JOB_ROLE,
        industry: INDUSTRY,
        company_employees: COMPANY_EMPLOYEES,
        use_case: USE_CASE,
        website: WEBSITE,
        twitter_username: TWITTER_USERNAME,
        disqus_shortname: DISQUS_SHORTNAME,
        available_for_hire: AVAILABLE_FOR_HIRE,
        location: LOCATION
      });
    });
  });

  describe('._getDestinationValues', function () {
    const destDescription = '_description';
    const destAvatarUrl = '_avatar';
    const destName = '_name';
    const destLastName = '_last_name';
    const destEmail = '_email';
    const destCompany = '_company';
    const destPhone = '_phone';
    const destJobRole = 'Developer';
    const destIndustry = 'GIS and Mapping';
    const destCompanyEmployees = '1-5';
    const destUseCase = 'Data Monetization';
    const destWebsite = '_website';
    const destTwitterUsername = '_twitter_username';
    const destDisqusShortname = '_disqus_shortname';
    const destAvailableForHire = false;
    const destLocation = '_location';

    it('should get destination values', function () {
      view = createViewFn({
        description: destDescription,
        avatar_url: destAvatarUrl,
        name: destName,
        last_name: destLastName,
        email: destEmail,
        company: destCompany,
        phone: destPhone,
        job_role: destJobRole,
        industry: destIndustry,
        company_employees: destCompanyEmployees,
        use_case: destUseCase,
        website: destWebsite,
        twitter_username: destTwitterUsername,
        disqus_shortname: destDisqusShortname,
        available_for_hire: destAvailableForHire,
        location: destLocation
      });

      view.render();

      expect(view._getDestinationValues()).toEqual({
        description: destDescription,
        avatar_url: destAvatarUrl,
        name: destName,
        last_name: destLastName,
        email: destEmail,
        company: destCompany,
        phone: destPhone,
        job_role: destJobRole,
        industry: destIndustry,
        company_employees: destCompanyEmployees,
        use_case: destUseCase,
        website: destWebsite,
        twitter_username: destTwitterUsername,
        disqus_shortname: destDisqusShortname,
        available_for_hire: destAvailableForHire,
        location: destLocation
      });
    });
  });

  describe('._onClickSave', function () {
    it('should require password confirmation if needed', function () {
      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();
    });

    it('should bypass password confirmation when needs_password_validation is false', function () {
      PasswordValidatedForm.showPasswordModal.calls.reset();

      const nonPasswordView = createViewFn({
        needs_password_confirmation: false
      });

      nonPasswordView._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
    });

    it('should save user', function () {
      const destName = 'Carlos';
      const event = $.Event('click');

      spyOn(view, 'killEvent');
      spyOn(view, '_getUserFields').and.returnValue({
        name: NAME
      });
      spyOn(view, '_getDestinationValues').and.returnValue({
        name: destName
      });
      spyOn(view._userModel, 'set');
      spyOn(view._userModel, 'save');

      view._onClickSave(event);

      expect(view._userModel.set).toHaveBeenCalledWith({
        user: { name: destName }
      });

      expect(view.killEvent).toHaveBeenCalledWith(event);
      expect(view._userModel.save).toHaveBeenCalledWith(
        { name: destName },
        {
          wait: true,
          url: '/api/v3/me',
          success: showSuccessSpy,
          error: showErrorsSpy,
          attrs: {
            user: {
              password_confirmation: PASSWORD,
              name: destName
            }
          }
        });
    });
  });

  it('should not have leaks', function () {
    view.render();

    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
