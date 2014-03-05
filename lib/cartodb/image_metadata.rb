module CartoDB
  class ImageMetadata
    attr_reader :input_file, :width, :height

    def initialize(input_file)
      @input_file = input_file
      extract_metadata
    end # initialize

    def extract_metadata
      extractor_method = (has_magick? ? 'parse_identify' : 'parse_file')
      self.send(extractor_method)
    end # extract_metadata

    def has_magick?
      `which identify 2>&1` != ''
    end # has_magick?

    def parse_identify
      identify_command = `which identify`.gsub(/\n/, '')
      result = `#{identify_command} #{input_file} 2>&1`.match(/ (\d+)x(\d+) /)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end # parse_identify

    def parse_file
      result  = `file #{input_file} 2>&1`.match(/(\d+) x (\d+)/)
      @width  = result[1].to_i rescue 0
      @height = result[2].to_i rescue 0
    end # parse_file
  end # ImageAnalyzer
end # CartoDB
