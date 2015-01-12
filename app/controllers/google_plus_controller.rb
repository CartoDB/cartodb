# encoding: UTF-8
require_relative '../../lib/google_plus_api'
require_relative '../../lib/google_plus_config'

class GooglePlusController < ApplicationController

  layout 'front_layout'

  def google_plus
    @config = GooglePlusConfig.new(Cartodb.config, Cartodb::Central.new.google_signup_url)
    render 'google_plus'
  end

  def google_signup
    user_data = GooglePlusAPI.new.get_user_data(params[:google_signup_access_token])
    throw 'illegal Google token' unless user_data.present?

    email = user_data.email
    username = email.split('@')[0]

    existing_user = User.where("email = '#{email}' OR username = '#{username}'").first

    throw 'existing user' unless existing_user == nil

    user = User.new
    user.username = username
    user.email = email
    user.password = 'dummy'
    user.password_confirmation = 'dummy'
    user.save(raise_on_failure: true)
    user.create_in_central

    redirect_to dashboard_path(user_domain: user.subdomain, trailing_slash: true)
  end
  
end
