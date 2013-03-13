# encoding: utf-8
require 'set'
require 'ostruct'
require_relative '../visualization'

module CartoDB
  module Visualization
    class Collection
      include Enumerable
 
      attr_reader :id

      def initialize(attributes={}, repository=nil)
        @storage    = Set.new
        @repository = repository || Visualization.default_repository
        @id         = attributes.fetch(:id, @repository.next_id)
      end #initialize

      def add(member)
        storage.add(member)
      end #add

      def delete(member)
        storage.delete(member)
      end #delete

      def each
        return storage.each { |member| yield member } if block_given?
        Enumerator.new(@storage)
      end #each

      def fetch
        storage.clear
        repository.fetch(id).map { |id| storage.add OpenStruct.new(id: id) }
      end #fetch

      def store
        repository.store(id, member_ids)
      end #store

      private

      attr_reader :storage, :repository

      def member_ids
        storage.map { |member| member.id }
      end #member_ids
    end # Collection
  end # Visualization
end # CartoDB

