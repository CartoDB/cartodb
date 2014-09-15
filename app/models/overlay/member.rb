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

      # There can be at most one of this types per visualization
      UNIQUE_TYPES = [
          'header', 'search', 'layer_selector', 'share', 'zoom', 'logo', 'loader', 'fullscreen'
      ]

      def initialize(attributes={}, repository=Overlay.repository)
        self.attributes = attributes
        @repository = repository
        unless self.id
          self.id = @repository.next_id
          @new = true
        end
      end

      # @throws DuplicateOverlayError
      def store(options={})
        if @new
          raise DuplicateOverlayError if !can_store
        end

        attrs = attributes.to_hash
        attrs[:options] = ::JSON.dump(attrs[:options])
        repository.store(id, attrs)
        @new = false
        invalidate_varnish_cache
        self
      end

      def fetch
        result = repository.fetch(id)
        raise KeyError if result.nil?
        result[:options] = result[:options].nil? ? [] : ::JSON.parse(result[:options])
        self.attributes = result
        self
      end

      def delete
        repository.delete(id)
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        invalidate_varnish_cache
        self
      end

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

      def can_store
        vis = visualization
        if vis && UNIQUE_TYPES.include?(self.attributes[:type])
          vis.overlays.each { |overlay|
            return false if (overlay.type == self.attributes[:type])
          }
        end

        true
      rescue KeyError
        # Scenario of not yet having stored the vis
        true
      end

      def invalidate_varnish_cache
        begin
          v = visualization
          v.invalidate_varnish_cache
        rescue KeyError
          # Silenced error
        end
      end

      def visualization
         CartoDB::Visualization::Member.new({ :id => self.attributes[:visualization_id] }).fetch
      end

      attr_reader :repository
    end

    class DuplicateOverlayError < StandardError; end
  end
end

