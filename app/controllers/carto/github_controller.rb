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
        return redirect_to CartoDB.url(self, 'login')
      end

      redirect_to user.public_url << CartoDB.path(self, 'dashboard', trailing_slash: true)
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      redirect_to CartoDB.url(self, 'login')
    end

    private

    def initialize_github_config
      @after_creation_callback = params[:after]
      @github_config = Github::Config.instance(form_authenticity_token, after: @after_creation_callback)
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
