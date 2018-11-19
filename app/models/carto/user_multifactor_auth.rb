require 'rotp'
require 'rqrcode'

module Carto
  class UserMultifactorAuth < ActiveRecord::Base

    TYPE_TOTP = 'totp'.freeze
    VALID_TYPES = [TYPE_TOTP].freeze
    DRIFT = 60.seconds
    INTERVAL = 30.seconds
    ISSUER = 'CARTO'.freeze
    QR_CODE_SIZE = 400

    belongs_to :user, inverse_of: :user_multifactor_auths, foreign_key: :user_id

    validates :type, inclusion: { in: VALID_TYPES }
    validates_uniqueness_of :type, scope: :user_id

    before_create :create_shared_secret
    after_save    :sync_central, unless: :skip_central_sync
    after_destroy :sync_central, unless: :skip_central_sync

    self.inheritance_column = :_type

    scope :enabled, -> { where(enabled: true) }
    scope :setup, -> { where(enabled: false) }

    attr_accessor :skip_central_sync

    def self.new_from_hash(uma_hash, skip_central_sync = true)
      new(
        created_at: uma_hash[:created_at],
        updated_at: uma_hash[:updated_at],
        last_login: uma_hash[:last_login],
        type: uma_hash[:type],
        shared_secret: uma_hash[:shared_secret],
        user_id: uma_hash[:user_id],
        enabled: uma_hash[:enabled],
        skip_central_sync: skip_central_sync
      )
    end

    def verify!(code)
      timestamp = verify(code)
      raise Carto::UnauthorizedError.new('The code is not valid') unless timestamp
      update!(enabled: true, last_login: timestamp)
    end

    def needs_setup?
      !enabled
    end

    def provisioning_uri
      totp.provisioning_uri(user.username)
    end

    def qr_code
      qrcode = RQRCode::QRCode.new(totp.provisioning_uri(user.username))
      qrcode.as_png(size: QR_CODE_SIZE).to_data_url
    end

    def to_h
      attributes.symbolize_keys
    end

    private

    def sync_central
      # due to AR/Sequel transactions the user might not exist in the database yet
      # this happens when cascade saving a new user with user_multifactor_auths (i.e. in user migrations)
      ::User[user.id].update_in_central
    end

    def last_login_in_seconds
      last_login.strftime('%s').to_i if last_login
    end

    def totp
      @totp ||= ROTP::TOTP.new(shared_secret, issuer: ISSUER, interval: INTERVAL)
    end

    def verify(code)
      timestamp = totp.verify_with_drift_and_prior(code.to_s, DRIFT, last_login_in_seconds)
      Time.at(timestamp) if timestamp
    end

    def create_shared_secret
      self.shared_secret = ROTP::Base32.random_base32 unless shared_secret.present?
    end
  end
end
