# encoding: utf-8
require 'json'
require 'virtus'
require_relative '../../../services/data-repository/repository'

module CartoDB
  module Overlay
    class Member
      include Virtus

      attribute :id,        String
      attribute :order,     Integer
      attribute :type,      String
      attribute :options,   Hash

      def self.repository
        @repository ||= DataRepository::Repository.new
      end # self.repository

      def initialize(attributes={})
        self.attributes = attributes
        self.id         ||= repository.next_id
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

      def repository
        self.class.repository
      end #repository
    end # Member
  end # Overlay
end # CartoDB

