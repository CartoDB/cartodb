# encoding: utf-8
require 'virtus'
require_relative './collection'

module CartoDB
  module Overlay
    class Member
      include Virtus.model

      attribute :id,                String
      attribute :order,             Integer
      attribute :type,              String
      attribute :template,          String
      attribute :options,           Hash
      attribute :visualization_id,  String

      def initialize(attributes={}, repository=Overlay.repository)
        self.attributes = attributes
        @repository     = repository
        self.id         ||= @repository.next_id
      end #initialize

      def store(options={})
        attrs = attributes.to_hash
        attrs[:options] = ::JSON.dump(attrs[:options])
        repository.store(id, attrs)
        invalidate_varnish_cache if options[:invalidate].present? and options[:invalidate]
        self
      end #store

      def fetch
        result = repository.fetch(id)
        raise KeyError if result.nil?
        result[:options] = result[:options].nil? ? [] : ::JSON.parse(result[:options])
        self.attributes = result
        self
      end #fetch

      def delete
        repository.delete(id)
        invalidate_varnish_cache
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        self
      end #delete

      def hide
        set_option('display', false)
        self
      end

      def show
        set_option('display', true)
        self
      end

      def is_hidden
        !options['display']
      end

      private

      def set_option(key, value)
        options[key] = value
      end

      def invalidate_varnish_cache
        begin
          v = visualization
        rescue KeyError
        end
        v.invalidate_varnish_cache unless v.nil?
      end

      def visualization
         CartoDB::Visualization::Member.new({ :id => self.attributes[:visualization_id] }).fetch
      end

      attr_reader :repository
    end # Member
  end # Overlay
end # CartoDB

