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
        render text: "Org signup"
      end
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Error logging in via Github Oauth')
      render_403
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
        return false unless user
        user.update_column(:github_user_id, github_id)
      end

      authenticate_session(Session.authenticated(user))
    end
  end
end
