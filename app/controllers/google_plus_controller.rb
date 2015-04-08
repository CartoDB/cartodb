# encoding: UTF-8
require_relative '../../lib/google_plus_api'

class GooglePlusController < ApplicationController

  layout 'frontend'

  def google_plus
    @config = GooglePlusConfig.new(CartoDB, Cartodb.config, Cartodb::Central.new.google_signup_url)
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
    dummy_password = (0...15).map { ('a'..'z').to_a[rand(26)] }.join
    user.password = dummy_password
    user.password_confirmation = dummy_password
    user.save(raise_on_failure: true)
    user.create_in_central

    redirect_to CartoDB.path(self, 'dashboard', {trailing_slash: true})
  end
  
end
