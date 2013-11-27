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
      end #self.supported?

      def initialize(filepath, job)
        @job      = job
        @filepath = filepath
      end #initialize

      def encoding
        return 'UTF-8' if ['LATIN1', 'ISO-8859-1'].include?(shape_encoding)
        shape_encoding
      end #encoding

      def shape_encoding
        normalize
        dbf       = filepath.gsub(%r{\.shp$}, '.dbf')
        encoding  = DBF::Table.new(dbf).encoding || 
                    normalizer_output.fetch(:encoding, nil)
        encoding  = DEFAULT_ENCODING if encoding == 'None' 
        encoding  = codepage_for(encoding) if windows?(encoding)
        return(tab_encoding || encoding) if tab?
        encoding
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
      end #normalize

      def prj?
        File.exists?(filepath.gsub(%r{\.shp$}, '.prj'))
      end #prj?

      def tab?
        File.extname(filepath) == '.tab'
      end

      def dbf?
        File.exists?(filepath.gsub(%r{\.shp$}, '.dbf'))
      end #dbf?

      def shx?
        File.exists?(filepath.gsub(%r{\.shp$}, '.shx'))
      end #shx?

      attr_accessor :exit_code, :command_output, :normalizer_output, :filepath,
                    :job

      def python_bin_path
        `which python`.strip
      end #python_bin_path

      def normalizer_path
        File.expand_path(NORMALIZER_RELATIVE_PATH, __FILE__) 
      end #normalizer_path

      def normalizer_command
        %Q(#{python_bin_path} -Wignore #{normalizer_path} ) +
        %Q("#{filepath}" #{job.table_name})
      end #normalizer_command

      def codepage_for(encoding)
        encoding = encoding.gsub(/windows-|cp/, 'WIN')
        return DEFAULT_ENCODING unless encoding =~ /WIN\d{4}/
        encoding
      end #codepage_for

      def windows?(encoding)
        !!(encoding =~ /(windows-|cp)\d+/)
      end #windows?
    end # ShpNormalizer
  end # Importer
end # CartoDB

