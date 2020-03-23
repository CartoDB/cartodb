module Carto
  class DbdirectCertificate < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_certificates, foreign_key: :user_id
    validates_uniqueness_of :name, scope: :user_id
    # TODO: validate ips

    scope :expired, -> { where('expiration <=', Date.today) }
    scope :valid, -> { where('expiration >', Date.today) }

    def revoke!
      config = DbdirectCertificate.config
      Carto::CertificateManager.revoke_certificate(config, arn)
      destroy!
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
        expiration: Date.today + validity_days  # TODO: extract from cert.?
      )

      return certificates, new_record
    end
  end
end
