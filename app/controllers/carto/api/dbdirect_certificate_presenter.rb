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
          expiration: @dbdirect_certificate.expiration.to_datetime.rfc3339
        }
      end
    end
  end
end
