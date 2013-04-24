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

      def fetch(filter={})
        collection.storage = 
          Set.new(
            repository.collection(filter, AVAILABLE_FILTERS)
              .map { |record| record.fetch(:id) }
          )
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

      private

      attr_reader :collection
    end # Collection
  end # Visualization
end # CartoDB

