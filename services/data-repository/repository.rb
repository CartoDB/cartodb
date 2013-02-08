# encoding: utf-8
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
    end #initialize

    def backend
      @storage
    end #backend

    def store(key, data, options={})
      storage.store(key.to_s, data, options)
    end #store

    def fetch(key)
      storage.fetch(key.to_s)
    end #fetch

    def keys
      storage.keys
    end #keys

    private

    attr_reader :storage
  end # Handler
end # DataRepository

