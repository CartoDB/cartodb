# encoding: utf-8
require_relative '../visualization'
require_relative './member'
require_relative '../user'
require_relative '../table'

module CartoDB
  module Visualization
    class Locator
      def initialize(table_model=nil, user_model=nil, repository=nil)
        @table_model  = table_model || ::Table
        @user_model   = user_model  || ::User
        @repository   = repository  || Visualization.repository
      end #initialize

      def get(id_or_name, subdomain)
        user = user_from(subdomain)

        visualization_from(id_or_name, user) || 
        table_from(id_or_name, user)         ||
        [nil, nil]
      end #get

      private

      attr_reader :repository, :table_model, :user_model

      def user_from(subdomain)
        @user ||= user_model.where(username: subdomain).first
      end #user_from

      def visualization_from(id_or_name, user)
        attributes = get_by_id(id_or_name) || get_by_name(id_or_name, user)
        return false if attributes.nil? || attributes.empty?
        
        visualization = Visualization::Member.new(attributes)
        [visualization, visualization.table]
      end # visualization_from

      def table_from(id_or_name, user)
        table = table_model.where(id: id_or_name, user_id: user.id).first

        return false unless table && table.table_visualization
        [table.table_visualization, table]
      rescue
        false
      end #table_from
        
      def get_by_id(uuid)
        repository.fetch(uuid)
      end #get_by_id

      def get_by_name(name, user)
        repository.collection(
          name:   name, 
          map_id: user.maps.map(&:id)
        ).first
      end #get_by_name
    end # Locator
  end # Visualization
end # CartoDB

