# encoding: utf-8
require 'virtus'
require 'virtus/attribute/writer/coercible'
require_relative '../../../services/data-repository/repository'

module CartoDB
  class SnakeCaseString < Virtus::Attribute::String
    class SnakeCase < Virtus::Attribute::Writer::Coercible
      def coerce(value)
        (super || String.new).gsub(' ', '_')
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

      def self.repository
        @repository ||= DataRepository::Repository.new
      end # self.repository

      attribute :id,            String
      attribute :name,          CartoDB::SnakeCaseString
      attribute :map_id,        Integer
      attribute :tags,          Array[String]
      attribute :description,   String

      def initialize(attributes={})
        self.attributes = attributes
        self.id         ||= repository.next_id
      end #initialize

      def store
        repository.store(id, attributes.to_hash)
        self
      end #store

      def fetch
        self.attributes = self.attributes.merge( repository.fetch(id) )
        self
      end #fetch

      def delete
        repository.delete(id)
      end #delete

      private

      def repository
        self.class.repository
      end #repository
    end # Member
  end # Visualization
end # CartoDB

