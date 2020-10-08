require 'oauth'

module Carto
  class DomainPatcherRequestProxy < OAuth::RequestProxy::RackRequest

    def uri
      super.sub('carto.com', 'cartodb.com')
    end

  end
end
