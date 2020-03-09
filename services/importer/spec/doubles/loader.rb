module CartoDB
  module Importer2
    module Doubles
      class Loader
        attr_accessor :options

        def run(post_import_handler); Object.new; end

        def exit_code; 0; end

        def valid_table_names
          ['fake_table']
        end

        def additional_support_tables
          []
        end

      end # Loader
    end # Doubles
  end # Importer2
end # CartoDB

