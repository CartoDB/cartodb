require 'securerandom'
require_dependency 'carto/password_validator'
require_dependency 'carto/strong_password_strategy'
require_dependency 'carto/standard_password_strategy'
require_dependency 'dummy_password_generator'

# This class is quite coupled to UserCreation.
module CartoDB
  class UserAccountCreator
    include DummyPasswordGenerator

    PARAM_USERNAME = :username
    PARAM_EMAIL = :email
    PARAM_PASSWORD = :password

    # For user creations from orgs
    PARAM_SOFT_GEOCODING_LIMIT = :soft_geocoding_limit
    PARAM_SOFT_HERE_ISOLINES_LIMIT = :soft_here_isolines_limit
    PARAM_SOFT_TWITTER_DATASOURCE_LIMIT = :soft_twitter_datasource_limit
    PARAM_SOFT_MAPZEN_ROUTING_LIMIT = :soft_mapzen_routing_limit
    PARAM_QUOTA_IN_BYTES = :quota_in_bytes
    PARAM_VIEWER = :viewer
    PARAM_ORG_ADMIN = :org_admin

    def initialize(created_via)
      @built = false
      @organization = nil
      @google_user_data = nil
      @user = ::User.new
      @user_params = {}
      @custom_errors = {}
      @created_via = created_via
      @force_password_change = false
    end

    def with_username(value)
      with_param(PARAM_USERNAME, value)
    end

    def with_email(value)
      with_param(PARAM_EMAIL, value)
    end

    def with_password(value)
      with_param(PARAM_PASSWORD, value)
    end

    def with_soft_geocoding_limit(value)
      with_param(PARAM_SOFT_GEOCODING_LIMIT, value)
    end

    def with_soft_here_isolines_limit(value)
      with_param(PARAM_SOFT_HERE_ISOLINES_LIMIT, value)
    end

    def with_soft_twitter_datasource_limit(value)
      with_param(PARAM_SOFT_TWITTER_DATASOURCE_LIMIT, value)
    end

    def with_soft_mapzen_routing_limit(value)
      with_param(PARAM_SOFT_MAPZEN_ROUTING_LIMIT, value)
    end

    def with_quota_in_bytes(value)
      with_param(PARAM_QUOTA_IN_BYTES, value)
    end

    def with_viewer(value)
      with_param(PARAM_VIEWER, value)
    end

    def with_org_admin(value)
      with_param(PARAM_ORG_ADMIN, value)
    end

    def with_force_password_change
      @built = false
      @force_password_change = true
    end

    def with_organization(organization, viewer: false)
      @built = false
      @organization = organization
      @user = ::User.new_with_organization(organization, viewer: viewer)
      self
    end

    def with_invitation_token(invitation_token)
      @invitation_token = invitation_token
      self
    end

    def with_email_only(email)
      with_email(email)
      with_username(self.class.email_to_username(email))
      with_password(SecureRandom.hex)
      self
    end

    # Transforms an email address (e.g. firstname.lastname@example.com) into a string
    # which can serve as a subdomain.
    # firstname.lastname@example.com -> firstname-lastname
    # Replaces all non-allowable characters with
    # hyphens. This could potentially result in collisions between two specially-
    # constructed names (e.g. John Smith-Bob and Bob-John Smith).
    # We're ignoring this for now since this type of email is unlikely to come up.
    def self.email_to_username(email)
      email.strip.split('@')[0].gsub(/[^A-Za-z0-9-]/, '-').downcase
    end

    def self.random_saml_username
      SecureRandom.hex
    end

    def user
      @user
    end

    def with_oauth_api(oauth_api)
      @built = false
      @oauth_api = oauth_api
      self
    end

    def valid_creation?(creator_user)
      valid? && @user.valid_creation?(creator_user)
    end

    def valid?
      build

      if @organization
        if @organization.owner.nil?
          if !promote_to_organization_owner?
            @custom_errors[:organization] = ["Organization owner is not set. Administrator must login first."]
          end
        else
          validate_organization_soft_limits
        end

        password_validator = if requires_strong_password_validation?
                               Carto::PasswordValidator.new(Carto::StrongPasswordStrategy.new)
                             else
                               Carto::PasswordValidator.new(Carto::StandardPasswordStrategy.new)
                             end

        password = @user_params[PARAM_PASSWORD] || @user.password
        password_errors = password_validator.validate(password, password, @user)

        unless password_errors.empty?
          @custom_errors[:password] = [password_validator.formatted_error_message(password_errors)]
        end
      end

      if @force_password_change && @user.password_expiration_in_d.nil?
        @custom_errors[:force_password_change] = ['Cannot be set if password expiration is not configured']
      end

      @custom_errors[:oauth] = 'Invalid oauth' if @oauth_api && !@oauth_api.valid?(@user)

      @user.created_via = @created_via
      @user.valid? && @user.validate_credentials_not_taken_in_central && @custom_errors.empty?
    end

    def requires_strong_password_validation?
      @organization.strong_passwords_enabled && !generate_dummy_password?
    end

    def generate_dummy_password?
      @oauth_api || @google_user_data || VIAS_WITHOUT_PASSWORD.include?(@created_via)
    end

    VIAS_WITHOUT_PASSWORD = [
      Carto::UserCreation::CREATED_VIA_LDAP,
      Carto::UserCreation::CREATED_VIA_SAML
    ].freeze

    def validation_errors
      @user.errors.merge!(@custom_errors)
    end

    def enqueue_creation(current_controller)
      user_creation = build_user_creation

      user_creation.save

      common_data_url = CartoDB::Visualization::CommonDataService.build_url(current_controller)
      ::Resque.enqueue(::Resque::UserJobs::Signup::NewUser,
                       user_creation.id,
                       common_data_url,
                       promote_to_organization_owner?)

      { id: user_creation.id, username: user_creation.username }
    end

    def build_user_creation
      build

      user_creation = Carto::UserCreation.new_user_signup(@user, @created_via).with_invitation_token(@invitation_token)
      user_creation.viewer = true if user_creation.pertinent_invitation.try(:viewer?)

      user_creation
    end

    def build
      return if @built

      if generate_dummy_password?
        dummy_password = generate_dummy_password
        @user.password = dummy_password
        @user.password_confirmation = dummy_password
      end

      if @oauth_api
        @user.set(@oauth_api.user_params)
        @user.email = @user_params[PARAM_EMAIL] if @user_params[PARAM_EMAIL].present?
      else
        @user.email = @user_params[PARAM_EMAIL]
        @user.password = @user_params[PARAM_PASSWORD] if @user_params[PARAM_PASSWORD]
        @user.password_confirmation = @user_params[PARAM_PASSWORD] if @user_params[PARAM_PASSWORD]
      end

      @user.invitation_token = @invitation_token

      @user.username = @user_params[PARAM_USERNAME] if @user_params[PARAM_USERNAME]
      @user.soft_geocoding_limit = @user_params[PARAM_SOFT_GEOCODING_LIMIT] == 'true'
      @user.soft_here_isolines_limit = @user_params[PARAM_SOFT_HERE_ISOLINES_LIMIT] == 'true'
      @user.soft_twitter_datasource_limit = @user_params[PARAM_SOFT_TWITTER_DATASOURCE_LIMIT] == 'true'
      @user.soft_mapzen_routing_limit = @user_params[PARAM_SOFT_MAPZEN_ROUTING_LIMIT] == 'true'
      @user.quota_in_bytes = @user_params[PARAM_QUOTA_IN_BYTES] if @user_params[PARAM_QUOTA_IN_BYTES]
      @user.viewer = @user_params[PARAM_VIEWER] if @user_params[PARAM_VIEWER]
      @user.org_admin = @user_params[PARAM_ORG_ADMIN] if @user_params[PARAM_ORG_ADMIN]

      if @force_password_change && @user.password_expiration_in_d.present?
        @user.last_password_change_date = Date.today - @user.password_expiration_in_d - 1
      end

      @built = true
      @user
    end

    private

    # This is coupled to OrganizationUserController soft limits validations.
    def validate_organization_soft_limits
      owner = @organization.owner
      if @user_params[PARAM_SOFT_GEOCODING_LIMIT] == 'true' && !owner.soft_geocoding_limit
        @custom_errors[:soft_geocoding_limit] = ["Owner can't assign soft geocoding limit"]
      end
      if @user_params[PARAM_SOFT_HERE_ISOLINES_LIMIT] == 'true' && !owner.soft_here_isolines_limit
        @custom_errors[:soft_here_isolines_limit] = ["Owner can't assign soft here isolines limit"]
      end
      if @user_params[PARAM_SOFT_TWITTER_DATASOURCE_LIMIT] == 'true' && !owner.soft_twitter_datasource_limit
        @custom_errors[:soft_twitter_datasource_limit] = ["Owner can't assign soft twitter datasource limit"]
      end
      if @user_params[PARAM_SOFT_MAPZEN_ROUTING_LIMIT] == 'true' && !owner.soft_mapzen_routing_limit
        @custom_errors[:soft_mapzen_routing_limit] = ["Owner can't assign soft mapzen routing limit"]
      end
    end

    def with_param(key, value)
      @built = false
      @user_params[key] = value
      self
    end

    def promote_to_organization_owner?
      # INFO: Custom installs convention: org owner always has `<orgname>-admin` format
      !!(@organization && !@organization.owner_id && @user_params[PARAM_USERNAME] &&
        @user_params[PARAM_USERNAME] == "#{@organization.name}-admin")
    end
  end
end
