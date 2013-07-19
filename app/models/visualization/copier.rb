# encoding: utf-8
require 'ostruct'
require_relative './name_generator'
require_relative '../map/copier'

module CartoDB
  module Visualization
    class Copier
      def initialize(user, visualization, name=nil)
        @user           = user
        @visualization  = visualization
        @name           = name
      end #initialize

      def copy
        Member.new(
          name:         new_name,
          tags:         visualization.tags,
          description:  visualization.description,
          type:         'derived',
          map_id:       map_copy.id,
          privacy:      visualization.privacy
        )
      end #copy

      private

      attr_reader :visualization, :user, :name

      def map_copy
        @map_copy ||= Map::Copier.new.copy(visualization.map)
      end #map

      def new_name
        @new_name ||= NameGenerator.new(user).name(name || visualization.name)
      end #name
    end # Copier
  end # Visualization
end # CartoDB

