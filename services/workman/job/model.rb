# encoding: utf-8
require 'uuidtools'
require 'virtus'
require 'aequitas'
require_relative '../../data-repository/repository'

module Workman
  module Job
    class Model
      include Virtus
      include Aequitas

      STATES      = %w{ queued running success failure aborted }
      ENTRY_STATE = 'queued'

      @queue = :jobs

      def self.repository
        @repository ||= DataRepository.new
      end # self.repository

      def self.repository=(repository)
        @repository = repository
      end #self.repository=

      def self.next_id
        UUIDTools::UUID.timestamp_create.to_s
      end # self.next_id

      attribute :id,          String, default: next_id
      attribute :state,       String, default: ENTRY_STATE
      attribute :command,     String
      attribute :arguments,   Hash
      attribute :result,      Hash

      validates_presence_of   :id, :state, :command
      validates_within        :state, set: STATES

      def persist
        raise 'Invalid job' unless valid?
        repository.store(storage_key, attributes.to_hash)
        self
      end #persist

      def fetch
        self.attributes = repository.fetch(storage_key)
        self
      end #fetch

      def transition_to(state)
        self.state = state
        persist
      end #transition 

      def execute(command=nil)
        command     ||= command_from(self.command, arguments)
        self.result = command.execute
        persist
      end #execute

      private

      def storage_key
        "workman:job:#{id}"
      end #storage_key

      def repository
        self.class.repository
      end #repository

      def command_from(command, arguments)
        Command.new(command, arguments)
      end #command_from
    end # Model
  end # Job
end # Workman

