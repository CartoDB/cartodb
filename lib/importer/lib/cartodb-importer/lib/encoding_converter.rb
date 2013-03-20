# encoding: utf-8
require 'iconv'

module CartoDB
  class EncodingConverter
    def initialize(path)
      @path = path
    end #initialize

    def run
      encoding_to_try = "UTF-8"
      is_utf = if `uname` =~ /Darwin/
                 `file -bI #{@path}`
               else
                 `file -bi #{@path}`
               end

      unless is_utf.include? 'utf-8'
        # sample first 500 lines from source
        # text/plain; charset=iso-8859-1
        charset = nil
        charset_data = is_utf.split('harset=')

        if 1<charset_data.length
          charset = charset_data[1].split(';')[0].strip
          charset = nil if charset == ""
        end

        # Read in a 128kb chunk and try to detect encoding
        chunk = File.open(@path).read(128000)
        cd = CharDet.detect(chunk)
        #puts "*** Chardet detected #{cd.encoding} with #{cd.confidence} confidence"

        # Only do non-UTF8 if we're quite sure. (May fail)
        if !['utf-8', 'ascii', ''].include?(cd.encoding.to_s.downcase) && cd.confidence > 0.6
          tf = Tempfile.new(@path)

          # Try transliteration first, then ignore
          `iconv -f #{cd.encoding} -t UTF-8//TRANSLIT #{@path} > #{tf.path}`
          `iconv -f #{cd.encoding} -t UTF-8//IGNORE #{@path} > #{tf.path}` if $?.exitstatus != 0

          # Overwrite the file only on successful conversion
          `mv -f #{tf.path} #{@path}` if $?.exitstatus == 0
          tf.close!
        elsif !['utf-8'].include?(cd.encoding.to_s.downcase)
          # Fallbacks
          encoding_to_try = 
            if ["", "ascii"].include?(cd.encoding.to_s)
              "UTF-8"
            else
              cd.encoding.to_s
            end
        end
      end #unless

      return encoding_to_try
    rescue => exception
      return "UTF-8"
    end #run
  end # EncodingConverter
end # CartoDB

