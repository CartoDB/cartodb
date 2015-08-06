# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Ogr2ogr
        attr_accessor :exit_code, :command, :command_output, :csv_guessing, :overwrite, :encoding, :shape_encoding
        def initialize
          self.exit_code = 0
          self.command = String.new
          self.command_output = String.new
        end
        def run(append_mode=false)
          Object.new
        end

        def set_default_properties; return; end

        def generic_error?; return; end
        def encoding_error?; return; end
        def invalid_dates?; return; end
        def duplicate_column?; return; end
        def invalid_geojson?; return; end
        def too_many_columns?; return; end
        def unsupported_format?; return; end
        def file_too_big?; return; end
        def statement_timeout?; return; end
        def segfault_error?; return; end
        def kml_style_missing?; return; end
      end
    end
  end
end

