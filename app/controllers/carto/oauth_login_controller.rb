# encoding: UTF-8

require_dependency 'oauth/github/api'
require_dependency 'oauth/github/config'
require_dependency 'oauth/google/api'
require_dependency 'oauth/google/config'
require_dependency 'account_creator'

module Carto
  class OauthLoginController < ApplicationController
    include AccountCreator

    ssl_required  :github
    before_filter :initialize_github_config, only: [:github]
    before_filter :initialize_google_config, only: [:google]
    before_filter :validate_state

    layout 'frontend'

    # Callback from Github Oauth
    def github
      api = Github::Api.with_code(@github_config, params[:code])

      user = github_login(api)
      if user
        redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
      else
        signup(api)
      end
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      redirect_to CartoDB.url(self, 'login')
    end

    # Callback from Google Oauth
    def google
      api = Google::Api.with_code(@google_config, params[:code])

      user = google_login(api)
      if user
        redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
      else
        signup(api)
      end
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Google Oauth')
      redirect_to CartoDB.url(self, 'login')
    end

    private

    def initialize_github_config
      @github_config = Github::Config.instance(form_authenticity_token, self,
                                               organization_name: params[:organization],
                                               invitation_token: params[:invitation_token])
      @config = @github_config
    end

    def initialize_google_config
      @google_config = Google::Config.instance(form_authenticity_token, self,
                                               organization_name: params[:organization],
                                               invitation_token: params[:invitation_token])
      @config = @google_config
    end

    def validate_state
      return render_not_authorized(return_to: false) unless params[:code] && params[:state] == @config.client.state
    end

    def github_login(github_api)
      github_id = github_api.id
      user = User.where(github_user_id: github_id).first
      unless user
        user = User.where(email: github_api.email, github_user_id: nil).first
        return nil unless user
        user.update_column(:github_user_id, github_id)
        ::User[user.id].update_in_central
      end
      params[:github_api] = github_api
      authenticate!(:github_oauth, scope: user.username)
      CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)
      user
    end

    def google_login(google_api)
      user = User.where(email: google_api.email).first
      params[:google_api] = google_api
      authenticate!(:google_oauth, scope: user.username)
      CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)
      user
    end

    def auth_enabled(organization)
      if params[:action] == 'github'
        organization.auth_github_enabled?
      else
        organization.auth_google_enabled?
      end
    end

    def signup(api)
      org_name = params[:organization]
      @organization = ::Organization.where(name: org_name).first if org_name.present?
      return redirect_to CartoDB.url(self, 'login') unless @organization.present? && auth_enabled(@organization)

      account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                        with_organization(@organization).
                        with_invitation_token(params[:invitation_token]).
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
          @github_access_token = api.access_token
          flash.now[:error] = 'User not valid' if @user.errors.empty?
          return render('signup/signup', status: @user.errors.empty? ? 200 : 422)
        end
      end
    end
  end
end
