# encoding: utf-8

module Carto
  class OrganizationAssetFile
    def initialize
    end

    def valid?
    end

    def errors
    end

    private

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
