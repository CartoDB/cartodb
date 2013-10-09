# encoding: utf-8
require 'eventmachine'
require 'pg/em'
require_relative 'member'

module CartoDB
  module Synchronizer
    class Collection
      DEFAULT_RELATION = 'synctables'

      def initialize(pg_options, relation=DEFAULT_RELATION)
        pg_options.store(:dbname, pg_options.delete(:database))

        @db       = PG::EM::Client.new(pg_options)
        @relation = relation
        @records  = [] 
      end

      def run
        fetch
        process
      end

      def fetch(success, error)
        query = db.query(%Q(SELECT * FROM #{relation}))

        query.errback   { |errors| error.call(errors) }
        query.callback  { |records| hydrate(records); success.call(records) }
        self
      end

      def process(members=@members)
        members.each(&:run)
      end

      attr_reader :records, :members

      private

      attr_reader :db, :relation
      attr_writer :records

      def hydrate(records)
        @members = records.map { |record| Member.new(record) }
        self
      end
    end # Collection
  end # Synchronizer
end # CartoDB

