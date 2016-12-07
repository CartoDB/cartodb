# encoding: utf-8

module Carto
  class OrganizationAssetFile
    attr_reader :url
    def initialize(url)
      @url = url
      @errors = Hash.new
    end

    def valid?
      errors.empty?
    end

    private

    def fetch_file
      file = Tempfile.new(Time.now.utc)

      read = IO.copy_stream(open(url), file, max_size_in_bytes + 1)
      if read < max_size_in_bytes
        errors[:file] = "too big (> #{max_size_in_bytes})"
      end
    ensure
      file.close
      file.unlink

      file
    end

    def namespace
      @namespace ||= CartoDB.config.fetch(:assets, 'organizations', 'namespace')
    end

    def max_size_in_bytes
      @max_size_in_bytes ||= CartoDB.config.fetch(:assets,
                                                  'organizations',
                                                  'max_size_in_bytes')
    end
  end
end
