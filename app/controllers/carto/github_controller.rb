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
      unless user
        # Signup
        org_name = params[:organization]
        @organization = ::Organization.where(name: org_name).first if org_name.present?
        return redirect_to CartoDB.url(self, 'login') unless @organization.present? && @organization.auth_github_enabled

        account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                          with_organization(@organization).
                          with_invitation_token(params[:invitation_token])

        account_creator.with_github_oauth_api(api)

        if account_creator.valid?
          trigger_account_creation(account_creator)
          return render('shared/signup_confirmation')
        else
          @user = account_creator.user
          errors = account_creator.validation_errors
          CartoDB.notify_debug('User not valid at signup', { errors: errors } )
          if errors['organization'] && !errors[:organization].empty?
            @signup_source = 'Organization'
            return render('shared/signup_issue')
          else
            if @user.errors.empty?
              # No need for additional errors if there're field errors
              flash.now[:error] = 'User not valid'
            end
            return render('signup/signup', status: @user.errors.empty? ? 200 : 422)
          end
        end
      end

      redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      redirect_to CartoDB.url(self, 'login')
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
  end
end
