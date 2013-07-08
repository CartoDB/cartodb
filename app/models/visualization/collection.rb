# encoding: utf-8
require 'set'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE           = 'visualizations'
    AVAILABLE_FILTERS   = %w{ name type description map_id }
    PARTIAL_MATCH_QUERY = %Q{
      to_tsvector(
        'english', coalesce(name, '') || ' ' 
        || coalesce(description, '')
      ) @@ plainto_tsquery('english', ?) 
      OR CONCAT(name, ' ', description) ILIKE ?
    }

    class << self
      attr_accessor :repository
    end
    
    class Collection
      def initialize(attributes={}, options={})
        @collection = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Visualization.repository),
          member_class: Member
        )
      end #initialize

      DataRepository::Collection::INTERFACE.each do |method_name|
        define_method(method_name) do |*arguments, &block|
          result = collection.send(method_name, *arguments, &block)
          return self if result.is_a?(DataRepository::Collection)
          result
        end
      end

      def fetch(filters={})
        dataset = repository.collection(filters, AVAILABLE_FILTERS)
        dataset = filter_by_tags(dataset, tags_from(filters))
        dataset = filter_by_partial_match(dataset, filters.delete(:q))
        dataset = order(dataset, filters.delete(:o))

        self.total_entries = dataset.count
        dataset = repository.paginate(dataset, filters)

        collection.storage = Set.new(dataset.map { |attributes|
          Visualization::Member.new(attributes)
        })

        self
      end #fetch

      def store
        #map { |member| member.fetch.store }
        self
      end #store

      def destroy
        map(&:delete)
        self
      end #destroy

      def to_poro
        map { |member| member.to_hash(related: false, table_data: true) }
      end #to_poro

      attr_reader :total_entries

      private

      attr_reader :collection
      attr_writer :total_entries

      def order(dataset, criteria={})
        return dataset if criteria.nil? || criteria.empty?
        dataset.order(*order_params_from(criteria))
      end #order

      def filter_by_tags(dataset, tags=[])
        return dataset if tags.nil? || tags.empty?
        placeholders = tags.length.times.map { "?" }.join(", ")
        filter       = "tags && ARRAY[#{placeholders}]"
       
        dataset.where([filter].concat(tags))
      end #filter_by_tags

      def filter_by_partial_match(dataset, pattern=nil)
        return dataset if pattern.nil? || pattern.empty?
        dataset.where(PARTIAL_MATCH_QUERY, pattern, "%#{pattern}%")
      end #filter_by_partial_match

      def tags_from(filters={})
        filters.delete(:tags).to_s.split(',')
      end #tags_from

      def order_params_from(criteria)
        criteria.map { |key, order| Sequel.send(order.to_sym, key.to_sym) }
      end #order_params_from
    end # Collection
  end # Visualization
end # CartoDB

