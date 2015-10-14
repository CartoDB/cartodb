require_relative 'ogrinfo'

module CartoDB
  module Importer2

    class Ogr2ogrParamsHelper

      LATITUDE_POSSIBLE_NAMES = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat point_latitude }
      LONGITUDE_POSSIBLE_NAMES = %w{ longitude lon lng
        longitudedecimal longitud long decimallongitude decimallong point_longitude }
      GEOMETRY_POSSIBLE_NAMES = %w{ geometry the_geom wkb_geometry geom geojson wkt }


      attr_accessor :input_file_path, :quoted_fields_guessing, :layer


      def initialize(input_file_path, quoted_fields_guessing, layer)
        self.input_file_path = input_file_path
        self.quoted_fields_guessing = quoted_fields_guessing
        self.layer = layer
      end

      # This method is responsible for providing correct params for csv guessing.
      # It assumes the input file is a csv and csv_guessing is enabled.
      def guessing_args
        [
          '-oo AUTODETECT_TYPE=YES',
          quoted_fields_as_string_option,
          x_y_possible_names_option,
          '-s_srs EPSG:4326 -t_srs EPSG:4326',
          '-skipfailure',
          geom_possible_names_option,
          keep_geom_columns_option
        ].join(' ')
      end

      def geometry_name_option
        if shall_geometry_collumn_be_the_geom?
          '-lco GEOMETRY_NAME=the_geom'
        else
          ''
        end
      end


      private

      def ogrinfo
        @ogrinfo ||= OgrInfo.new(input_file_path, layer)
      end

      def quoted_fields_as_string_option
        # Inverse of the selection: if I want guessing I must NOT leave quoted fields as string
        "-oo QUOTED_FIELDS_AS_STRING=#{quoted_fields_guessing ? 'NO' : 'YES' }"
      end

      def x_y_possible_names_option
        if use_x_y_possible_names_option?
          "-oo X_POSSIBLE_NAMES=#{LONGITUDE_POSSIBLE_NAMES.join(',')} -oo Y_POSSIBLE_NAMES=#{LATITUDE_POSSIBLE_NAMES.join(',')}"
        else
          ''
        end
      end

      def geom_possible_names_option
        if use_geom_possible_names?
          "-oo GEOM_POSSIBLE_NAMES=#{GEOMETRY_POSSIBLE_NAMES.join(',')}"
        else
          ''
        end
      end

      # INFO: this option is specific to CSV files
      def keep_geom_columns_option
        "-oo KEEP_GEOM_COLUMNS=#{keep_geom_columns? ? 'YES' : 'NO'}"
      end

      def use_geom_possible_names?
        (ogrinfo.fields & GEOMETRY_POSSIBLE_NAMES) != []
      end

      def use_x_y_possible_names_option?
        !use_geom_possible_names? &&
          ((ogrinfo.fields & LATITUDE_POSSIBLE_NAMES) != []) &&
          ((ogrinfo.fields & LONGITUDE_POSSIBLE_NAMES) != [])
      end

      def keep_geom_columns?
        !use_geom_possible_names? && !use_x_y_possible_names_option?
      end

      def shall_geometry_collumn_be_the_geom?
        # INFO: Avoid "ERROR:  column "the_geom" specified more than once"
        ogrinfo.geometry_column != 'the_geom'
      end

    end

  end
end
