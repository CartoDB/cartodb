# encoding: UTF-8

require_dependency 'oauth/github/api'
require_dependency 'oauth/github/config'

module Carto
  class GithubController < ApplicationController
    ssl_required  :github
    before_filter :initialize_github_config

    layout 'frontend'

    # Callback from Github Oauth
    def github
      code = params[:code]
      state = params[:state]
      return render_403 unless code && state == @github_config.state
      api = Github::Api.with_code(@github_config, code)

      user = login(api)
      if user
        redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
      else
        signup(api)
      end
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      redirect_to CartoDB.path(self, 'login')
    end

    private

    def initialize_github_config
      @github_config = Github::Config.instance(form_authenticity_token)
    end

    def login(github_api)
      github_id = github_api.id
      user = User.where(github_user_id: github_id).first
      unless user
        user = User.where(email: github_api.email, github_user_id: nil).first
        return nil unless user
        user.update_column(:github_user_id, github_id)
      end
      params[:github_api] = github_api
      authenticate!(:github_oauth, scope: user.username)
      CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)
      user
    end

    def signup(api)
      org_name = params[:organization]
      @organization = ::Organization.where(name: org_name).first if org_name.present?
      return redirect_to CartoDB.path(self, 'login') unless @organization.present? && @organization.auth_github_enabled

      account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                        with_organization(@organization).
                        with_invitation_token(params[:invitation_token]).
                        with_github_oauth_api(api)

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
