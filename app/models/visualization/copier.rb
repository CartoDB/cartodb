# encoding: utf-8
require 'ostruct'
require_relative './name_generator'
require_relative '../map/copier'
require_relative '../overlay/member'
require_relative '../overlay/copier'

module CartoDB
  module Visualization
    class Copier
      def initialize(user, visualization, name=nil)
        @user           = user
        @visualization  = visualization
        @name           = name
      end #initialize

      def copy(overlays=true, layers=true)
        member = Member.new(
          name:         new_name,
          tags:         visualization.tags,
          description:  visualization.description,
          type:         Member::DERIVED_TYPE,
          map_id:       map_copy(layers).id,
          privacy:      visualization.privacy,
          user_id:      @user.id
        )
        if overlays
          overlays_copy(member)
        end
        member
      end #copy

      private

      attr_reader :visualization, :user, :name

      def overlays_copy(new_visualization)
        copier = CartoDB::Overlay::Copier.new(new_visualization.id)
        visualization.overlays.each.map { |overlay|
          new_overlay = copier.copy_from(overlay)
          new_overlay.store
        }
      end

      def map_copy(layers)
        @map_copy ||= Map::Copier.new.copy(visualization.map, layers)
      end #map

      def new_name
        @new_name ||= NameGenerator.new(user).name(name || visualization.name)
      end #name
    end # Copier
  end # Visualization
end # CartoDB

