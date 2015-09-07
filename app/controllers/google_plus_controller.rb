# encoding: UTF-8
require_dependency 'google_plus_api'

class GooglePlusController < ApplicationController

  layout 'frontend'
  before_filter :load_button_color

  def google_plus
    signup_url = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : CartoDB.path(self, 'google_plus_signup')
    @config = GooglePlusConfig.new(CartoDB, Cartodb.config, signup_url)
    render 'google_plus'
  end

  def google_signup
    user_data = GooglePlusAPI.new.get_user_data(params[:google_signup_access_token])
    throw 'illegal Google token' unless user_data.present?

    email = user_data.email
    username = user_data.auto_username

    existing_user = User.where("email = '#{email}' OR username = '#{username}'").first

    throw 'existing user' unless existing_user == nil

    user = User.new
    user_data.set_values(user)
    user.save(raise_on_failure: true)
    user.create_in_central

    common_data_url = CartoDB::Visualization::CommonDataService.build_url(self)
    user.load_common_data(common_data_url)

    redirect_to CartoDB.path(self, 'dashboard', {trailing_slash: true})
  end

  def load_button_color
    @button_color = params[:button_color].nil? ? nil : "##{params[:button_color].tr('^A-Za-z0-9', '')}"
  end
  
end
