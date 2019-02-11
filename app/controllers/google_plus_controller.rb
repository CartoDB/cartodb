# encoding: UTF-8
require_dependency 'google_plus_api'

class GooglePlusController < ApplicationController
  include DummyPasswordGenerator

  layout 'frontend'

  def google_plus
    headers['X-Frame-Options'] = 'SAMEORIGIN'
    signup_url = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : CartoDB.path(self, 'google_plus_signup')
    @config = GooglePlusConfig.new(CartoDB, Cartodb.config, signup_url)
    render 'google_plus'
  end

  def google_signup
    api = Carto::Oauth::Api::Google.new(nil, params[:google_signup_access_token])
    user_data = api.user_params

    create_user(user_data)

    common_data_url = CartoDB::Visualization::CommonDataService.build_url(self)
    user.load_common_data(common_data_url)

    CartoGearsApi::Events::EventManager.instance.notify(
      CartoGearsApi::Events::UserCreationEvent.new(
        CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_ORG_SIGNUP, user
      )
    )

    redirect_to CartoDB.path(self, 'dashboard', trailing_slash: true)
  end

  private

  def create_user(user_data)
    email = user_data.email
    username = user_data.username

    throw 'illegal Google token' unless email.present?

    existing_user = ::User.where("email = '#{email}' OR username = '#{username}'").first
    throw 'existing user' unless existing_user == nil

    user = ::User.new(username: username, email: email, google_sign_in: true)

    dummy_password = generate_dummy_password
    user.password = dummy_password
    user.password_confirmation = dummy_password

    user.save(raise_on_failure: true)
    user.create_in_central
  end
end
