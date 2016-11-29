# encoding: utf-8

require 'singleton'
require 'carto/storage_options/s3'
require 'carto/storage_options/local'

module Carto
  class Storage
    include Singleton

    def initialize
      @storage = Carto::StorageOptions::S3.new_if_available ||
                 Carto::StorageOptions::Local.new
    end

    def upload(location, file)
      @storage.upload(location, file)
    end

    def remove(location)
      @storage.remove(location, file)
    end
  end
end
