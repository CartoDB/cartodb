# encoding: utf-8
require 'set'
require_relative '../visualization'
require_relative './member'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE = 'visualizations'

    class Collection
      def initialize
        @collection = 
          DataRepository::Collection.new({ signature: SIGNATURE }, defaults)
      end #initialize

      DataRepository::Collection::INTERFACE.each do |method_name|
        define_method(method_name) do |*arguments, &block|
          result = collection.send(method_name, *arguments, &block)
          return self if result.is_a?(DataRepository::Collection)
          result
        end
      end

      private

      attr_reader :collection

      def defaults
        { 
          repository:   Visualization.default_repository,
          member_class: Member
        }
      end #defautls
    end # Collection
  end # Visualization
end # CartoDB

