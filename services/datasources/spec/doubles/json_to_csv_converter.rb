module CartoDB
  module TwitterSearch
    module Doubles
      class JSONToCSVConverter

        def initialize(attrs = {})
        end

        def process(input_data = [], add_headers = false, additional_fields = {})
          input_data.join("\n")
        end

        def generate_headers(additional_fields = {})
          if additional_fields.nil? || additional_fields.empty?
            ''
          else
            additional_fields.join(',')
          end
        end
      end
    end
  end
end