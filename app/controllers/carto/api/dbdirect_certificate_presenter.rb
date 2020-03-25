require 'json'

module Carto
  module Api
    class DbdirectCertificatePresenter
      def initialize(dbdirect_certificate)
        @dbdirect_certificate = dbdirect_certificate
      end

      def to_poro
        return {} unless @dbdirect_certificate

        {
          id: @dbdirect_certificate.id,
          name: @dbdirect_certificate.name,
          expiration: @dbdirect_certificate.expiration.rfc3339,
          ips: @dbdirect_certificate.ips
        }
      end
    end
  end
end
