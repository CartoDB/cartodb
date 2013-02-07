# encoding: utf-8
require 'set'
require 'virtus'
require_relative './entry'
require_relative '../data-repository/handler'

module TrackRecord
  class Log
    include Enumerable
    include Virtus

    attribute :id,    String

    def initialize(arguments={})
      self.id     = arguments.fetch(:id, next_id)
      @repository = arguments.fetch(:repository, DataRepository::Handler.new)
      @entries    = Set.new
    end #initialize

    def append(payload)
      entries.add Entry.new(payload, repository).persist.id
      persist
      self
    end #append
    
    def each
      return Enumerator.new(self, :each) unless block_given?
      entries.sort.each { |entry_id| yield entry_from(entry_id) }
    end #each

    def to_s
      self.map(&:to_s).join
    end #to_s

    def fetch
      @entries.merge repository.fetch(storage_key)
    end #fetch

    def storage_key
      "log:#{id}"
    end #storage_key

    private

    attr_reader :entries, :repository
    
    def next_id
      UUIDTools::UUID.timestamp_create.to_s
    end #next_id

    def persist
      repository.store(storage_key, entries)
    end #persist

    def entry_from(entry_id)
      Entry.new({ id: entry_id }, repository).fetch
    end #entry_from
  end # Log
end # TrackRecord

