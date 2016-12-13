# encoding: utf-8

require 'singleton'
require 'carto/storage_options/s3'
require 'carto/storage_options/local'

module Carto
  class Storage
    include Singleton

    def initialize
      @storages = Hash.new
    end

    def for(location)
      get_or_set_location(location)
    end

    def get_or_set_location(location)
      existing_location = @storages[location]
      if existing_location
        existing_location
      else
        @storages[location] = available_storage_option(location)
      end
    end

    def available_storage_option(location)
      Carto::StorageOptions::S3.new_if_available(location) ||
        Carto::StorageOptions::Local.new(location)
    end
  end
end
