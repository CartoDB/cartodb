# encoding: utf-8
require_relative '../visualization'
require_relative './member'

module CartoDB
  module Visualization
    class Locator
      def initialize(table_model=::Table, repository=Visualization.repository)
        @table_model  = table_model
        @repository   = repository
      end #initialize

      def get(id_or_name, subdomain=nil)
        get_visualization(id_or_name)     || 
        get_table(id_or_name, subdomain)  ||
        [nil, nil]
      end #get

      private

      attr_reader :repository, :table_model

      def get_visualization(id_or_name)
        attributes = get_by_id(id_or_name) || get_by_name(id_or_name)
        return false if attributes.nil? || attributes.empty?
        
        visualization = Visualization::Member.new(attributes)
        [visualization, visualization.table]
      end # get_visualization

      def get_table(id_or_name, subdomain=nil)
        return false unless subdomain
        table = table_model.find_by_subdomain(subdomain, id_or_name)

        return false unless table && table.table_visualization
        [table.table_visualization, table]
      end #get_table
        
      def get_by_id(uuid)
        repository.fetch(uuid)
      end #get_by_id

      def get_by_name(name)
        repository.collection(name: name).first
      end #get_by_name
    end # Locator
  end # Visualization
end # CartoDB

