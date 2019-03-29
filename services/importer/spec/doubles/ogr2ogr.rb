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

        def set_default_properties; end

        def generic_error?; end

        def encoding_error?; end

        def invalid_dates?; end

        def duplicate_column?; end

        def invalid_geojson?; end

        def too_many_columns?; end

        def unsupported_format?; end

        def file_too_big?; end

        def statement_timeout?; end

        def segfault_error?; end

        def kml_style_missing?; end

        def missing_srs?; end

        def geometry_validity_error?; end
      end
    end
  end
end
