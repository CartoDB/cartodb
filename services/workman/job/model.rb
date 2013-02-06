# encoding: utf-8
require 'uuidtools'
require 'virtus'
require 'aequitas'
require_relative './repository'

module Workman
  module Job
    class Model
      include Virtus
      include Aequitas

      class << self
        attr_accessor :repository
      end

      @repository = Job::Repository.new
      @queue      = :jobs

      def self.next_id
        UUIDTools::UUID.timestamp_create.to_s
      end # self.next_id

      STATES      = %w{ queued running success failure aborted }
      ENTRY_STATE = 'queued'

      attribute :id,          String, default: next_id
      attribute :state,       String, default: ENTRY_STATE
      attribute :command,     String
      attribute :arguments,   Hash

      validates_presence_of   :id, :state, :command
      validates_within        :state, set: STATES

      def persist
        raise unless valid?
        repository.store(id, attributes.to_hash)
        self
      end #persist

      def fetch
        self.attributes = repository.fetch(id)
        self
      end #fetch

      def transition_to(state)
        self.state = state
        persist
      end #transition 

      private

      def repository
        self.class.repository
      end #repository
    end # Model
  end # Job
end # Workman

