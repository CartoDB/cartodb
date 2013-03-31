# encoding: utf-8
require 'json'
require 'virtus'
require_relative '../visualization'
require_relative '../../../services/data-repository/repository'

module CartoDB
  module Overlay
    class Member
      include Virtus

      attribute :id,                String
      attribute :order,             Integer
      attribute :type,              String
      attribute :options,           Hash
      attribute :visualization_id,  String

      def initialize(attributes={}, repository=Visualization.repository)
        self.attributes = attributes
        @repository     = repository
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
  end # Overlay
end # CartoDB

