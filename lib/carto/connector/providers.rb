module Carto
  class Connector
    PROVIDERS = []

    DEFAULT_PROVIDER = nil # No default provider

    class << self
      def provider_class(provider_id)
        provider_data provider_id
      end

      def provider_public?(provider_id)
        provider_item provider_id, :public?
      end

      def provider_name(provider_id)
        provider_item provider_id, :friendly_name
      end

      def provider_ids
        PROVIDERS.map &:provider_id
      end

      private

      def provider_data(provider_id)
        provider_id ||= DEFAULT_PROVIDER
        PROVIDERS.find{|p| p.provider_id == provider_id}
      end

      def provider_item(provider_id, item)
        data = provider_data(provider_id)
        data&.send item.to_sym
      end
    end

  end
end
