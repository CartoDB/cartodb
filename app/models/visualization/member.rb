# encoding: utf-8
require 'virtus'
require 'virtus/attribute/writer/coercible'
require_relative '../visualization'

module CartoDB
  module Visualization
    class Member
      include Virtus

      attribute :id,            String
      attribute :name,          String
      attribute :map_id,        Integer
      attribute :derived,       Boolean
      attribute :tags,          Array[String]
      attribute :description,   String

      def initialize(attributes={}, repository=nil)
        self.attributes = attributes
        @repository     = repository || Visualization.default_repository
        self.id         ||= @repository.next_id
      end #initialize

      def store
        repository.store(id, attributes.to_hash)
        self
      end #store

      def fetch
        self.attributes = repository.fetch(id)
        self
      end #fetch

      def delete
        repository.delete(id)
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        self
      end #delete

      private

      attr_reader :repository
    end # Member
  end # Visualization
end # CartoDB

