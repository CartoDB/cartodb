# encoding: UTF-8
require_dependency 'carto/user_authenticator'

class Carto::UserCreation < ActiveRecord::Base
  include Carto::UserAuthenticator

  # Synced with CartoGearsApi::Events::UserCreationEvent
  CREATED_VIA_SAML = 'saml'.freeze
  CREATED_VIA_LDAP = 'ldap'.freeze
  CREATED_VIA_ORG_SIGNUP = 'org_signup'.freeze
  CREATED_VIA_API = 'api'.freeze
  CREATED_VIA_HTTP_AUTENTICATION = 'http_authentication'.freeze

  VALID_CREATED_VIA = [
    CREATED_VIA_LDAP, CREATED_VIA_SAML, CREATED_VIA_ORG_SIGNUP,
    CREATED_VIA_API, CREATED_VIA_HTTP_AUTENTICATION
  ].freeze

  IN_PROGRESS_STATES = [:initial, :enqueuing, :creating_user, :validating_user, :saving_user, :promoting_user, :load_common_data, :creating_user_in_central]
  FINAL_STATES = [:success, :failure]

  scope :http_authentication, where(created_via: CREATED_VIA_HTTP_AUTENTICATION)
  scope :in_progress, where(state: IN_PROGRESS_STATES)

  belongs_to :log, class_name: Carto::Log
  belongs_to :user, class_name: Carto::User

  after_create :use_invitation

  def self.new_user_signup(user, created_via = CREATED_VIA_ORG_SIGNUP)
    # Normal validation breaks state_machine method generation
    raise 'User needs username' unless user.username
    raise 'User needs email' unless user.email
    raise "Not valid #{created_via}: #{VALID_CREATED_VIA.join(', ')}" unless VALID_CREATED_VIA.include?(created_via)

    user_creation = Carto::UserCreation.new
    user_creation.username = user.username
    user_creation.email = user.email
    user_creation.crypted_password = user.crypted_password
    user_creation.salt = user.salt
    user_creation.organization_id = user.organization.nil? ? nil : user.organization.id
    user_creation.quota_in_bytes = user.quota_in_bytes
    user_creation.soft_geocoding_limit = user.soft_geocoding_limit
    user_creation.soft_here_isolines_limit = user.soft_here_isolines_limit
    user_creation.soft_obs_snapshot_limit = user.soft_obs_snapshot_limit
    user_creation.soft_obs_general_limit = user.soft_obs_general_limit
    user_creation.soft_twitter_datasource_limit = user.soft_twitter_datasource_limit.nil? ? false : user.soft_twitter_datasource_limit
    user_creation.soft_mapzen_routing_limit = user.soft_mapzen_routing_limit
    user_creation.google_sign_in = user.google_sign_in
    user_creation.github_user_id = user.github_user_id
    user_creation.log = Carto::Log.new_user_creation
    user_creation.created_via = created_via
    user_creation.viewer = user.viewer || false
    user_creation.org_admin = user.org_admin || false

    user_creation
  end

  state_machine :state, :initial => :enqueuing do

    before_transition any => any, :do => :log_transition_begin
    after_transition any => any, :do => :log_transition_end

    after_failure do
      self.fail_user_creation
    end

    after_transition any => :creating_user, :do => :initialize_user
    after_transition any => :validating_user, :do => :validate_user
    after_transition any => :saving_user, :do => :save_user
    after_transition any => :promoting_user, :do => :promote_user
    after_transition any => :load_common_data, :do => :load_common_data
    after_transition any => :creating_user_in_central, :do => :create_in_central

    before_transition any => :success, :do => :close_creation
    before_transition any => :failure, :do => :clean_user

    event :next_creation_step do
      transition :enqueuing => :creating_user,
          :creating_user => :validating_user,
          :validating_user => :saving_user,
          :saving_user => :promoting_user

      # This looks more complex than it actually is. The flow is always:
      # promoting_user -> creating_user_in_central -> load_common_data -> success
      #   creating_user_in_central is skipped if central is not configured
      #   load_common_data is skipped for viewers
      transition promoting_user: :creating_user_in_central, if: :sync_data_with_cartodb_central?
      transition promoting_user: :load_common_data, unless: :viewer?
      transition promoting_user: :success

      transition creating_user_in_central: :load_common_data, unless: :viewer?
      transition creating_user_in_central: :success

      transition load_common_data: :success
    end

    event :fail_user_creation do
      transition any => :failure
    end

    state all - [:success, :failure] do
      def finished?
        false
      end
    end

    state :success, :failure do
      def finished?
        true
      end
    end

  end

  def set_owner_promotion(promote_to_organization_owner)
    @promote_to_organization_owner = promote_to_organization_owner
  end

  def set_common_data_url(common_data_url)
    @common_data_url = common_data_url
  end

  # TODO: Shorcut, search for a better solution to detect requirement
  def requires_validation_email?
    google_sign_in != true &&
      !github_user_id &&
      !has_valid_invitation? &&
      !Carto::Ldap::Manager.new.configuration_present? &&
      !created_via_api? &&
      !created_via_http_authentication? &&
      !created_via_saml?
  end

  def autologin?
    state == 'success' && created_at > Time.now - 1.minute && enabled? && cartodb_user.dashboard_viewed_at.nil?
  end

  def subdomain
    cartodb_user.subdomain
  end

  def with_invitation_token(invitation_token)
    self.invitation_token = invitation_token
    self
  end

  def created_via_api?
    created_via == CREATED_VIA_API
  end

  def created_via_http_authentication?
    created_via == CREATED_VIA_HTTP_AUTENTICATION
  end

  def created_via_saml?
    created_via == CREATED_VIA_SAML
  end

  def has_valid_invitation?
    return false unless invitation_token
    !valid_invitation.nil?
  end

  def pertinent_invitation
    @pertinent_invitation ||= select_valid_invitation_token(Carto::Invitation.query_with_unused_email(email).all)
  end

  private

  def enabled?
    cartodb_user.enable_account_token.nil? && cartodb_user.enabled
  end

  def valid_invitation
    select_valid_invitation_token(Carto::Invitation.query_with_valid_email(email).all)
  end

  # Returns the first matching token invitation, and raises error if none is found
  # but a token is set, since it might be fake
  def select_valid_invitation_token(invitations)
    return nil if invitations.empty?

    invitation = invitations.select do |i|
      i.token(email) == invitation_token &&
      organization_id == i.organization_id
    end.first

    raise "Fake token sent for email #{email}, #{invitation_token}" if invitation_token && invitation.nil?

    invitation
  end

  def cartodb_user
    @cartodb_user ||= ::User.where(id: user_id).first
  end

  def log_transition_begin
    log_transition('Beginning')
  end

  def log_transition_end
    log_transition('End')
  end

  def log_transition(prefix)
    self.log.append("#{prefix}: State: #{self.state}")
  end

  def initialize_user
    @cartodb_user = ::User.new
    @cartodb_user.username = username
    @cartodb_user.email = email
    @cartodb_user.crypted_password = crypted_password
    @cartodb_user.salt = salt
    @cartodb_user.google_sign_in = google_sign_in
    @cartodb_user.github_user_id = github_user_id
    @cartodb_user.invitation_token = invitation_token
    @cartodb_user.enable_account_token = make_token if requires_validation_email?

    unless organization_id.nil? || @promote_to_organization_owner
      organization = ::Organization.where(id: organization_id).first
      raise "Trying to copy organization settings from one without owner" if organization.owner.nil?
      @cartodb_user.organization = organization
      @cartodb_user.organization.owner.copy_account_features(@cartodb_user)
    end

    @cartodb_user.quota_in_bytes = quota_in_bytes unless quota_in_bytes.nil?
    @cartodb_user.soft_geocoding_limit = soft_geocoding_limit unless soft_geocoding_limit.nil?
    @cartodb_user.soft_here_isolines_limit = soft_here_isolines_limit unless soft_here_isolines_limit.nil?
    @cartodb_user.soft_obs_snapshot_limit = soft_obs_snapshot_limit unless soft_obs_snapshot_limit.nil?
    @cartodb_user.soft_obs_general_limit = soft_obs_general_limit unless soft_obs_general_limit.nil?
    @cartodb_user.soft_twitter_datasource_limit = soft_twitter_datasource_limit unless soft_twitter_datasource_limit.nil?
    @cartodb_user.soft_mapzen_routing_limit = soft_mapzen_routing_limit unless soft_mapzen_routing_limit.nil?
    @cartodb_user.viewer = viewer if viewer
    @cartodb_user.org_admin = org_admin if org_admin

    if pertinent_invitation
      @cartodb_user.viewer = pertinent_invitation.viewer
    end

    @cartodb_user
  rescue => e
    handle_failure(e, mark_as_failure = true)
    nil
  end

  # Central validation
  def validate_user
    @cartodb_user.validate_credentials_not_taken_in_central
    raise "Credentials already used" unless @cartodb_user.errors.empty?
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def save_user
    # INFO: until here we haven't user_id, so in-memory @cartodb_user is needed.
    # After this, self.cartodb_user is used, which can be either @cartodb_user or loaded from database.
    # This enables resuming.
    @cartodb_user.save(raise_on_failure: true)
    self.user_id = @cartodb_user.id
    self.save
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def use_invitation
    return unless invitation_token
    invitation = pertinent_invitation
    return unless invitation

    invitation.use(email, invitation_token)
  end

  def promote_user
    return unless @promote_to_organization_owner

    organization = ::Organization.where(id: self.organization_id).first
    raise "Trying to set organization owner when there's already one" unless organization.owner.nil?

    user_organization = CartoDB::UserOrganization.new(organization_id, @cartodb_user.id)
    user_organization.promote_user_to_admin
    @cartodb_user.reload
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def load_common_data
    @cartodb_user.load_common_data(@common_data_url) unless @common_data_url.nil?
  rescue => e
    handle_failure(e, mark_as_failure = false)
  end

  def create_in_central
    cartodb_user.create_in_central
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def close_creation
    clean_password
    cartodb_user.notify_new_organization_user unless has_valid_invitation?
    cartodb_user.organization.notify_if_disk_quota_limit_reached if cartodb_user.organization
    cartodb_user.organization.notify_if_seat_limit_reached if cartodb_user.organization
    CartoGearsApi::Events::EventManager.instance.notify(
      CartoGearsApi::Events::UserCreationEvent.new(created_via, cartodb_user)
    )
  rescue => e
    handle_failure(e, mark_as_failure = false)
  end

  def handle_failure(e, mark_as_failure)
    CartoDB.notify_exception(e, { user_creation: self, mark_as_failure: mark_as_failure })
    self.log.append("Error on state #{self.state}, mark_as_failure: #{mark_as_failure}. Error: #{e.message}")
    self.log.append(e.backtrace.join("\n"))

    process_failure if mark_as_failure
  end

  def process_failure
    self.state = 'failure'
    self.save
    self.fail_user_creation
  end

  def clean_user
    return unless cartodb_user && !cartodb_user.id.nil?

    begin
      cartodb_user.destroy
    rescue => e
      CartoDB.notify_exception(e, action: 'safe user destruction', user: cartodb_user)
      begin
        cartodb_user.delete
      rescue => ee
        CartoDB.notify_exception(ee, action: 'safe user deletion', user: cartodb_user)
      end

    end
  end

  def clean_password
    self.crypted_password = ''
    self.salt = ''
    self.save
  end

  # INFO: state_machine needs guard methods to be instance methods
  def sync_data_with_cartodb_central?
    Cartodb::Central.sync_data_with_cartodb_central?
  end
end
