# encoding: utf-8
require 'pg'
require 'cartodb/stats/api_calls'

class ExploreAPI

  def initialize
    @stats_manager = CartoDB::Stats::APICalls.new
  end

  def get_visualization_tables(visualization)
    # We are using layers instead of related tables because with related tables we are connecting
    # to the users databases and we are reaching the connections limit
    table_names = visualization.data_layers.map { |layer| extract_table_name(layer) }.uniq
    %[{#{table_names.compact.join(',')}}]
  end

  def get_map_layers(visualization)
    visualization.data_layers
  end

  def get_geometry_data(visualization)
    map = visualization.map
    return {} if map.nil?
    view_box = map.view_bounds_data
    center_coordinates = map.center_data.reverse
    {
      zoom: map.zoom,
      view_box_polygon: Carto::BoundingBoxUtils.to_polygon(
        view_box[:west], view_box[:south], view_box[:east], view_box[:north]
      ),
      center_geometry: Carto::BoundingBoxUtils.to_point(center_coordinates[0], center_coordinates[1])
    }
  end

  def bbox_from_value(bbox_value)
    %{ST_AsText('#{bbox_value}')}
  end

  def get_visualizations_table_data(visualizations)
    return {} if visualizations.blank?
    data = {}
    tables_by_user = get_tables_by_user(visualizations)
    tables_by_user.each do |user_id, tables|
      user = ::User.find(id: user_id)
      data.merge!(table_data_by_user(user, tables)) unless user.nil?
    end
    data
  end

  def visualization_likes_since(date_since)
    data = {}
    liked_visualizations = CartoDB::Like.where('created_at >= ?', date_since).group_and_count(:subject).all
    liked_visualizations.each do |liked_vis|
      data[liked_vis[:subject]] = CartoDB::Like.where(subject: liked_vis[:subject]).count
    end
    data
  end

  def visualization_mapviews_since(date_since)
    data = {}
    $users_metadata.scan_each(match: "user:*") do |key|
      next if key =~ /global/
      date_formatted = date_since.strftime("%Y%m%d")
      key_splitted = key.split(':')
      username = key_splitted[1]
      visualization_id = key_splitted[4]
      vis_mapviews = @stats_manager.get_api_calls_from_redis(
        username,
        from: date_formatted, to: date_formatted, stat_tag: visualization_id
      )[date_formatted]
      data[visualization_id] = @stats_manager.get_total_api_calls(username, visualization_id) unless vis_mapviews == 0
    end
    data
  end

  private

  def table_data_by_user(user, tables)
    data = {}
    begin
      # INFO If we use the model connection we hit the max number of connections due the pooler so we create a
      # direct connection with the user database and close it after use
      conn = PG::Connection.open(dbname: user.database_name, host: user.database_host, user: 'postgres')
      geometry_types = tables_geometry_types(user.id, tables)
      data = compose_tables_data(conn, user.id, user.database_schema, tables, geometry_types)
    rescue => e
      CartoDB.notify_error(
        "Error generating table data for explorer api",
        user: user.id, tables: tables, error: e.inspect
      )
    ensure
      conn.close unless conn.nil?
    end
    data
  end

  def get_tables_by_user(visualizations)
    tables_by_user = {}
    visualizations.each do |vis|
      if vis.type == Carto::Visualization::TYPE_CANONICAL
        tables_by_user[vis.user_id] = [] unless tables_by_user.has_key?(vis.user_id)
        tables_by_user[vis.user_id] << vis.name
        tables_by_user[vis.user_id].uniq
      end
    end
    tables_by_user
  end

  def tables_geometry_types(user_id, tables)
    geometry_types = {}
    tables.each do |table|
      user_table = Carto::UserTable.where(user_id: user_id, name: table).first
      geometry_types[table] = user_table.service.geometry_types
    end
    geometry_types
  end

  def compose_tables_data(conn, user_id, database_schema, tables, geometry_types)
    begin
      data = { user_id => {} }
      result = get_rows_and_size_from_tables(conn, database_schema, tables)
      result.each do |row|
        data[user_id][row['table_name']] = {
          rows: row['row_count'],
          size: row['size'],
          geometry_types: geometry_types[row['table_name']]
        }
      end
      data
    rescue => e
      data = {}
      CartoDB.notify_error(
        "Error composing table data user",
        user: user_id, tables: tables, error: e.inspect
      )
    end
    data
  end

  def get_rows_and_size_from_tables(conn, database_schema, tables)
    size_calc = "pg_total_relation_size('\"#{database_schema}\".\"' || relname || '\"') / 2"
    table_names = %['#{tables.join('\',\'')}']
    conn.exec(%{SELECT #{size_calc} AS size,
                  reltuples::integer AS row_count,
                  relname as table_name
                FROM pg_class
                WHERE relname IN (#{table_names})
              }
             )
  end

  def extract_table_name(layer)
    table_username = layer.options['user_name']
    table_name = layer.options['table_name'].gsub(/"/, '\"').split('.')
    # Here we check for:
    #   a) return as comes, but escaping quotes, if the table_name have a . this means an old format username.tablename
    #   b) return username.table_name with the username escaped to avoid problems
    #      with non-alphanumeric characters like '-'
    if table_name.length > 1
      %[#{layer.options['table_name'].gsub(/"/, '\"')}]
    elsif table_name.length == 1 && !table_username.blank?
      %[\\"#{table_username}\\".#{table_name[0]}]
    end
  end
end
