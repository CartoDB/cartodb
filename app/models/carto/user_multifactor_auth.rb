require 'rotp'
require 'rqrcode'

module Carto
  class UserMultifactorAuth < ActiveRecord::Base

    TYPE_TOTP = 'totp'.freeze
    VALID_TYPES = [TYPE_TOTP].freeze
    DRIFT = 60.seconds
    INTERVAL = 30.seconds
    ISSUER = 'CARTO'.freeze

    belongs_to :user, inverse_of: :user_multifactor_auths, foreign_key: :user_id

    validates :type, inclusion: { in: VALID_TYPES }

    before_create :create_shared_secret

    self.inheritance_column = :_type

    def verify!(code)
      timestamp = verify(code)
      raise Carto::UnauthorizedError.new('The code is not valid') unless timestamp
      update!(enabled: true, last_login: timestamp)
    end

    def disabled?
      !enabled
    end

    def needs_setup?
      disabled?
    end

    def provisioning_uri
      totp.provisioning_uri(user.username)
    end

    def qr_code
      qrcode = RQRCode::QRCode.new(totp.provisioning_uri(user.username))
      qrcode.as_png.to_data_url
    end

    private

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
      self.shared_secret = ROTP::Base32.random_base32
    end
  end
end
