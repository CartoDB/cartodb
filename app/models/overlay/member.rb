# encoding: utf-8
require 'virtus'
require_relative './collection'

module CartoDB
  module Overlay
    class Member
      include Virtus.model

      attribute :id,                String
      attribute :order,             Integer, default: 0
      attribute :type,              String
      attribute :template,          String
      attribute :options,           Hash, default: {}
      attribute :visualization_id,  String

      # There can be at most one of this types per visualization
      UNIQUE_TYPES = [
          'header', 'search', 'layer_selector', 'share', 'zoom', 'logo', 'loader', 'fullscreen'
      ]

      def initialize(attributes={}, repository=Overlay.repository)
        # Love virtus, here is ignoring default values so...
        self.attributes = { order: 0, options: {} }.merge(attributes)
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
        invalidate_cache
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
        # Usually deletes don't need full object loaded, but we need vis_id...
        fetch if self.attributes[:visualization_id].nil?
        vis_id = self.attributes[:visualization_id]
        repository.delete(id)
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        invalidate_cache(vis_id, update_named_maps = false)
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

      def invalidate_cache(vis_id = nil, update_named_maps = true)
        begin
          v = visualization(vis_id)
          v.invalidate_cache(update_named_maps)
        rescue KeyError
          # Silenced error
        end
      end

      def visualization(vis_id=nil)
         CartoDB::Visualization::Member.new({ :id => vis_id.nil? ? self.attributes[:visualization_id] : vis_id }).fetch
      end

      attr_reader :repository
    end

    class DuplicateOverlayError < StandardError; end
  end
end

