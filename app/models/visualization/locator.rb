# encoding: utf-8
require_relative '../visualization'
require_relative './member'

module CartoDB
  module Visualization
    class Locator
      def initialize(repository=Visualization.repository)
        @repository = repository
      end #initialize

      def get(uuid_or_name)
        attributes = get_by_id(uuid_or_name) || get_by_name(uuid_or_name)
        return if attributes.nil? || attributes.empty?
        Visualization::Member.new(attributes) 
      end #get

      private

      attr_reader :repository

      def get_by_id(uuid)
        repository.fetch(uuid)
      end #get_by_id

      def get_by_name(name)
        repository.collection(name: name).first
      end #get_by_name
    end # Locator
  end # Visualization
end # CartoDB

