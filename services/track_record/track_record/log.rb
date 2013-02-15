# encoding: utf-8
require 'set'
require 'virtus'
require_relative './entry'
require_relative '../../data-repository/repository'

module TrackRecord
  class Log
    include Enumerable
    include Virtus

    attr_reader :repository

    attribute   :id,      String
    attribute   :prefix,  String

    def self.repository
      @repository ||= DataRepository.new
    end # Log.repository

    def self.repository=(repository)
      @repository = repository
    end # Log.repository=

    def initialize(arguments={})
      self.id     = arguments.fetch(:id, next_id)
      self.prefix = arguments.fetch(:prefix, nil)
      @repository = arguments.fetch(:repository, self.class.repository)
      @entries    = Set.new
    end #initialize

    def append(payload)
      entries.add Entry.new(payload, prefix, repository).persist.id
      persist
      self
    end #append

    alias_method :<<, :append
    
    def each
      return Enumerator.new(self, :each) unless block_given?
      entries.sort.each { |entry_id| yield entry_from(entry_id) }
    end #each

    def to_s
      self.map(&:to_s).join("\n")
    end #to_s

    def fetch
      @entries.merge repository.fetch(storage_key)
      self
    end #fetch

    def tail
      return [] if entries.empty?
      entry_from(entries.to_a.last)
    end #tail

    def storage_key
      [prefix, "log:#{id}"].join(':')
    end #storage_key

    private

    attr_reader :entries
    
    def next_id
      UUIDTools::UUID.timestamp_create.to_s
    end #next_id

    def persist
      repository.store(storage_key, entries)
    end #persist

    def entry_from(entry_id)
      Entry.new({ id: entry_id }, prefix, repository).fetch
    end #entry_from
  end # Log
end # TrackRecord

