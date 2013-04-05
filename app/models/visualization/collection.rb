# encoding: utf-8
require 'set'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE = 'visualizations'

    class << self
      attr_accessor :repository
    end
    
    class Collection
      def initialize(attributes={}, options={})
        @page       = attributes.delete('page')
        @per_page   =  attributes.delete('per_page')
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

      def fetch
        collection.storage = 
          Set.new(
            repository.collection(filter).map { |record| record.fetch(:id) }
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

      attr_reader :collection, :page, :per_page

      def filter
        { page: page, per_page: per_page }
      end #filter
    end # Collection
  end # Visualization
end # CartoDB

