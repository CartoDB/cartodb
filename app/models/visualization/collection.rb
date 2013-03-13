# encoding: utf-8
require 'set'
require 'ostruct'
require_relative '../visualization'

module CartoDB
  module Visualization
    class Collection
      include Enumerable
 
      attr_reader :id

      def initialize(attributes={}, member_class=nil, repository=nil)
        @storage      = Set.new
        @member_class = member_class  || OpenStruct
        @repository   = repository    || Visualization.default_repository
        @id           = attributes.fetch(:id, @repository.next_id)
      end #initialize

      def add(member)
        storage.add(member.id)
        self
      end #add

      def delete(member)
        storage.delete(member.id)
        self
      end #delete

      def each(&block)
        return members(&block) if block
        Enumerator.new(storage.map { |id| member_class.new(id: id) })
      end #each

      def fetch
        self.storage = Set[*repository.fetch(id)]
        self
      end #fetch

      def store
        repository.store(id, storage.to_a)
        self
      end #store

      private

      attr_accessor :storage
      attr_reader   :repository, :member_class

      def members
        storage.map { |member_id| yield member_class.new(id: member_id) }
      end #members
    end # Collection
  end # Visualization
end # CartoDB

