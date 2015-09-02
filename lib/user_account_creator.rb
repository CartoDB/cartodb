# coding: UTF-8

require_dependency 'google_plus_api'

module CartoDB
  class UserAccountCreator

    PARAM_USERNAME = :username
    PARAM_EMAIL = :email
    PARAM_PASSWORD = :password

    def initialize
      @built = false
      @organization = nil
      @google_user_data = nil
      @user = ::User.new
      @user_params = {}
      @custom_errors = {}
    end

    def with_param(key, value)
      @user_params[key] = value
    end

    def with_organization(organization)
      @organization = organization
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

      if @organization && @organization.owner.nil? && !promote_to_organization_owner?
        @custom_errors[:organization] = ["owner is not set. Organization administrator must login first before other accounts can be used in the system"]
      end

      @user.valid? && @user.validate_credentials_not_taken_in_central && @custom_errors.keys.length == 0
    end

    def validation_errors
      @user.errors.merge!(@custom_errors)
    end

    def enqueue_creation(current_controller)
      build

      user_creation = Carto::UserCreation.new_user_signup(@user)
      user_creation.save

      common_data_url = CartoDB::Visualization::CommonDataService.build_url(current_controller)
      ::Resque.enqueue(::Resque::UserJobs::Signup::NewUser, user_creation.id, common_data_url,
        promote_to_organization_owner?)

      {id: user_creation.id, username: user_creation.username}
    end

    private

    def promote_to_organization_owner?
      !!(@organization && !@organization.owner_id && @user_params[PARAM_USERNAME] &&
        @user_params[PARAM_USERNAME] == "#{@organization.name}-admin")
    end

    def build
      return if @built

      if @google_user_data
        @google_user_data.set_values(@user)
      else
        @user.email = @user_params[PARAM_EMAIL]
        @user.password = @user_params[PARAM_PASSWORD]
        @user.password_confirmation = @user_params[PARAM_PASSWORD]
      end

      @user.username = @user_params[PARAM_USERNAME] if @user_params[PARAM_USERNAME]
    end

  end
end
