# encoding: utf-8
require 'virtus'
require 'uuidtools'
require 'json'
require_relative '../../data-repository/repository'

module TrackRecord
  class Entry
    include Virtus

    FIELD_SEPARATOR         = ' || '

    attribute :id,          String
    attribute :payload,     Hash, default: {}
    attribute :timestamp,   Float
    attribute :created_at,  Time
    attribute :prefix,      String

    def initialize(payload, prefix=nil, repository=DataRepository::Repository.new)
      @repository = repository
      @prefix     = prefix
      payload     = { message: payload } unless payload.respond_to?(:to_hash)
      payload     = JSON.parse(payload.to_hash.to_json)
      self.id     = payload.delete('id')

      initialize_attributes_with(payload)
    end #initialize

    def payload
      super.dup
    end #payload

    def created_at=(time)
      super Time.parse(time.to_s).utc
    end #time=

    def timestamp=(time_or_float)
      super time_or_float.to_f
    end #timestamp=

    def <=>(other)
      timestamp <=> other.timestamp
    end #<=>

    def to_hash
      JSON.parse(attributes_without_id.to_json)
    end #to_hash

    def to_s
      [created_at.utc.iso8601, payload.values].join(FIELD_SEPARATOR)
    end #to_s

    def persist(options={})
      repository.store(storage_key, self.to_hash, options)
      self
    end #persist

    def fetch
      return self unless repository.exists?(storage_key)
      self.attributes = repository.fetch(storage_key)
      self
    end #fetch

    def storage_key
      [prefix, "entry:#{id}"].join(':')
    end #storage_key

    private

    attr_reader :repository

    def initialize_attributes_with(payload)
      return if id

      self.id         = next_id
      self.payload    = payload
      self.timestamp  = self.created_at = Time.now
    end #attributes

    def next_id
      UUIDTools::UUID.timestamp_create.to_s
    end #next_id

    def attributes_without_id
      attributes.delete_if { |k, v| k =~ /^id$/ }
    end #attributes_without_id
  end # Entry
end # TrackRecord

