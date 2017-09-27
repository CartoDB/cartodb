require_relative '../../lib/cartodb/stats/explore_api'
require_relative '../../lib/explore_api'

namespace :cartodb do
  namespace :explore_api do
    VISUALIZATIONS_TABLE = 'visualizations'

    PUBLIC_VISUALIZATIONS_VIEW = 'explore_api'
    CREATE_TABLE_SQL = %{
      CREATE TABLE #{VISUALIZATIONS_TABLE} (
        visualization_id UUID primary key,
        visualization_name text,
        visualization_description text,
        visualization_type text,
        visualization_synced boolean,
        visualization_table_names text[],
        visualization_table_rows bigint,
        visualization_table_size bigint,
        visualization_map_datasets integer,
        visualization_geometry_types text[],
        visualization_tags text[],
        visualization_bbox geometry,
        visualization_view_box geometry,
        visualization_view_box_center geometry,
        visualization_zoom integer,
        visualization_created_at timestamp with time zone,
        visualization_updated_at timestamp with time zone,
        visualization_map_id uuid,
        visualization_title text,
        visualization_likes integer,
        visualization_mapviews integer,
        user_id uuid,
        user_username text,
        user_organization_id uuid,
        user_twitter_username text,
        user_website text,
        user_avatar_url text,
        user_available_for_hire boolean,
        language regconfig default 'english'
      ) }
    CREATE_PUBLIC_VIEW = %{
      CREATE OR REPLACE VIEW #{PUBLIC_VISUALIZATIONS_VIEW} AS
        SELECT  visualization_id,
                visualization_name,
                visualization_description,
                visualization_type,
                visualization_table_rows,
                visualization_table_size,
                visualization_map_datasets,
                visualization_geometry_types,
                visualization_synced,
                visualization_tags,
                visualization_created_at,
                visualization_updated_at,
                visualization_map_id,
                visualization_title,
                visualization_likes,
                visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS popularity,
                user_id,
                user_username,
                user_organization_id,
                user_twitter_username,
                user_website,
                user_avatar_url,
                user_available_for_hire,
                language
        FROM visualizations
    }
    FULL_TEXT_SEARCHABLE_COLUMNS = %w{ visualization_name visualization_description visualization_title }
    INDEX_GEOMETRY_COLUMNS = %w{ visualization_bbox visualization_view_box }
    DROP_TABLE_SQL = %{ DROP TABLE IF EXISTS #{VISUALIZATIONS_TABLE} CASCADE}
    DROP_PUBLIC_VIEW_SQL = %{ DROP TABLE IF EXISTS #{PUBLIC_VISUALIZATIONS_VIEW} }
    MOST_RECENT_CREATED_SQL = %{ SELECT MAX(visualization_created_at) FROM #{VISUALIZATIONS_TABLE} }
    MOST_RECENT_UPDATED_SQL = %{ SELECT MAX(visualization_updated_at) FROM #{VISUALIZATIONS_TABLE} }
    BATCH_SIZE = 1000
    # TODO: "in" searches are limited to 300. To increase batch replace with date ranges
    UPDATE_BATCH_SIZE = 300

    desc "Creates #{VISUALIZATIONS_TABLE} at common-data user and loads the data for the very first time. This table contains an aggregated, desnormalized view of the public data at visualizations, and it's used by Explore API"
    task :setup => [:environment] do
      db_conn.run CREATE_TABLE_SQL
      db_conn.run CREATE_PUBLIC_VIEW

      update

      FULL_TEXT_SEARCHABLE_COLUMNS.each { |c|
        db_conn.run "CREATE INDEX #{VISUALIZATIONS_TABLE}_#{c}_fts_idx ON #{VISUALIZATIONS_TABLE} USING gin(to_tsvector(language, #{c}))"
      }

      INDEX_GEOMETRY_COLUMNS.each { |c|
        db_conn.run "CREATE INDEX #{VISUALIZATIONS_TABLE}_#{c}_geom_idx ON #{VISUALIZATIONS_TABLE} USING GIST(#{c})"
      }

      touch_metadata
    end

    task :setup_public_view => [:environment] do
      db_conn.run CREATE_PUBLIC_VIEW
    end

    task :drop_public_view => [:environment] do
      db_conn.run DROP_PUBLIC_VIEW_SQL
    end

    desc "Deletes the #{VISUALIZATIONS_TABLE} table"
    task :drop => [:environment] do
      db_conn.run DROP_TABLE_SQL
      db_conn.run DROP_PUBLIC_VIEW_SQL
    end

    desc "Updates the data at #{VISUALIZATIONS_TABLE}"
    task :update => :environment do |t, args|
      stats_aggregator.timing('visualizations.update.total') do
        update
        touch_metadata
      end
    end

    desc "Updates data visualization_map_datasets for all the visualizations in #{VISUALIZATIONS_TABLE}"
    task :update_map_dataset_count => :environment do |t, args|
      stats_aggregator.timing('visualizations.update.total') do
        update_map_dataset_count
        touch_metadata
      end
    end

    # INFO: Do something like this to make a full update every time we add a new field
    def update_map_dataset_count
      offset = 0
      total_number_of_updates = 0
      types_filter = [Carto::Visualization::TYPE_DERIVED]
      while (explore_visualizations = get_explore_visualizations(offset, types_filter)).length > 0
        explore_visualization_ids = explore_visualizations.map { |ev| ev[:visualization_id] }

        visualizations = Carto::Visualization.where(id: explore_visualization_ids)
        visualizations.each do |vis|
          dataset_count = explore_api.get_map_layers(vis).length
          update_query = %[ UPDATE #{VISUALIZATIONS_TABLE} SET visualization_map_datasets = #{dataset_count} WHERE visualization_id = '#{vis.id}']
          db_conn.run(update_query)
          total_number_of_updates += 1
        end
        offset += explore_visualizations.length
      end

      puts "Updated visualizations: #{total_number_of_updates}"
    end

    def update_visualization_metadata(visualization, tables_data, likes, mapviews)
      table_data = tables_data[visualization.user_id].nil? ? {} : tables_data[visualization.user_id][visualization.name]
      query = update_metadata_query(visualization, table_data, likes, mapviews)
      begin
        db_conn.run query
      rescue => err
        STDERR.puts "ERROR updating metadata with query:\n#{query}"
        raise
      end
    end

    def update
      # We add one second because we have time fields with microseconds and this leads to
      # retrieve processed data crashing due constraint issues.
      # Ie. 2015-09-03 14:12:38+00 < 2015-09-03 14:12:38.294086+00 is true
      most_recent_created_date = db_conn[MOST_RECENT_CREATED_SQL].first[:max]
      most_recent_created_date += 1 unless most_recent_created_date.nil?
      most_recent_updated_date = db_conn[MOST_RECENT_UPDATED_SQL].first[:max]
      most_recent_updated_date += 1 unless most_recent_updated_date.nil?

      stats_aggregator.timing('visualizations.update.update_existing') do
        update_existing_visualizations_at_user
      end
      stats_aggregator.timing('visualizations.update.insert_new') do
        insert_new_visualizations_at_user(most_recent_created_date, most_recent_updated_date)
      end
    end

    def update_existing_visualizations_at_user
      deleted_visualization_ids = []
      privated_visualization_ids = []
      total_metadata_updated = 0
      total_full_updated = 0

      puts "UPDATING"

      date_to_check = Time.now.beginning_of_day
      @liked_visualizations = explore_api.visualization_likes_since(date_to_check)
      @mapviews_visualizations = explore_api.visualization_mapviews_since(date_to_check)

      # INFO: we need to check all known visualizations because they might've been deleted
      offset = 0
      while (explore_visualizations = get_explore_visualizations(offset)).length > 0

        explore_visualizations_by_visualization_id = {}
        explore_visualizations.each do |row|
          explore_visualizations_by_visualization_id[row[:visualization_id]] = row
        end
        explore_visualization_ids = explore_visualizations.map { |ev| ev[:visualization_id] }

        visualizations = Carto::Visualization.where(id: explore_visualization_ids)

        update_result = update_visualizations(visualizations, explore_visualizations_by_visualization_id, explore_visualization_ids)
        total_metadata_updated += update_result[:metadata_updated_count]
        total_full_updated += update_result[:full_updated_count]

        print "Batch size: #{explore_visualizations.length}." \
              "\tMatches: #{visualizations.count}." \
              "\tUpdated #{update_result[:full_updated_count]}" \
              "\tMetadata updated: #{update_result[:metadata_updated_count]}\n"

        deleted_visualization_ids +=  explore_visualization_ids - visualizations.collect(&:id)
        privated_visualization_ids += update_result[:privated_visualization_ids]

        offset += explore_visualizations.length
      end

      print "\nTotal full updated: #{total_full_updated}." \
            "\tTotal metadata updated: #{total_metadata_updated}\n\n"

      delete_visualizations(deleted_visualization_ids, privated_visualization_ids)

    end

    def get_explore_visualizations(offset, types = [])
      where = %{WHERE visualization_type IN ('#{types.join("','")}')} unless types.blank?
      query = %{ SELECT visualization_id, visualization_updated_at
                 FROM #{VISUALIZATIONS_TABLE}
                 #{where}
                 ORDER BY visualization_created_at asc limit #{UPDATE_BATCH_SIZE} offset #{offset} }
      db_conn[query].all
    end

    def update_visualizations(visualizations, explore_visualizations_by_visualization_id, explore_visualization_ids)
      full_updated_count = 0
      metadata_updated_count = 0
      privated_visualization_ids = []
      visualizations.each do |v|
        begin
          explore_visualization = explore_visualizations_by_visualization_id[v.id]
          # We use to_i to remove the miliseconds that could give to erroneous updates
          # http://railsware.com/blog/2014/04/01/time-comparison-in-ruby/
          if v.updated_at.to_i != explore_visualization[:visualization_updated_at].to_i
            if v.privacy != Carto::Visualization::PRIVACY_PUBLIC || !v.published?
              privated_visualization_ids << v.id
            else
              updated = update_visualization(explore_visualization[:visualization_id], v)
              full_updated_count += updated
            end
          else
            # INFO: retrieving mapviews makes this much slower
            # We are only updating the visualizations that have received a liked since the DAYS_TO_CHECK_LIKES
            # in the last days
            if (@liked_visualizations.has_key?(v.id) || @mapviews_visualizations.has_key?(v.id))
              table_data = explore_api.get_visualizations_table_data([v])
              update_visualization_metadata(v, table_data, @liked_visualizations[v.id], @mapviews_visualizations[v.id])
              metadata_updated_count += 1
            end
          end
        rescue => err
          STDERR.puts "ERROR updating visualization #{v.id}"
          raise
        end
      end
      {
        full_updated_count: full_updated_count,
        metadata_updated_count: metadata_updated_count,
        privated_visualization_ids: privated_visualization_ids
      }
    end

    def delete_visualizations(deleted_visualization_ids, privated_visualization_ids)
      puts "DELETING #{deleted_visualization_ids.length} DELETED VISUALIZATIONS"
      if deleted_visualization_ids.length > 0
        db_conn.run delete_query(deleted_visualization_ids)
      end

      puts "DELETING #{privated_visualization_ids.length} PRIVATED VISUALIZATIONS"
      if privated_visualization_ids.length > 0
        db_conn.run delete_query(privated_visualization_ids)
      end
    end

    def delete_query(ids)
      %{ delete from #{VISUALIZATIONS_TABLE} where visualization_id in ('#{ids.join("', '")}') }
    end

    def insert_new_visualizations_at_user(most_recent_created_date, most_recent_updated_date)
      puts "INSERTING NEW CREATED"
      page = 1
      while (visualizations = CartoDB::Visualization::Collection.new.fetch(filter(page, most_recent_created_date))).count > 0 do
        filter_existing_and_insert_visualizations(visualizations, page)
        page += 1
      end

      puts "INSERTING OLD MADE PUBLIC"
      page = 1
      while (visualizations = CartoDB::Visualization::Collection.new.fetch(filter(page, nil, most_recent_updated_date))).count > 0 do
        filter_existing_and_insert_visualizations(visualizations, page)
        page += 1
      end
    end

    def filter_existing_and_insert_visualizations(visualizations, current_page)
        updated_ids = visualizations.collect(&:id)
        existing_ids = db_conn[%{ SELECT visualization_id
                               FROM #{VISUALIZATIONS_TABLE}
                               WHERE visualization_id
                               IN ('#{updated_ids.join("','")}')}].all.map { |row| row[:visualization_id] }

        missing_ids = updated_ids - existing_ids
        if missing_ids.length > 0
          missing_visualizations = visualizations.select { |v| missing_ids.include?(v.id) }
          insert_visualizations(filter_valid_visualizations(missing_visualizations))
          print "Batch ##{current_page}.\tInsertions: #{missing_visualizations.length}\n"
        end
    end

    def filter(page, min_created_at = nil, min_updated_at = nil)
      filter = {
        page: page,
        per_page: BATCH_SIZE,
        order: :created_at,
        order_asc_desc: :asc,
        privacy: Carto::Visualization::PRIVACY_PUBLIC
      }
      filter['types'] = [Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_DERIVED]
      filter[:min_created_at] = { date: min_created_at, included: true } if min_created_at
      filter[:min_updated_at] = { date: min_updated_at, included: true } if min_updated_at
      filter
    end

    def filter_metadata(page)
      filter = {
        page: page,
        per_page: BATCH_SIZE,
        order: :user_id,
        order_asc_desc: :asc,
        privacy: Carto::Visualization::PRIVACY_PUBLIC
      }
      filter['types'] = [Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_DERIVED]
      filter
    end

    def filter_valid_visualizations(visualizations)
      visualizations.select { |v| !v.user_id.nil? && !v.user.nil? }
    end

    def insert_visualizations(visualizations)
      tables_data = explore_api.get_visualizations_table_data(visualizations)
      db_conn[:visualizations].multi_insert(
        visualizations.map do |visualization|
          table_data = get_table_data(tables_data, visualization)
          insert_or_update_visualization_hash(visualization, table_data)
        end
      )
    end

    def update_visualization(explore_visualization_id, visualization)
      table_data = get_table_data(explore_api.get_visualizations_table_data([visualization]), visualization)
      update_hash = insert_or_update_visualization_hash(visualization, table_data)
      return 0 if update_hash.blank?
      update_hash.delete(:visualization_id)
      visualization_dataset = db_conn[:visualizations].where("visualization_id = '#{explore_visualization_id}'")
      visualization_dataset.update(update_hash)
      return 1
    end

    def get_table_data(tables_data, vis)
      return {} if tables_data[vis.user_id].blank? || tables_data[vis.user_id][vis.name].blank?
      tables_data[vis.user_id][vis.name]
    end

    def insert_or_update_visualization_hash(visualization, table_data)
      user = visualization.user

      # We get strange errors from visualization without user so we need to check
      if user.nil?
        return {}
      end

      geometry_data = explore_api.get_geometry_data(visualization)
      {
        visualization_id: visualization.id,
        visualization_name: visualization.name,
        visualization_description: visualization.description,
        visualization_type: visualization.type,
        # Synchronization method from Visualization::Relator uses empty Hash when there is no sync
        visualization_synced: !visualization.synchronization.is_a?(Hash),
        visualization_table_names: explore_api.get_visualization_tables(visualization),
        visualization_table_rows: table_data[:rows],
        visualization_table_size: table_data[:size],
        visualization_map_datasets: explore_api.get_map_layers(visualization).length,
        visualization_geometry_types: table_data[:geometry_types].blank? ? nil : Sequel.pg_array(table_data[:geometry_types]),
        visualization_tags: visualization.tags.nil? || visualization.tags.empty? ? nil : Sequel.pg_array(visualization.tags),
        visualization_created_at: visualization.created_at,
        visualization_updated_at: visualization.updated_at,
        visualization_map_id: visualization.map_id,
        visualization_title: visualization.title,
        visualization_likes: visualization.likes_count,
        visualization_mapviews: visualization.total_mapviews,
        visualization_bbox: visualization.bbox.nil? ? nil : Sequel.lit(explore_api.bbox_from_value(visualization.bbox)),
        visualization_view_box: geometry_data[:view_box_polygon].nil? ? nil : Sequel.lit(geometry_data[:view_box_polygon]),
        visualization_view_box_center: geometry_data[:center_geometry].nil? ? nil : Sequel.lit(geometry_data[:center_geometry]),
        visualization_zoom: geometry_data[:zoom],
        user_id: user.id,
        user_username: user.username,
        user_organization_id: user.organization_id,
        user_twitter_username: user.twitter_username,
        user_website: user.website,
        user_avatar_url: user.avatar_url,
        user_available_for_hire: user.available_for_hire
      }
    end

    def update_metadata_query(visualization, table_data, likes, mapviews)
      %[ UPDATE #{VISUALIZATIONS_TABLE} set
            visualization_synced = #{!visualization.synced?}
            #{update_mapviews(mapviews)}
            #{update_likes(likes)}
            #{update_tables(visualization)}
            #{update_geometry(visualization)}
          where visualization_id = '#{visualization.id}' ]
    end

    def update_mapviews(mapviews)
      %[, visualization_mapviews = #{mapviews}] unless mapviews.nil? || mapviews == 0
    end

    def update_likes(likes)
      %[, visualization_likes = #{likes}] unless likes.nil? || likes == 0
    end

    def update_tables(visualization)
      if visualization.type == Carto::Visualization::TYPE_DERIVED
        %[, visualization_table_names = '#{explore_api.get_visualization_tables(visualization)}',
            visualization_map_datasets = #{explore_api.get_map_layers(visualization).length}]
      elsif visualization.type == Carto::Visualization::TYPE_CANONICAL
        %[, visualization_table_names = '#{explore_api.get_visualization_tables(visualization)}']
      end
    end

    def update_geometry(visualization)
      geometry_data = explore_api.get_geometry_data(visualization)
      view_box_polygon = geometry_data[:view_box_polygon].nil? ? 'NULL' : geometry_data[:view_box_polygon]
      center_geometry = geometry_data[:center_geometry].nil? ? 'NULL' : geometry_data[:center_geometry]
      view_zoom = geometry_data[:zoom].nil? ? 'NULL' : geometry_data[:zoom]
      bbox_value = !visualization.bbox.nil? ? "ST_AsText('#{visualization.bbox}')" : 'NULL'
      if visualization.type == Carto::Visualization::TYPE_DERIVED
        %[, visualization_bbox = #{bbox_value},
             visualization_view_box = #{view_box_polygon},
             visualization_view_box_center = #{center_geometry},
             visualization_zoom = #{view_zoom}]
      elsif !bbox_value.nil?
        %[, visualization_bbox = #{bbox_value}]
      else
        return
      end
    end

    # INFO Disable temporary becuase is really inefficient
    def update_table_data(visualization_type, table_data)
      return if table_data.blank?
      if visualization_type == Carto::Visualization::TYPE_CANONICAL
        %[ , visualization_table_rows = #{table_data[:rows]},
             visualization_table_size = #{table_data[:size]},
             visualization_geometry_types = '{#{table_data[:geometry_types].join(',')}}' ]
      end
    end

    def common_data_user
      username = Cartodb.config[:explore_api]['username']
      @user ||= ::User.where(username: username).first
    end

    def db_conn(*args)
      common_data_user.in_database(*args)
    end

    def explore_api
      @explore_api ||= ExploreAPI.new
    end

    def touch_metadata
      db_conn(as: :superuser).run(%{SELECT CDB_TableMetadataTouch('#{VISUALIZATIONS_TABLE}')})
    end

    def stats_aggregator
      CartoDB::Stats::ExploreAPI.instance
    end

  end

end
