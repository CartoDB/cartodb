require 'set'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Synchronization
    SIGNATURE           = 'synchronizations'

    class << self
      attr_accessor :repository
    end
    
    class Collection
      def initialize(attributes={}, options={})
        @collection = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Synchronization.repository),
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
        per_page_filter = filters.delete(:per_page)
        dataset = repository.collection(filters, [])
        self.total_entries = dataset.count
        dataset = repository.paginate(dataset, per_page_filter.present? ? {per_page:per_page_filter} : {})

        collection.storage = Set.new(dataset.map { |attributes|
          Synchronization::Member.new(attributes)
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
        map { |member| member.to_hash }
      end

      attr_reader :total_entries

      private

      attr_reader :collection
      attr_writer :total_entries

      def order(dataset, criteria={})
        return dataset if criteria.nil? || criteria.empty?
        dataset.order(*order_params_from(criteria))
      end #order

      def order_params_from(criteria)
        criteria.map { |key, order| Sequel.send(order.to_sym, key.to_sym) }
      end #order_params_from
    end # Collection
  end # Synchronization
end # CartoDB

