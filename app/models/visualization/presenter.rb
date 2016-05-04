# encoding: utf-8

require_relative './member'
require_relative './external_source'

module CartoDB
  module Visualization
    class Presenter
      def initialize(visualization, options={})
        @visualization   = visualization
        @viewing_user    = options.fetch(:user, nil)
        @options         = options
        @table           = options[:table] || visualization.table
        @synchronization = options[:synchronization] || visualization.synchronization
        # Expose real privacy (used for normal JSON purposes)
        @real_privacy    = options[:real_privacy] || false
      end

      def to_poro
        permission = visualization.permission

        poro = {
          id: visualization.id,
          name: visualization.name,
          display_name: visualization.display_name,
          map_id: visualization.map_id,
          active_layer_id: visualization.active_layer_id,
          type: visualization.type,
          tags: visualization.tags,
          description: visualization.description,
          privacy: privacy_for_vizjson.upcase,
          stats: visualization.stats,
          created_at: visualization.created_at,
          updated_at: visualization.updated_at,
          permission: permission.nil? ? nil : permission.to_poro,
          locked: visualization.locked,
          source: visualization.source,
          title: visualization.title,
          parent_id: visualization.parent_id,
          license: visualization.license,
          attributions: visualization.attributions,
          kind: visualization.kind,
          likes: visualization.likes_count,
          legend_style: visualization.legend_style,
          prev_id: visualization.prev_id,
          next_id: visualization.next_id,
          transition_options: visualization.transition_options,
          active_child: visualization.active_child
        }
        poro.merge!(table: table_data_for(table, permission))
        poro.merge!(external_source: external_source_data_for(visualization))
        poro.merge!(synchronization: synchronization)
        poro.merge!(related) if options.fetch(:related, true)
        poro.merge!(children: children)
        poro.merge!(liked: visualization.liked_by?(@viewing_user.id)) unless @viewing_user.nil?
        poro
      end

      def to_public_poro
        {
          id:               visualization.id,
          name:             visualization.name,
          display_name:     visualization.display_name,
          type:             visualization.type,
          tags:             visualization.tags,
          description:      visualization.description,
          updated_at:       visualization.updated_at,
          legend_style:     visualization.legend_style,
          title:            visualization.title,
          kind:             visualization.kind,
          privacy:          privacy_for_vizjson.upcase,
          likes:            visualization.likes_count
        }
      end

      private

      attr_reader :visualization, :options, :table, :synchronization

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
          else
            Member::PRIVACY_PRIVATE
        end
      end

      def related
        { related_tables: related_tables }
      end

      def table_data_for(table=nil, permission = nil)
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
        table_visualization = table.table_visualization
        unless table_visualization.nil?
          table_data[:permission] = (!permission.nil? && table_visualization.id == permission.entity_id) ?
                                      permission.to_poro : table_visualization.permission.to_poro
          table_data[:geometry_types] = table.geometry_types
        end

        table_data.merge!(
          privacy:      table.privacy_text_for_vizjson,
          updated_at:   table.updated_at
        )

        table_data.merge!(table.row_count_and_size)

        table_data
      end

      def external_source_data_for(visualization)
        return {} unless visualization.type == Member::TYPE_REMOTE

        external_source = Visualization::ExternalSource.where(visualization_id: visualization.id).first
        return {} unless external_source.present?

        {
          size: external_source.size,
          row_count: external_source.rows_counted,
          geometry_types: external_source.geometry_types
        }

      end

      def children
        @visualization.children.map { |vis| {
                                              id: vis.id,
                                              prev_id: vis.prev_id,
                                              type: Visualization::Member::TYPE_SLIDE,
                                              next_id: vis.next_id,
                                              transition_options: vis.transition_options,
                                              map_id: vis.map_id
                                            }
        }
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

