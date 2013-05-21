# encoding: utf-8
require 'set'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE         = 'visualizations'
    AVAILABLE_FILTERS = %w{ name type description map_id }

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
        tags    = filters.delete(:tags).to_s.split(',')
        dataset = dataset.where(has_tags(tags))
        #dataset = partial_match(dataset, filters.delete(:q))
        self.total_entries = dataset.count
        dataset = repository.paginate(dataset, filters)

        collection.storage = 
          Set.new(dataset.map { |record| record.fetch(:id) })
        self
      end #fetch

      def store
        map { |member| member.fetch.store }
        self
      end #store

      def destroy
        map(&:delete)
        self
      end #destroy

      attr_reader :total_entries

      private

      attr_reader :collection
      attr_writer :total_entries

      def has_tags(tags=[])
        return {} if tags.nil? || tags.empty?
        placeholders = tags.length.times.map { "?" }.join(", ")
        filter       = "tags && ARRAY[#{placeholders}]"
       
        [filter].concat(tags)
      end #with_tags

      def partial_match(dataset, query=nil)
        return dataset if query.nil? || query.empty?
        conditions = %Q{
          to_tsvector(
            'english', coalesce(name, '') || ' ' 
            || coalesce(description, '')
          ) @@ plainto_tsquery('english', ?) OR name ILIKE ?
        }
        dataset.where(conditions, query, "%#{query}%")
      end #partial_match
    end # Collection
  end # Visualization
end # CartoDB

