# encoding: utf-8
require 'virtus'
require_relative './collection'

module CartoDB
  module Overlay
    class Member
      include Virtus

      attribute :id,                String
      attribute :order,             Integer
      attribute :type,              String
      attribute :options,           Hash
      attribute :visualization_id,  String

      def initialize(attributes={}, repository=Overlay.repository)
        self.attributes = attributes
        @repository     = repository
        self.id         ||= @repository.next_id
      end #initialize

      def store
        repository.store(id, attributes.to_hash)
        self
      end #store

      def fetch
        result = repository.fetch(id)
        raise KeyError if result.nil?
        self.attributes = result
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
  end # Overlay
end # CartoDB

