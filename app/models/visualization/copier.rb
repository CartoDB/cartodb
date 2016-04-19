# encoding: utf-8
require 'ostruct'
require_relative './name_generator'
require_relative '../map/copier'
require_dependency 'cartodb/errors'

module CartoDB
  module Visualization
    # Creates a new visualization using another as source.
    # Do NOT use this to create derived visualizations as creates a new map.
    class Copier
      def initialize(user, visualization, name = nil)
        @user           = user
        @visualization  = visualization
        @name           = name
      end

      def copy(overlays = true, layers = true, additional_fields = {})
        raise CartoDB::UnauthorizedError.new(@user, @visualization) unless @visualization.is_owner?(@user)

        member = Member.new(
          name:         new_name,
          tags:         visualization.tags,
          description:  visualization.description,
          type:         type_from(additional_fields),
          parent_id:    additional_fields.fetch(:parent_id, nil),
          map_id:       map_copy(layers).id,
          privacy:      visualization.privacy,
          user_id:      @user.id
        )

        overlays_copy(member) if overlays

        member
      end

      private

      attr_reader :visualization, :user, :name

      def type_from(fields)
        fields.fetch(:type, Member::TYPE_DERIVED)
      end

      def overlays_copy(new_visualization)
        visualization.overlays.each.map do |overlay|
          new_overlay = overlay.dup
          new_overlay.visualization_id = new_visualization.id
          new_overlay.save
        end
      end

      def map_copy(layers)
        @map_copy ||= CartoDB::Map::Copier.new.copy(visualization.map, layers)
      end

      def new_name
        @new_name ||= NameGenerator.new(user).name(name || visualization.name)
      end
    end
  end
end
