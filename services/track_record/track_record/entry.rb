# encoding: utf-8
require 'virtus'
require 'uuidtools'
require 'json'
require_relative '../../data-repository/repository'

module TrackRecord
  class Entry
    include Virtus

    PAYLOAD_TYPE_ERROR      = 'Payload must be a Hash'

    attribute :id,          String
    attribute :payload,     Hash, default: {}
    attribute :timestamp,   Float
    attribute :created_at,  Time

    def initialize(payload, repository=DataRepository::Repository.new)
      raise(ArgumentError, PAYLOAD_TYPE_ERROR) unless payload.is_a?(Hash)
      @repository = repository
      payload     = JSON.parse(payload.to_json)
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
      [created_at, payload.values].join(' || ')
    end #to_s

    def persist
      repository.store(storage_key, self.to_hash)
      self
    end #persist

    def fetch
      self.attributes = repository.fetch(storage_key)
      self
    end #fetch

    def storage_key
      "entry:#{id}"
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

