module Carto
  class DbdirectCertificate < ActiveRecord::Base
    STATE_ACTIVE = 'active'.freeze
    STATE_REVOKED = 'revoked'.freeze

    belongs_to :user, inverse_of: :dbdirect_certificates, foreign_key: :user_id
    validates_uniqueness_of :name, scope: :user_id
    # TODO: validate ips

    scope :active, -> { where(state: STATE_ACTIVE) }
    scope :revoked, -> { where(state: STATE_REVOKED) }

    def revoke!
      config = DbdirectCertificate.config
      Carto::CertificateManager.generate_certificate(config, arn)
      update! state: STATE_REVOKED
    end

    def self.config
      Cartodb.get_config(:dbdirect, 'certificates')
    end

    def self.generate(user:, name:, passphrase: nil, ips: nil, validity_days: nil, server_ca: true)
      validity_days ||= config[:maximum_validity_days]

      certificates, arn = Carto::CertificateManager.generate_certificate(
        config: config,
        username: user.username,
        passphrase: passphrase,
        ips: ips,
        validity_days: validity_days,
        server_ca: server_ca
      )

      new_record = create(
        user_id: user.id,
        name: name,
        arn: arn,
        ips: ips,
        expiration: Date.today + validity_days,  # TODO: extract from cert.?
        state: STATE_ACTIVE
      )

      return certificates, new_record
    end
  end
end
