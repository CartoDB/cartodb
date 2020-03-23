module Carto
  class DbdirectCertificate < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_certificates, foreign_key: :user_id
    validates_uniqueness_of :name, scope: :user_id
    # TODO: validate ips

    scope :expired, -> { where('expiration <=', Date.today) }
    scope :valid, -> { where('expiration >', Date.today) }

    before_destroy :revoke

    def self.config
      Cartodb.get_config(:dbdirect, 'certificates')
    end

    def self.generate(user:, name:, passphrase: nil, ips: nil, validity_days: nil, server_ca: true)
      # TODO: check user authorization to generate certificate
      validity_days ||= config['maximum_validity_days']
      name = valid_name(user, name)

      certificates, arn = Carto::Dbdirect::CertificateManager.generate_certificate(
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

    private

    def revoke
      config = DbdirectCertificate.config
      Carto::Dbdirect::CertificateManager.revoke_certificate(config: config, arn: arn)
    end

    class <<self
      private

      def certificate_names(user)
        Carto::User.find(user.id).dbdirect_certificates.map &:name
      end

      def valid_name(user, name)
        name = user.username if name.blank?
        names = certificate_names(user)
        if name.in?(names)
          max_suffix = names.map do |existing_name|
            match = /\A#{Regexp.escape name}_(\d+)\Z/.match(existing_name)
            match ? match[1].to_i : 0
          end.max
          "#{name}_#{max_suffix + 1}"
        else
          name
        end
      end
    end
  end
end
