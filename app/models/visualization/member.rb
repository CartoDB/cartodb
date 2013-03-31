# encoding: utf-8
require 'virtus'
require_relative '../visualization'
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
        @repository     = repository
        self.attributes = attributes
        self.id         ||= @repository.next_id
      end #initialize

      def store
        data = attributes.to_hash
        (data.delete(:tags) || []).each { |tag| store_tag(id, tag) }
        repository.store(id, data)
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

      def overlays
        Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      private

      attr_reader :repository

      def store_tag(visualization_id, tag)
        Tag::Member.new(
          name:             tag, 
          visualization_id: visualization_id
        ).store
      end #store_ta:
    end # Member
  end # Visualization

  module Tag
    class Member
      def initialize(attributes={})
      end #initilize

      def store(*args)
      end #store
    end # Member
  end # Tag
end # CartoDB

