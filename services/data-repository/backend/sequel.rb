# encoding: utf-8
require 'sequel'
require 'uuidtools'

module DataRepository
  module Backend
    class Sequel
      PAGE      = 1
      PER_PAGE  = 1000

      def initialize(db=Sequel.sqlite, relation=nil)
        @db       = db
        @relation = relation
      end #initialize

      def collection(filter={}, attribute_names=[])
        return db[relation].all if filter.empty?

        attribute_names = attribute_names.map { |k| k.to_sym}
        filter          = Hash[ filter.map { |k, v| [k.to_sym, v] } ]

        page        = (filter.delete(:page)      || PAGE).to_i
        per_page    = (filter.delete(:per_page)  || PER_PAGE).to_i

        filter = filter.select { |key, value|
          attribute_names.include?(key)
        } unless attribute_names.empty?

        db[relation].where(filter).paginate(page, per_page)
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

      def count
        db[relation].count
      end #count

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

