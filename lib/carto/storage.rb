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

    def for(location, preferred_type: nil)
      if preferred_type == 'local'
        Carto::StorageOptions::Local.new(location)
      else
        get_or_set_location(location)
      end
    end

    def get_or_set_location(location)
      existing_location = @storages[location]
      if existing_location
        existing_location
      else
        @storages[location] = available_storage_option.new(location)
      end
    end

    def available_storage_option
      s3_enabled? ? Carto::StorageOptions::S3 : Carto::StorageOptions::Local
    end

    private

    def s3_enabled?
      @s3_enabled ||= Carto::StorageOptions::S3.conf.try(:any?) ? true : false
    end
  end
end
