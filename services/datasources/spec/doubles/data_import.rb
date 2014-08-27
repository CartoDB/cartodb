module CartoDB
  module Datasources
    module Doubles
      class DataImport

        attr_accessor :id,
                      :service_item_id

        def initialize(attrs = {})
          @id = attrs.fetch(:id, '123456')
          @service_item_id = attrs.fetch(:service_item_id, '67890')
        end

        def save
          self
        end
      end
    end
  end
end