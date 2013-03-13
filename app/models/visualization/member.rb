# encoding: utf-8
require 'virtus'
require 'virtus/attribute/writer/coercible'
require_relative '../visualization'

module CartoDB
  class SnakeCaseString < Virtus::Attribute::String
    class SnakeCase < Virtus::Attribute::Writer::Coercible
      def coerce(value)
        value.gsub(' ', '_') if value
      end #coerce
    end # Snake Case

    def self.writer_class(*)
      SnakeCase
    end # self.writer_class
  end # SnakeCaseString
end # CartoDB

module CartoDB
  module Visualization
    class Member
      include Virtus

      attribute :id,            String
      attribute :name,          CartoDB::SnakeCaseString
      attribute :map_id,        Integer
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

