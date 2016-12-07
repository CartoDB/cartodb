# encoding: utf-8

require 'carto/storage'

module Carto
  class OrganizationAssetFile
    def self.enabled?
      Carto::OrganizationAssetFile.namespace.present? &&
        Carto::OrganizationAssetFile.max_size_in_bytes.present?
    end

    def self.namespace
      @namespace ||= CartoDB.config.fetch(:assets, 'organizations', 'namespace')
    end

    def self.max_size_in_bytes
      @max_size_in_bytes ||= CartoDB.config.fetch(:assets,
                                                  'organizations',
                                                  'max_size_in_bytes')
    end

    attr_reader :url, :organization, :errors

    def initialize(url, organization)
      @url = url
      @organization = organization
      @errors = Hash.new
    end

    def public_url
      Storage.instance.upload(namespace, organization.id, file) if valid?
    end

    def valid?
      file && errors.empty?
    end

    def file
      @file ||= fetch_file
    end

    private

    def fetch_file
      temp_file = Tempfile.new(Time.now.utc)

      read = IO.copy_stream(open(url), temp_file, max_size_in_bytes + 1)
      if read < max_size_in_bytes
        errors[:file] = "too big (> #{max_size_in_bytes})"
      end
    ensure
      temp_file.close
      temp_file.unlink

      temp_file
    end
  end
end
