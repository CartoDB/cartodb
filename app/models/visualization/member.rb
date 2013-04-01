# encoding: utf-8
require 'virtus'
require_relative './collection'
require_relative '../overlay/collection'

module CartoDB
  module Visualization
    class Member
      include Virtus

      attribute :id,            String
      attribute :name,          String
      attribute :map_id,        Integer
      attribute :type,          String
      attribute :tags,          Array[String]
      attribute :description,   String

      def initialize(attributes={}, repository=Visualization.repository)
        self.attributes = attributes
        @repository     = repository
        self.id         ||= @repository.next_id
      end #initialize

      def store
        data = attributes.to_hash
        data.delete(:tags)
        repository.store(id, data)
        self
      end #store

      def fetch
        result = repository.fetch(id)
        raise KeyError if result.nil?
        self.attributes = result
        self
      end #fetch

      def delete
        overlays.destroy
        repository.delete(id)
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        self
      end #delete

      def overlays
        @overlays ||= Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      private

      attr_reader :repository
    end # Member
  end # Visualization
end # CartoDB

