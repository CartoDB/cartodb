# encoding: utf-8
require 'set'
require 'virtus'
require 'aequitas'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Overlay
    SIGNATURE = 'overlays'

    class << self
      attr_accessor :repository
    end
    
    class Collection
      include Virtus
      include Aequitas

      attribute :visualization_id,  String
      validates_presence_of         :visualization_id

      def initialize(attributes={}, options={})
        @page           = attributes.delete('page')
        @per_page       = attributes.delete('per_page')
        self.attributes = attributes
        @collection     = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Overlay.repository),
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
        unless repository.respond_to?(:collection)
          collection.fetch
          return self
        end

        collection.storage = 
          Set.new(
            repository.collection(filter.merge(scope))
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

      def scope
        { visualization_id: visualization_id, }
      end #scope
    end # Collection
  end # Overlay
end # CartoDB

