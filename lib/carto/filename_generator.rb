module Carto
  module FilenameGenerator
    def filename_from_url(url, supported_extensions)
      filename = CGI.unescape(File.basename(URI(url).path))

      extension = File.extname(filename)
      if extension.present? && supported_extensions.include?(extension)
        filename
      else
        # For non-conventional URLs (i.e: filename in params)
        regex_match = url_filename_regex(supported_extensions).match(url).to_s

        regex_match if regex_match.present?
      end
    end

    private

    def url_filename_regex(supported_extensions)
      se_match_regex = Regexp.union(supported_extensions_match(supported_extensions))
      Regexp.new("[[:word:]-]+#{se_match_regex}+", Regexp::IGNORECASE)
    end

    def supported_extensions_match(supported_extensions)
      supported_extensions.map { |ext|
        ext = ext.gsub('.', '\\.')
        [/#{ext}$/i, /#{ext}(?=\.)/i, /#{ext}(?=\?)/i, /#{ext}(?=&)/i]
      }.flatten
    end
  end
end
