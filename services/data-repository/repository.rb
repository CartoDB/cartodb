# encoding: utf-8
require 'uuidtools'
require_relative 'backend/detector'
require_relative 'backend/memory'

module DataRepository
  def self.new(backend_or_connection=nil)
    backend = Backend::Detector.new(backend_or_connection).detect
    Repository.new(backend)
  end # DataRepository.new

  class Repository
    def initialize(storage=Backend::Memory.new)
      @storage = storage
    end

    def backend
      @storage
    end

    def store(key, data, options={})
      storage.store(key.to_s, data, options)
    end

    def fetch(key)
      storage.fetch(key.to_s)
    end

    def delete(key)
      storage.delete(key.to_s)
    end

    def exists?(key)
      storage.exists?(key)
    end

    def keys
      storage.keys
    end

    def next_id
      UUIDTools::UUID.timestamp_create     
    end

    private

    attr_reader :storage
  end # Handler
end # DataRepository

