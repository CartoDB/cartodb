# encoding: UTF-8

class Carto::UserCreation < ActiveRecord::Base

  belongs_to :log, class_name: Carto::Log

  def self.new_user_signup(user)
    # Normal validation breaks state_machine method generation
    raise 'User needs an organization' unless user.organization
    raise 'User needs username' unless user.username
    raise 'User needs email' unless user.email

    user_creation = Carto::UserCreation.new
    user_creation.username = user.username
    user_creation.email = user.email
    user_creation.crypted_password = user.crypted_password
    user_creation.salt = user.salt
    user_creation.organization_id = user.organization.id
    user_creation.quota_in_bytes = user.quota_in_bytes
    user_creation.google_sign_in = user.google_sign_in
    user_creation.log = Carto::Log.new_user_creation

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

      transition :promoting_user => :creating_user_in_central, :creating_user_in_central => :load_common_data, :load_common_data => :success, :if => :sync_data_with_cartodb_central?

      transition :promoting_user => :load_common_data, :load_common_data => :success, :unless => :sync_data_with_cartodb_central?
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
    self.google_sign_in != true && !Carto::Ldap::Manager.new.configuration_present?
  end

  private

  def user
    @user ||= ::User.where(id: user_id).first
  end

  # INFO: state_machine needs guard methods to be instance methods
  def sync_data_with_cartodb_central?
    Cartodb::Central.sync_data_with_cartodb_central?
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
    @user = ::User.new
    @user.username = self.username
    @user.email = self.email
    @user.crypted_password = self.crypted_password
    @user.salt = self.salt
    @user.quota_in_bytes = self.quota_in_bytes unless self.quota_in_bytes.nil?
    @user.google_sign_in = self.google_sign_in
    @user.enable_account_token = User.make_token if requires_validation_email?
    unless @promote_to_organization_owner
      @user.organization = ::Organization.where(id: self.organization_id).first
      @user.organization.owner.copy_account_features(@user)
    end
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  # Central validation
  def validate_user
    @user.validate_credentials_not_taken_in_central
    raise "Credentials already used" unless @user.errors.empty?
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def save_user
    # INFO: until here we haven't user_id, so in-memory @user is needed. After this, self.user is used, which can be either @user or loaded from database. This enables resuming.
    @user.save(raise_on_failure: true)
    self.user_id = @user.id
    self.save
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def promote_user
    return unless @promote_to_organization_owner
    user_organization = CartoDB::UserOrganization.new(self.organization_id, @user.id)
    user_organization.promote_user_to_admin
    @user.reload
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def load_common_data
    @user.load_common_data(@common_data_url) unless @common_data_url.nil?
  rescue => e
    handle_failure(e, mark_as_failure = false)
  end

  def create_in_central
    user.create_in_central
  rescue => e
    handle_failure(e, mark_as_failure = true)
  end

  def close_creation
    clean_password
    user.notify_new_organization_user
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
    return unless user && user.id != nil

    begin
      user.destroy
    rescue => e
      CartoDB.notify_exception(e, { action: 'safe user destruction', user: user } )
      begin
        user.delete
      rescue => ee
        CartoDB.notify_exception(ee, { action: 'safe user deletion', user: user } )
      end

    end
  end

  def clean_password
    self.crypted_password = ''
    self.salt = ''
    self.save
  end

end
