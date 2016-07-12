# encoding: UTF-8

module Carto
  module Helpers
    class TableLocator

      # Getter by table uuid or table name using canonical visualizations
      # @param id_or_name String If is a name, can become qualified as "schema.tablename"
      # @param viewer_user ::User
      def get_by_id_or_name(id_or_name, viewer_user)
        return nil unless viewer_user

        rx = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

        # Fetch by visualization name or UUID
        table_name, table_schema = ::Table.table_and_schema(id_or_name)
        vqb = Carto::VisualizationQueryBuilder.new
        vqb.with_name(table_name).with_type(Carto::Visualization::TYPE_CANONICAL)

        if table_schema.nil?
          vqb.with_user_id(viewer_user.id)
        else
          owner = Carto::User.where(username: table_schema).first
          user_id = owner ? owner.id : viewer_user.id
          vqb.with_owned_by_or_shared_with_user_id(user_id)
        end

        vis = vqb.build.first
        table = vis.nil? ? nil : vis.table

        # Fetch by UserTable UUID
        if table.nil? && rx.match(id_or_name)
          table_temp = Carto::UserTable.where(id: id_or_name).first.try(:service)
          unless table_temp.nil?
            vis = table_temp.table_visualization
            table = vis.table if vis && vis.is_viewable_by_user?(viewer_user)
          end
        end

        table
      end

    end
  end
end
