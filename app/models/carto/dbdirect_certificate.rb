require 'carto/dbdirect/certificate_manager'

module Carto
  class DbdirectCertificate < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_certificates, foreign_key: :user_id
    validates_uniqueness_of :name, scope: :user_id

    scope :expired, -> { where('expiration <=', Time.current) }
    scope :valid, -> { where('expiration >', Time.current) }

    before_destroy :revoke

    def self.generate(user:, name:, passphrase: nil, validity_days: nil, server_ca: true, pk8: true)
      validity_days ||= config['maximum_validity_days']
      name = valid_name(user, name)

      certificates, arn = certificate_manager.generate_certificate(
        username: user.username,
        passphrase: passphrase,
        validity_days: validity_days,
        server_ca: server_ca,
        pk8: pk8
      )

      new_record = create(
        user_id: user.id,
        name: name,
        arn: arn,
        expiration: DateTime.now + validity_days  # TODO: extract from cert.?
      )

      return certificates, new_record
    end

    def self.default_validity
      config[:maximum_validity_days]
    end

    def self.certificate_manager
      certificate_manager_class.new(config)
    end

    def self.certificate_manager_class
      Carto::Dbdirect::CertificateManager
    end

    private

    def revoke
      self.class.certificate_manager.revoke_certificate(arn: arn)
    end

    class <<self
      private

      def config
        Cartodb.get_config(:dbdirect, 'certificates')
      end

      def certificate_names(user)
        Carto::User.find(user.id).dbdirect_certificates.map(&:name)
      end

      def valid_name(user, name)
        name = user.username if name.blank?
        names = certificate_names(user)
        return name unless name.in?(names)

        max_suffix = names.map do |existing_name|
          match = /\A#{Regexp.escape name}_(\d+)\Z/.match(existing_name)
          match ? match[1].to_i : 0
        end.max
        "#{name}_#{max_suffix + 1}"
      end
    end
  end
end
