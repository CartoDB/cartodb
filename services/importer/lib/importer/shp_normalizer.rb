require 'open3'
require_relative './exceptions'
require_relative './shp_helper'

module CartoDB
  module Importer2
    class ShpNormalizer
      DEFAULT_ENCODING = 'LATIN1'

      # INFO: http://www.postgresql.org/docs/9.1/static/multibyte.html
      SUPPORTED_ENCODINGS = %W{
        BIG5 WIN950 Windows950
        EUC_CN
        EUC_JP
        EUC_JIS_2004
        EUC_KR
        EUC_TW
        GB18030
        GBK WIN936 Windows936
        ISO_8859_5
        ISO_8859_6 ISO_8859_7
        ISO_8859_8
        JOHAB
        KOI8R KOI8
        KOI8U
        LATIN1 ISO88591 ISO-8859-1
        LATIN2 ISO88592
        LATIN3 ISO88593
        LATIN4 ISO88594
        LATIN5 ISO88599
        LATIN6 ISO885910
        LATIN7 ISO885913
        LATIN8 ISO885914
        LATIN9 ISO885915
        LATIN10 ISO885916
        MULE_INTERNAL
        SJIS Mskanji ShiftJIS WIN932 Windows932
        SHIFT_JIS_2004
        SQL_ASCII
        UHC WIN949 Windows949
        UTF8 Unicode UTF-8
        WIN866 ALT
        WIN874
        WIN1250
        WIN1251 WIN
        WIN1252
        WIN1253
        WIN1254
        WIN1255
        WIN1256
        WIN1257
        WIN1258 ABC TCVN TCVN5712 VSCII
      }
      SUPPORTED_ENCODINGS_DOWNCASED = SUPPORTED_ENCODINGS.map(&:downcase)

      NORMALIZER_RELATIVE_PATH =
        "../../../../../lib/importer/misc/shp_normalizer.py"

      def self.supported?(extension)
        %w{ .shp .tab }.include?(extension)
      end

      # INFO: importer_config not used but needed for compatibility with other normalizers
      def initialize(filepath, job, importer_config = nil)
        @job      = job
        @filepath = filepath
        @helper = ShpHelper.new(filepath)
        @helper.verify_file
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
        encoding  = read_encoding_files || @helper.dbf_encoding ||
                    normalizer_output.fetch(:encoding, nil)
        encoding  = DEFAULT_ENCODING if encoding == 'None'
        encoding  = codepage_for(encoding) if windows?(encoding)
        return(tab_encoding || encoding) if @helper.tab?
        encoding
      end

      # http://gis.stackexchange.com/questions/3529/which-character-encoding-is-used-by-the-dbf-file-in-shapefiles
      # ArcGIS and Geopublisher, AtlasStyler and Geoserver: .cpg
      # Geoserver: cst
      def read_encoding_files
        filter_supported_encodings(@helper.read_encoding_file('cpg') || @helper.read_encoding_file('cst'))
      end

      def filter_supported_encodings(encoding)
        encoding.nil? || !SUPPORTED_ENCODINGS_DOWNCASED.include?(encoding.downcase) ? nil : encoding
      end

      def tab_encoding
        return 'WIN1251' if File.open(filepath, 'rb') { |file|
          file.read =~ /WindowsCyrillic/
        }
      rescue StandardError
        false
      end

      def normalize
        stdout, stderr, status  = Open3.capture3(*normalizer_command)
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

      def prj_file_present?
        @helper.prj?
      end

      attr_accessor :exit_code, :command_output, :normalizer_output, :filepath,
                    :job

      def python_bin_path
        CartoDB.python_bin_path
      end

      def normalizer_path
        File.expand_path(NORMALIZER_RELATIVE_PATH, __FILE__)
      end

      def normalizer_command
        [python_bin_path, '-Wignore', normalizer_path, filepath, job.table_name]
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
