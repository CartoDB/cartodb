require 'sequel'

module DataRepository
  module Backend
    class Sequel
      PAGE          = 1
      PER_PAGE      = 300
      ARRAY_RE      = %r{\[.*\]}

      def initialize(db, relation=nil)
        @db         = db
        @relation   = relation.to_sym
        ::Sequel.extension(:pagination)
        ::Sequel.extension(:connection_validator)
        @db.extension :pg_array if postgres?(@db)
      end

      def collection(filters={}, available_filters=[])
        apply_filters(db[relation], filters, available_filters)
      end

      def store(key, data={})
        naive_upsert_exposed_to_race_conditions(data)
      end

      def fetch(value, key=nil)
        if key.nil?
          parse( db[relation].where(id: value).first )
        else
          parse( db[relation].where(key.to_sym => value).first )
        end
      end

      def delete(key)
        db[relation].where(id: key).delete
      end

      def next_id
        Carto::UUIDHelper.random_uuid
      end

      def apply_filters(dataset, filters={}, available_filters=[])
        return dataset if filters.nil? || filters.empty?
        available_filters   = symbolize_elements(available_filters)

        filters = symbolize_keys(filters).select { |key, value|
          available_filters.include?(key)
        } unless available_filters.empty?

        dataset.where(filters)
      end

      def paginate(dataset, filter={}, record_count=nil)
        page, per_page = pagination_params_from(filter)
        dataset.paginate(page, per_page, record_count)
      end

      def transaction(&block)
        db.transaction(&block)
      end

      private

      attr_reader :relation, :db

      def naive_upsert_exposed_to_race_conditions(data={})
        data = send("serialize_for_#{backend_type}", data)
        insert(data) unless update(data)
      end

      def insert(data={})
        db[relation].insert(data)
      end

      def update(data={})
        db[relation].where(id: data.fetch(:id)).update(data) != 0
      end

      def serialize_for_postgres(data)
        Hash[
          data.map { |key, value|
            value = ::Sequel.pg_array(value) if value.is_a?(Array) && !value.empty?
            [key, value]
          }
        ]
      end

      def serialize_for_other_database(data={})
        Hash[
          data.map { |key, value|
            value = value.to_s if value.is_a?(Array)
            [key, value]
          }
        ]
      end

      def backend_type
        postgres?(db) ? :postgres : :other_database
      end

      def postgres?(db)
        db.database_type == :postgres
      end

      def parse(attributes={})
        return unless attributes
        return attributes if postgres?(db)

        Hash[
          attributes.map do |key, value|
            value = JSON.parse(value) if value =~ ARRAY_RE
            [key, value]
          end
        ]
      end

      def symbolize_elements(array=[])
        array.map { |k| k.to_sym}
      end

      def symbolize_keys(hash={})
        Hash[ hash.map { |k, v| [k.to_sym, v] } ]
      end

      def pagination_params_from(filter)
        page      = (filter.delete(:page)      || PAGE).to_i
        per_page  = (filter.delete(:per_page)  || PER_PAGE).to_i

        [page, per_page]
      end
    end
  end
end

