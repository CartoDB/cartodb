const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const AvatarSelector = require('dashboard/components/avatar-selector/avatar-selector-view');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const template = require('./profile-form.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const utils = require('builder/helpers/utils');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'renderModel',
  'userModel',
  'modals',
  'setLoading',
  'onSaved',
  'onError'
];

// These lists must match the options of the correspondant Hubspot enumeration properties. They can be retrieved from:
// https://api.hubapi.com/properties/v1/contacts/properties/named/industry?hapikey=KEY
const INDUSTRIES = [
  'Architecture, Engineering and Construction', 'Banking and Financial Services', 'Cities and Government',
  'Consulting', 'CPG', 'Education and Research', 'Health and Medical', 'Insurance', 'Journalism and Media',
  'Manufacturing', 'Marketing and Advertising', 'Mining', 'Natural Resources and Environment', 'Non-Profit',
  'Real Estate', 'Retail', 'Software and Tech', 'Sports and Entertainment', 'Telecommunications',
  'Transportation and Logistics', 'Utilities', 'Other'
];

const COMPANY_EMPLOYEES_RANGES = ['1-5', '5-25', '25-50', '50-100', '100-500', '500-1000', '1000+'];

const USE_CASES = [
  'Catastrophe Analytics', 'Data Monetization', 'Fraud Detection', 'Geomarketing',
  'Healthcare and Social Factor Analysis', 'Indoor Mapping', 'Investment Analysis',
  'Logistics and Supply Chain Management', 'Mobility Planning', 'Network Deployment and Optimization', 'Risk Analysis',
  'Site Planning', 'Smart Cities and IOT', 'Territory Management', 'Other - My use case is not listed'
];

module.exports = CoreView.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._renderModel, 'change:isLoading', this.render);
  },

  render: function () {
    this.clearSubViews();

    if (this._renderModel.get('isLoading')) {
      this.$el.html(
        loadingTemplate({
          title: this._renderModel.get('loadingText'),
          descHTML: randomQuote()
        })
      );
    } else {
      this.$el.html(template({
        errors: this._renderModel.get('errors') || {},
        formAction: `${this._configModel.prefixUrl()}/profile`,
        accountHost: this._configModel.get('account_host'),
        user: {
          username: this._userModel.get('username'),
          name: this._userModel.get('name'),
          last_name: this._userModel.get('last_name'),
          email: this._userModel.get('email'),
          company: this._userModel.get('company'),
          job_role: this._userModel.get('job_role'),
          industry: this._userModel.get('industry'),
          company_employees: this._userModel.get('company_employees'),
          use_case: this._userModel.get('use_case'),
          phone: this._userModel.get('phone'),
          website: this._userModel.get('website'),
          location: this._userModel.get('location'),
          description: this._userModel.get('description'),
          twitter_username: this._userModel.get('twitter_username'),
          disqus_shortname: this._userModel.get('disqus_shortname'),
          available_for_hire: this._userModel.get('available_for_hire')
        },
        isViewer: this._userModel.isViewer(),
        isInsideOrg: this._userModel.isInsideOrg(),
        role: this._userModel.role(),
        hasOrganization: this._userModel.isInsideOrg(),
        organizationName: this._userModel.organization ? this._userModel.organization.get('name') : '',
        orgDisplayEmail: this._getOrgAdminEmail(),
        canChangeEmail: this._userModel.get('can_change_email'),
        industries: INDUSTRIES,
        company_employees_ranges: COMPANY_EMPLOYEES_RANGES,
        use_cases: USE_CASES,
        region: this._configModel.get('region')
      }));

      this._initViews();
    }

    return this;
  },

  _getOrgAdminEmail: function () {
    if (this._userModel.isInsideOrg()) {
      return this._userModel.organization.display_email;
    } else {
      return null;
    }
  },

  _initViews: function () {
    const avatarSelector = new AvatarSelector({
      el: this.$('.js-avatarSelector'),
      configModel: this._configModel,
      renderModel: new Backbone.Model({
        inputName: 'user[avatar_url]',
        name: this._userModel.get('name') || this._userModel.get('username'),
        avatar_url: this._userModel.get('avatar_url'),
        id: this._userModel.get('id'),
        username: this._userModel.get('username')
      }),
      acceptedExtensions: this._configModel.avatar_valid_extensions
    });
    avatarSelector.render();
    this.addView(avatarSelector);
  },

  _getUserFields: function () {
    return {
      description: this._userModel.get('description') || '',
      avatar_url: this._userModel.get('avatar_url') || '',
      name: this._userModel.get('name') || '',
      last_name: this._userModel.get('last_name') || '',
      email: this._userModel.get('email') || '',
      company: this._userModel.get('company') || '',
      phone: this._userModel.get('phone') || '',
      job_role: this._userModel.get('job_role') || '',
      industry: this._userModel.get('industry') || '',
      company_employees: this._userModel.get('company_employees') || '',
      use_case: this._userModel.get('use_case') || '',
      website: this._userModel.get('website') || '',
      twitter_username: this._userModel.get('twitter_username') || '',
      disqus_shortname: this._userModel.get('disqus_shortname') || '',
      available_for_hire: this._userModel.get('available_for_hire') || false,
      location: this._userModel.get('location') || ''
    };
  },

  _getDestinationValues: function () {
    return {
      description: utils.escapeHTML(this.$('#user_description').val()),
      avatar_url: utils.escapeHTML(this.$('#user_avatar_url').val()),
      name: utils.escapeHTML(this.$('#user_name').val()),
      last_name: utils.escapeHTML(this.$('#user_last_name').val()),
      email: utils.escapeHTML(this.$('#user_email').val()),
      company: utils.escapeHTML(this.$('#user_company').val()),
      phone: utils.escapeHTML(this.$('#user_phone').val()),
      job_role: utils.escapeHTML(this.$('#user_job_role').val()),
      industry: utils.escapeHTML(this.$('#user_industry').val()),
      company_employees: utils.escapeHTML(this.$('#user_company_employees').val()),
      use_case: utils.escapeHTML(this.$('#user_use_case').val()),
      website: utils.escapeHTML(this.$('#user_website').val()),
      twitter_username: utils.escapeHTML(this.$('#user_twitter_username').val()),
      disqus_shortname: utils.escapeHTML(this.$('#user_disqus_shortname').val()),
      available_for_hire: this.$('#available_for_hire').is(':checked'),
      location: utils.escapeHTML(this.$('#user_location').val())
    };
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    const origin = this._getUserFields();
    const destination = this._getDestinationValues();
    const destinationKeys = _.keys(destination);

    const differenceKeys = _.filter(destinationKeys, function (key) {
      return origin[key] !== destination[key];
    });

    const user = _.pick(destination, differenceKeys);

    this._userModel.set({ user: user });

    if (!this._userModel.get('needs_password_confirmation')) {
      return this._saveUser(user);
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: (password) => this._saveUser(user, password)
    });
  },

  _saveUser: function (userAttributes, password) {
    $('html, body').scrollTop(0);

    this._setLoading('Saving changes');

    this._userModel.save(userAttributes, {
      wait: true,
      url: this._configModel.prefixUrl() + '/api/v3/me',
      success: this._onSaved,
      error: this._onError,
      attrs: {
        user: {
          password_confirmation: password,
          ...userAttributes
        }
      }
    });
  }
});
