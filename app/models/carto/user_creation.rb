# encoding: UTF-8

class Carto::UserCreation < ActiveRecord::Base

  # INFO: we're not adding FKs because this is for monitoring and log purposes,
  # so we don't add relations either.
  belongs_to :log, class_name: Carto::Log

  def self.new_user_signup(user)
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

    after_transition :enqueuing => :creating_user, :do => :initialize_user
    after_transition :creating_user => :saving_user, :do => :save_user
    after_transition :saving_user => :creating_user_in_central, :do => :create_in_central
    after_transition :creating_user_in_central => :success, :do => :close_creation
    after_transition any => :failure, :do => :clean_user

    event :next_creation_step do
      transition :enqueuing => :creating_user,
          :creating_user => :saving_user,
          :saving_user => :creating_user_in_central,
          :creating_user_in_central => :success
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

  private

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
    @user.organization = ::Organization.where(id: self.organization_id).first
    @user.quota_in_bytes = self.quota_in_bytes unless self.quota_in_bytes.nil?
    @user.google_sign_in = self.google_sign_in
  rescue => e
    handle_failure(e)
  end

  def save_user
    @user.save(raise_on_failure: true)
    self.user_id = @user.id
    self.save
  rescue => e
    handle_failure(e)
  end

  def create_in_central
    @user.create_in_central
  rescue => e
    handle_failure(e)
  end

  def close_creation
    clean_password
    notify_new_organization_user
  rescue => e
    handle_failure(e, mark_as_failure = false)
  end

  def notify_new_organization_user
    @user.notify_new_organization_user
  end

  def handle_failure(e, mark_as_failure = false)
    CartoDB.notify_exception(e, { user_creation: self, mark_as_failure: mark_as_failure })
    self.log.append("Error on state #{self.state}, mark_as_failure: #{mark_as_failure}. Error: #{e.message}")
    self.log.append(e.backtrace.join("\n"))
    if mark_as_failure
      clean_password
      self.state = 'failure'
      self.save
    end
  end

  def clean_user
    return unless @user && @user.id != nil

    begin
      @user.destroy
    rescue => e
      CartoDB.notify_exception(e, { action: 'safe user destruction', user: @user } )
      begin
        @user.delete
      rescue => ee
        CartoDB.notify_exception(e, { action: 'safe user deletion', user: @user } )
      end

    end
  end

  def clean_password
    self.crypted_password = ''
    self.salt = ''
    self.save
  end

end
