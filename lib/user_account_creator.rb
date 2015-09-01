# coding: UTF-8

require_dependency 'google_plus_api'

module CartoDB
  class UserAccountCreator

    def initialize
      @built = false
      @organization = nil
      @google_user_data = nil
      @user = ::User.new
      @user_params = {}
    end

    def with_param(key, value)
      @user_params[key] = value
    end

    def with_organization(organization)
      @user = ::User.new_with_organization(organization)
      self
    end

    def user
      @user
    end

    def with_google_token(google_access_token)
      # get_user_data can return nil
      @google_user_data = GooglePlusAPI.new.get_user_data(google_access_token)
      self
    end

    def valid?
      build

      @user.valid? && @user.validate_credentials_not_taken_in_central
    end

    def validation_errors
      @user.errors
    end

    def enqueue_creation(current_controller)
      build

      user_creation = Carto::UserCreation.new_user_signup(@user)
      user_creation.save

      common_data_url = CartoDB::Visualization::CommonDataService.build_url(current_controller)
      ::Resque.enqueue(::Resque::UserJobs::Signup::NewUser, user_creation.id, common_data_url)

      {id: user_creation.id, username: user_creation.username}
    end

    private

    def build
      return if @built

      # TODO: Probably worth to reuse for ldap too
      if @google_user_data
        @google_user_data.set_values(@user)
      else
        @user.email = @user_params[:email]
        @user.password = @user_params[:password]
        @user.password_confirmation = @user_params[:password]
      end

      @user.username = @user_params[:username] if @user_params[:username]
    end

  end
end
