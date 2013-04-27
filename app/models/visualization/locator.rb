# encoding: utf-8
require_relative '../visualization'
require_relative './member'

module CartoDB
  module Visualization
    class Locator
      def initialize(repository=Visualization.repository)
        @repository = repository
      end #initialize

      def find(uuid_or_name)
        attributes = find_by_id(uuid_or_name) || find_by_name(uuid_or_name)
        return if attributes.nil? || attributes.empty?
        Visualization::Member.new(attributes) 
      end #find

      private

      attr_reader :repository

      def find_by_id(uuid)
        repository.fetch(uuid)
      end #find_by_id

      def find_by_name(name)
        repository.collection(name: name).first
      end #find_by_name
    end # Locator
  end # Visualization
end # CartoDB

