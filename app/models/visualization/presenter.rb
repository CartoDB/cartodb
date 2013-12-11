# encoding: utf-8

module CartoDB
  module Visualization
    class Presenter
      def initialize(visualization, options={})
        @visualization   = visualization
        @options         = options
        @user            = options.fetch(:user, nil)
        @table           = options[:table] || visualization.table
        @synchronization = options[:synchronization]
        @rows_and_sizes  = options[:rows_and_sizes] || {}
      end #initialize

      def to_poro
        poro = {
          id:               visualization.id,
          name:             visualization.name,
          map_id:           visualization.map_id,
          active_layer_id:  visualization.active_layer_id,
          type:             visualization.type,
          tags:             visualization.tags,
          description:      visualization.description,
          privacy:          visualization.privacy.upcase,
          stats:            visualization.stats(user),
          created_at:       visualization.created_at,
          updated_at:       visualization.updated_at
        }
        poro.merge!(table: table_data_for(table))
        poro.merge!(synchronization: synchronization)
        poro.merge!(related) if options.fetch(:related, true)
        poro
      end #to_poro

      private

      attr_reader :visualization, :options, :user, :table, :synchronization,
                  :rows_and_sizes

      def related
        { related_tables:   related_tables }
      end #related

      def table_data_for(table=nil)
        return {} unless table
        table_data = {
          id:           table.id,
          name:         table.name
        }

        table_data.merge!(
          privacy:      table.privacy_text,
          updated_at:   table.updated_at
        ) #if options.fetch(:table_data, true)

        table_data.merge!(
          size:         rows_and_sizes[table.name][:size],
          row_count:    rows_and_sizes[table.name][:rows]
        ) unless rows_and_sizes.nil? || rows_and_sizes.empty?
        table_data
      end #table_data_for

      def synchronization_data_for(table=nil)
        return nil unless table
        table.synchronization
      end

      def related_tables
        without_associated_table(visualization.related_tables)
          .map { |table| table_data_for(table) }
      end #related_tables

      def without_associated_table(tables)
        return tables unless visualization.table
        tables.select { |table| table.id != visualization.table.id }
      end #without_associated_table
    end # Presenter
  end # Visualization
end # CartoDB

