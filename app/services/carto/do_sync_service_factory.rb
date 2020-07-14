module Carto
  class DoSyncServiceFactory
    DO_CONNECTOR_PROVIDER = 'do-v2'.freeze
    def self.get_for_user(user)
      connector = Carto::Connector.new(
        parameters: { provider: DO_CONNECTOR_PROVIDER, do_sync_service: true },
        user: user
      )
      connector.get_service(:do_sync_service)
    rescue Carto::Connector::InvalidParametersError # "Invalid provider: do-v2" or "Invalid connector service: do_sync_service"
      # Support for DO Sync not installed
      nil
    end
  end
end
