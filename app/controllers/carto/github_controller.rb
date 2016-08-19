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
      return render_not_authorized unless code && state == @github_config.state
      api = Github::Api.with_code(@github_config, code)
      unless login(api)
        price_plan = @plan_recurly_code.present? ? PricePlan.find_by_recurly_plan_code(@plan_recurly_code) : nil
        price_plan = choose_allowed_price_plan(price_plan)
        price_plan_id = price_plan.id

        user_params = {
          username: api.username,
          email: api.email,
          github_user_id: api.id
        }
        @user = build_user(user_params)
        if @user.valid?
          create_user(user: @user, price_plan_id: price_plan_id)
        else
          @user.price_plan_id = price_plan_id
          @github_access_token = api.access_token
          render 'users/signup'
        end
      end
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      return render_not_authorized
    end

    private

    def initialize_github_config
      @after_creation_callback = params[:after]
      @plan_recurly_code = params[:plan]
      @github_config = Github::Config.instance(form_authenticity_token, github_url,
                                               plan: @plan_recurly_code, after: @after_creation_callback)
    end

    def login(github_api)
      github_id = github_api.id
      user = User.where(github_user_id: github_id).first
      unless user
        user = User.where(email: github_api.email, github_user_id: nil).first
        return false unless user
        user.update_column(:github_user_id, github_id)
      end

      authenticate_session(Session.authenticated(user))
    end
  end
end
