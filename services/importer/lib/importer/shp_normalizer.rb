# encoding: utf-8
require 'open3'
require 'dbf'
require_relative './exceptions'

module CartoDB
  module Importer2
    class ShpNormalizer
      DEFAULT_ENCODING = 'LATIN1'
      NORMALIZER_RELATIVE_PATH = 
        "../../../../../lib/importer/misc/shp_normalizer.py"

      def self.supported?(extension)
        %w{ .shp .tab }.include?(extension)
      end

      def initialize(filepath, job)
        @job      = job
        @filepath = filepath
      end

      def encoding
        return 'UTF-8' if ['LATIN1', 'ISO-8859-1'].include?(shape_encoding)
        shape_encoding
      end

      def shape_encoding
        @shape_encoding ||= shape_encoding_guessing
      end

      def shape_encoding_guessing
        normalize
        dbf       = filepath.gsub(%r{\.shp$}, '.dbf')
        encoding  = read_encoding_file('cpg') || read_encoding_file('cst') || DBF::Table.new(dbf).encoding ||
                    normalizer_output.fetch(:encoding, nil)
        encoding  = DEFAULT_ENCODING if encoding == 'None' 
        encoding  = codepage_for(encoding) if windows?(encoding)
        return(tab_encoding || encoding) if tab?
        encoding
      end

      # http://gis.stackexchange.com/questions/3529/which-character-encoding-is-used-by-the-dbf-file-in-shapefiles
      # ArcGIS and Geopublisher, AtlasStyler and Geoserver: .cpg
      # Geoserver: cst
      def read_encoding_file(extension)
        current_extension = File.extname(filepath)
        path = filepath.gsub(/.#{current_extension}$/, ".#{extension}")
        return nil unless File.exists?(path)
        saved_encoding = nil
        f = File.open(path, 'r') { |file|
          saved_encoding = file.read
        }
        saved_encoding
      rescue => e
        nil
      end

      def tab_encoding
        return 'WIN1251' if File.open(filepath, 'rb') { |file|
          file.read =~ /WindowsCyrillic/
        }
      rescue
        false
      end 

      def normalize
        raise InvalidShpError         unless dbf? && shx?
        raise MissingProjectionError  unless prj?

        stdout, stderr, status  = Open3.capture3(normalizer_command)
        output                  = stdout.strip.split(/, */, 4)
        self.normalizer_output  = {
          projection:   output[0],
          encoding:     output[1],
          source:       output[2],
          destination:  output[3]
        }

        raise ShpNormalizationError unless status.to_i == 0 
        raise ShpNormalizationError unless !!normalizer_output
        self
      end

      def prj?
        File.exists?(filepath.gsub(%r{\.shp$}, '.prj'))
      end

      def tab?
        File.extname(filepath) == '.tab'
      end

      def dbf?
        File.exists?(filepath.gsub(%r{\.shp$}, '.dbf'))
      end

      def shx?
        File.exists?(filepath.gsub(%r{\.shp$}, '.shx'))
      end

      attr_accessor :exit_code, :command_output, :normalizer_output, :filepath,
                    :job

      def python_bin_path
        `which python`.strip
      end

      def normalizer_path
        File.expand_path(NORMALIZER_RELATIVE_PATH, __FILE__) 
      end

      def normalizer_command
        %Q(#{python_bin_path} -Wignore #{normalizer_path} ) +
        %Q("#{filepath}" #{job.table_name})
      end

      def codepage_for(encoding)
        encoding = encoding.gsub(/windows-|cp/, 'WIN')
        return DEFAULT_ENCODING unless encoding =~ /WIN\d{4}/
        encoding
      end

      def windows?(encoding)
        !!(encoding =~ /(windows-|cp)\d+/)
      end
    end
  end
end

