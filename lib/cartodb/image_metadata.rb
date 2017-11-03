module CartoDB
  class ImageMetadata
    attr_reader :input_file, :width, :height

    def initialize(input_file, extension: nil)
      @input_file = input_file
      @extension = extension
      extract_metadata
    end

    def extract_metadata
      has_magick? ? parse_identify : parse_file
    end

    def has_magick?
      `which identify 2>&1` != ''
    end

    def parse_identify
      identify_command = `which identify`.gsub(/\n/, '')
      result = `#{identify_command} #{identify_file_prefix}#{input_file} 2>&1`.match(/ (\d+)x(\d+) /)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end

    def parse_file
      result  = `file #{input_file} 2>&1`.match(/(\d+) x (\d+)/)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end

    private

    def identify_file_prefix
      case @extension.to_s.downcase
      when '.svg'
        # Some SVGs don't have the XML header, and sometimes they don't have the
        # svg extension either (lost during upload). In those cases, ImageMagick can't parse
        # the file unless we force it.
        'svg:'
      else
        ''
      end
    end
  end
end
