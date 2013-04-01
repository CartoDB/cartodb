# encoding: utf-8
require 'sequel'
require 'uuidtools'

module DataRepository
  module Backend
    class Sequel
      def initialize(db=Sequel.sqlite, relation=nil)
        @db       = db
        @relation = relation
      end #initialize

      def collection(filter={})
        return db[relation].all if filter.empty?
        db[relation].where(filter)
      end #collection

      def store(key, data={})
        naive_upsert_exposed_to_race_conditions(data)
      end #store

      def fetch(key)
        db[relation].where(id: key).first
      end #fetch

      def delete(key)
        db[relation].where(id: key).delete
      end #delete

      def next_id
        UUIDTools::UUID.timestamp_create
      end #next_id

      private

      attr_reader :relation, :db

      def naive_upsert_exposed_to_race_conditions(data={})
        insert(data) unless update(data)
      end #naive_upsert_exposed_to_race_conditions

      def insert(data={})
        db[relation].insert(data)
      end #insert

      def update(data={})
        db[relation].where(id: data.fetch(:id)).update(data) != 0
      end #update
    end # Sequel
  end # Backend
end # DataRepository

