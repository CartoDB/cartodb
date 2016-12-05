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

    def upload(location, path, file, protocol: 'http')
      get_or_set_location(location).upload(path, file, protocol: protocol)
    end

    def remove(location, path)
      get_or_set_location(location).remove(path, file)
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

    def type
      @type ||= @storage.class.name.demodulize.downcase
    end
  end
end
