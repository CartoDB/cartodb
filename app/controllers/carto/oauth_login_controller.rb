# encoding: UTF-8

require_dependency 'carto/oauth/github/api'
require_dependency 'carto/oauth/github/config'
require_dependency 'carto/oauth/google/api'
require_dependency 'carto/oauth/google/config'
require_dependency 'account_creator'

module Carto
  class OauthLoginController < ApplicationController
    include AccountCreator

    ssl_required  :github, :google
    before_filter :load_parameters
    before_filter :initialize_github_config, only: [:github]
    before_filter :initialize_google_config, only: [:google]

    layout 'frontend'

    # Callback from Github Oauth
    def github
      process_oauth_callback
    end

    # Callback from Google Oauth
    def google
      process_oauth_callback
    end

    private

    def process_oauth_callback
      api = @config.class.api_class.with_code(@config, params[:code])

      user = login(api)
      if user
        redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
      else
        signup(api)
      end
    rescue StandardError => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Oauth')
      redirect_to CartoDB.url(self, 'login')
    end

    def load_parameters
      state = JSON.parse(params[:state]).symbolize_keys
      @organization_name = state[:organization_name]
      @invitation_token = state[:invitation_token]

      return render_403 unless params[:code] && state[:csrf] == form_authenticity_token
    end

    def initialize_github_config
      @config = Carto::Oauth::Github::Config.instance(form_authenticity_token, github_url,
                                                      organization_name: @organization_name,
                                                      invitation_token: @invitation_token)
    end

    def initialize_google_config
      @config = Carto::Oauth::Google::Config.instance(form_authenticity_token, google_oauth_url,
                                                      organization_name: @organization_name,
                                                      invitation_token: @invitation_token)
    end

    def login(api)
      user = api.user
      return false unless user

      params[:oauth_api] = api
      authenticate!(:oauth, scope: user.username)

      CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)
      user
    end

    def signup(api)
      org_name = @organization_name
      @organization = ::Organization.where(name: org_name).first if org_name.present?
      unless @organization.present? && api.config.auth_enabled?(@organization)
        return redirect_to CartoDB.url(self, 'login')
      end

      account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                        with_organization(@organization).
                        with_invitation_token(@invitation_token).
                        with_oauth_api(api)

      if account_creator.valid?
        trigger_account_creation(account_creator)
        return render('shared/signup_confirmation')
      else
        @user = account_creator.user
        errors = account_creator.validation_errors

        if errors[:organization].present?
          @signup_source = 'Organization'
          return render('shared/signup_issue')
        else
          @oauth_fields = api.hidden_fields
          flash.now[:error] = 'User not valid' if @user.errors.empty?
          return render('signup/signup', status: @user.errors.empty? ? 200 : 422)
        end
      end
    end
  end
end
