module CartoDB
  class ImageMetadata
    attr_reader :input_file, :width, :height

    def initialize(input_file)
      @input_file = input_file
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
      result = `#{identify_command} #{input_file} 2>&1`.match(/ (\d+)x(\d+) /)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end

    def parse_file
      result  = `file #{input_file} 2>&1`.match(/(\d+) x (\d+)/)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end
  end
end
