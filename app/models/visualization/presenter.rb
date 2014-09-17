# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class Presenter
      def initialize(visualization, options={})
        @visualization   = visualization
        @options         = options
        @viewing_user    = options.fetch(:user, nil)
        @table           = options[:table] || visualization.table
        @synchronization = options[:synchronization]
        @rows_and_sizes  = options[:rows_and_sizes] || {}
        # Expose real privacy (used for normal JSON purposes)
        @real_privacy    = options[:real_privacy] || false
      end

      def to_poro
        poro = {
          id:               visualization.id,
          name:             visualization.name,
          map_id:           visualization.map_id,
          active_layer_id:  visualization.active_layer_id,
          type:             visualization.type,
          tags:             visualization.tags,
          description:      visualization.description,
          privacy:          privacy_for_vizjson.upcase,
          stats:            visualization.stats(user),
          created_at:       visualization.created_at,
          updated_at:       visualization.updated_at,
          permission:       visualization.permission.nil? ? nil : visualization.permission.to_poro,
          locked:           visualization.locked,
          source:           visualization.source,
          title:            visualization.title,
          license:          visualization.license
        }
        poro.merge!(table: table_data_for(table))
        poro.merge!(synchronization: synchronization)
        poro.merge!(related) if options.fetch(:related, true)
        poro
      end

      private

      attr_reader :visualization, :options, :user, :table, :synchronization,
                  :rows_and_sizes

      # Simplify certain privacy values for the vizjson
      def privacy_for_vizjson
        return @visualization.privacy if @real_privacy
        case @visualization.privacy
          when Member::PRIVACY_PUBLIC, Member::PRIVACY_LINK
            Member::PRIVACY_PUBLIC
          when Member::PRIVACY_PRIVATE
            Member::PRIVACY_PRIVATE
          when Member::PRIVACY_PROTECTED
            Member::PRIVACY_PROTECTED
        end
      end

      def related
        { related_tables:   related_tables }
      end

      def table_data_for(table=nil)
        return {} unless table
        table_name = table.name
        unless @viewing_user.nil?
          unless @visualization.is_owner?(@viewing_user)
            table_name = "#{@visualization.user.sql_safe_database_schema}.#{table.name}"
          end
        end

        table_data = {
          id:           table.id,
          name:         table_name,
          permission:   nil
        }
        table_data[:permission] = table.table_visualization.permission.to_poro unless table.table_visualization.nil?

        table_data.merge!(
          privacy:      table.privacy_text_for_vizjson,
          updated_at:   table.updated_at
        )

        unless rows_and_sizes.nil? || rows_and_sizes.empty?
          if rows_and_sizes[table.name][:size].nil? || rows_and_sizes[table.name][:rows].nil?
            # don't add anything but don't break, UI supports detection of missing rows/size
          else
            table_data.merge!(
                size:         rows_and_sizes[table.name][:size],
                row_count:    rows_and_sizes[table.name][:rows]
            )
          end
        end

        table_data
      end

      def synchronization_data_for(table=nil)
        return nil unless table
        table.synchronization
      end

      def related_tables
        without_associated_table(visualization.related_tables)
          .map { |table| table_data_for(table) }
      end

      def without_associated_table(tables)
        return tables unless visualization.table
        tables.select { |table| table.id != visualization.table.id }
      end
    end
  end
end

