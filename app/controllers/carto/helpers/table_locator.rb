# encoding: UTF-8

module Carto
  module Helpers  
    class TableLocator

      # Getter by table uuid or table name using canonical visualizations
      # @param id_or_name String If is a name, can become qualified as "schema.tablename"
      # @param viewer_user User
      def get_by_id_or_name(id_or_name, viewer_user)
        return nil unless viewer_user

        rx = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

        table_name, table_schema = ::Table.table_and_schema(id_or_name)

        query_filters = {
            user_id: viewer_user.id,
            name: table_name,
            type: CartoDB::Visualization::Member::TYPE_CANONICAL
        }

        if table_schema.nil?
          # INFO: if we don't have schema we don't want shared
          query_filters[:shared] = CartoDB::Visualization::Collection::FILTER_SHARED_NO
        else
          owner = User.where(username:table_schema).first
          unless owner.nil?
            query_filters[:user_id] = owner.id
          end
        end

        # noinspection RubyArgCount
        vis = CartoDB::Visualization::Collection.new.fetch(query_filters).select { |v|
          v.user_id == query_filters[:user_id] || v.has_permission?(viewer_user, CartoDB::Permission::ACCESS_READONLY)
        }.first
        table = vis.nil? ? nil : vis.table
        table.set_table_visualization(vis) if table

        if rx.match(id_or_name) && table.nil?
          table_temp = Carto::UserTable.where(id: id_or_name).first.try(:service)
          unless table_temp.nil?
            # Make sure we're allowed to see the table
            vis = CartoDB::Visualization::Collection.new.fetch(
                user_id: viewer_user.id,
                map_id: table_temp.map_id,
                type: CartoDB::Visualization::Member::TYPE_CANONICAL
            ).first
            table = vis.table unless vis.nil?
          end
        end

        table
      end

    end
  end
end
