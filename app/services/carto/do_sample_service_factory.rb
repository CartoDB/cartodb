module Carto
  class DoSampleServiceFactory
    DO_SAMPLE_CONNECTOR_PROVIDER = 'do-v2-sample'.freeze
    def self.get_for_user(user)
      connector = Carto::Connector.new(
        parameters: { provider: DO_SAMPLE_CONNECTOR_PROVIDER, do_sample_service: true },
        user: user
      )
      connector.get_service(:do_sample_service)
    rescue Carto::Connector::InvalidParametersError # "Invalid provider: do-v2-sample" or "Invalid connector service: do_sample_service"
      # Support for DO Sample not installed
      nil
    end
  end
end
