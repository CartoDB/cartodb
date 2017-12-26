module CartoDB
  module Datasources
    module Doubles
      class SearchTweet

        attr_accessor :user_id,
                      :data_import_id,
                      :service_item_id,
                      :retrieved_items,
                      :state

        def set_importing_state
          @state = 'importing'
        end

        def set_complete_state
          @state = 'complete'
        end

        def save
          self
        end
      end
    end
  end
end