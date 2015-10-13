require_relative 'ogrinfo'

module CartoDB
  module Importer2

    # This class is responsible for providing correct params for csv guessing.
    # It assumes the input file is a csv and csv_guessing is enabled.
    class Ogr2ogrGuessingParams

      LATITUDE_POSSIBLE_NAMES = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat point_latitude }
      LONGITUDE_POSSIBLE_NAMES = %w{ longitude lon lng
        longitudedecimal longitud long decimallongitude decimallong point_longitude }
      GEOMETRY_POSSIBLE_NAMES = %w{ geometry the_geom wkb_geometry geom geojson wkt }

      def self.geom_possible_names_option
        "-oo GEOM_POSSIBLE_NAMES=#{GEOMETRY_POSSIBLE_NAMES.join(',')}"
      end


      attr_accessor :input_file_path, :quoted_fields_guessing


      def initialize(input_file_path, quoted_fields_guessing)
        self.input_file_path = input_file_path
        self.quoted_fields_guessing = quoted_fields_guessing
      end

      def params
        "-oo AUTODETECT_TYPE=YES #{quoted_fields_as_string_option} " +
          "#{x_y_possible_names_option} -s_srs EPSG:4326 -t_srs EPSG:4326 " +
          "-skipfailure " +
          "#{self.class.geom_possible_names_option} " +
          "#{keep_geom_columns_option}"
      end

      def quoted_fields_as_string_option
        # Inverse of the selection: if I want guessing I must NOT leave quoted fields as string
        "-oo QUOTED_FIELDS_AS_STRING=#{quoted_fields_guessing ? 'NO' : 'YES' }"
      end

      def x_y_possible_names_option
        "-oo X_POSSIBLE_NAMES=#{LONGITUDE_POSSIBLE_NAMES.join(',')} -oo Y_POSSIBLE_NAMES=#{LATITUDE_POSSIBLE_NAMES.join(',')}"
      end

      def keep_geom_columns_option
        "-oo KEEP_GEOM_COLUMNS=#{keep_geom_column? ? 'YES' : 'NO'}"
      end

      def keep_geom_column?
        # INFO: Avoid "ERROR:  column "the_geom" specified more than once"
        ogrinfo = OgrInfo.new(input_file_path)
        ogrinfo.geometry_column != 'the_geom' || ogrinfo.geometry_type == 'Unknown (any)'
      end

    end

  end
end
