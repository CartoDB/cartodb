module CartoDB
  module Datasources
    module Doubles
      class Organization

        attr_accessor :twitter_datasource_enabled

        def initialize(attrs = {})
          @twitter_datasource_enabled = attrs.fetch(:twitter_datasource_enabled, true)
        end

        def save
          self
        end
      end
    end
  end
end