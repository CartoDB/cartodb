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
      proposed_location = get_or_set_location(location)
      proposed_type = proposed_location.class.name.demodulize.downcase

      if (preferred_type || proposed_type) == 'local'
        Carto::StorageOptions::Local.new(location)
      elsif proposed_type == (preferred_type || proposed_type)
        proposed_location
      else
        available_storage_option.new(location)
      end
    end

    private

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

    def s3_enabled?
      @s3_enabled ||= Carto::StorageOptions::S3.enabled?
    end
  end
end
