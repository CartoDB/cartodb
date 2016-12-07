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
  end
end
