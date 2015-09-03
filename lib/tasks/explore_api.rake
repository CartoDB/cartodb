require_relative '../../lib/cartodb/stats/explore_api'

namespace :cartodb do

  namespace :explore_api do
    VISUALIZATIONS_TABLE = 'visualizations'

    PUBLIC_VISUALIZATIONS_VIEW = 'explore_api'
    CREATE_TABLE_SQL = %Q{
      CREATE TABLE #{VISUALIZATIONS_TABLE} (
        visualization_id UUID primary key,
        visualization_name text,
        visualization_description text,
        visualization_type text,
        visualization_synced boolean,
        visualization_table_names text[],
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
    CREATE_PUBLIC_VIEW = %Q{
      CREATE OR REPLACE VIEW #{PUBLIC_VISUALIZATIONS_VIEW} AS
        SELECT  visualization_id,
                visualization_name,
                visualization_description,
                visualization_type,
                visualization_synced,
                visualization_tags,
                visualization_created_at,
                visualization_updated_at,
                visualization_map_id,
                visualization_title,
                visualization_likes,
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
    INDEX_GEOMETRY_COLUMNS = %w{ visualization_bbox, visualization_view_box }
    DROP_TABLE_SQL = %Q{ DROP TABLE IF EXISTS #{VISUALIZATIONS_TABLE} CASCADE}
    DROP_PUBLIC_VIEW_SQL = %Q{ DROP TABLE IF EXISTS #{PUBLIC_VISUALIZATIONS_VIEW} }
    MOST_RECENT_CREATED_SQL = %Q{ SELECT MAX(visualization_created_at) FROM #{VISUALIZATIONS_TABLE} }
    MOST_RECENT_UPDATED_SQL = %Q{ SELECT MAX(visualization_updated_at) FROM #{VISUALIZATIONS_TABLE} }
    BATCH_SIZE = 1000
    # TODO: "in" searches are limited to 300. To increase batch replace with date ranges
    UPDATE_BATCH_SIZE = 300

    desc "Creates #{VISUALIZATIONS_TABLE} at common-data user and loads the data for the very first time. This table contains an aggregated, desnormalized view of the public data at visualizations, and it's used by Explore API"
    task :setup => [:environment] do
      user = target_user
      user.in_database.run CREATE_TABLE_SQL
      user.in_database.run CREATE_PUBLIC_VIEW

      update(user)

      FULL_TEXT_SEARCHABLE_COLUMNS.each { |c|
        user.in_database.run "CREATE INDEX #{VISUALIZATIONS_TABLE}_#{c}_fts_idx ON #{VISUALIZATIONS_TABLE} USING gin(to_tsvector(language, #{c}))"
      }

      INDEX_GEOMETRY_COLUMNS.each { |c|
        user.in_database.run "CREATE INDEX #{VISUALIZATIONS_TABLE}_#{c}_geom_idx ON #{VISUALIZATIONS_TABLE} USING GIST(#{c})"
      }

      touch_metadata(user)
    end

    task :setup_public_view => [:environment] do
      user = target_user
      user.in_database.run CREATE_PUBLIC_VIEW
    end

    desc "Deletes the #{VISUALIZATIONS_TABLE} table"
    task :drop => [:environment] do
      target_user.in_database.run DROP_TABLE_SQL
      target_user.in_database.run DROP_PUBLIC_VIEW_SQL
    end

    desc "Updates the data at #{VISUALIZATIONS_TABLE}"
    task :update => [:environment] do
      require_relative '../../app/helpers/explore_api'
      @explore_api_helper = Helpers::ExploreAPI.new
      stats_aggregator.timing('visualizations.update.total') do
        user = target_user
        update(user)
        touch_metadata(user)
      end
    end

    def update(user)
      most_recent_created_date = user.in_database[MOST_RECENT_CREATED_SQL].first[:max]
      most_recent_updated_date = user.in_database[MOST_RECENT_UPDATED_SQL].first[:max]

      stats_aggregator.timing('visualizations.update.update_existing') do
        update_existing_visualizations_at_user(user)
      end
      stats_aggregator.timing('visualizations.update.insert_new') do
        insert_new_visualizations_at_user(user, most_recent_created_date, most_recent_updated_date)
      end
    end

    def update_existing_visualizations_at_user(user)
      deleted_visualization_ids = []
      privated_visualization_ids = []

      puts "UPDATING"
      # INFO: we need to check all known visualizations because they might've been deleted
      offset = 0
      while (explore_visualizations = user.in_database[%Q{ select visualization_id, visualization_updated_at from #{VISUALIZATIONS_TABLE} order by visualization_created_at asc limit #{UPDATE_BATCH_SIZE} offset #{offset} }].all).length > 0

        explore_visualizations_by_visualization_id = {}
        explore_visualizations.each { |row|
          explore_visualizations_by_visualization_id[row[:visualization_id]] = row
        }

        visualization_ids = explore_visualizations.map { |ev| ev[:visualization_id] }

        bbox_values = get_visualizations_bbox(visualization_ids)

        visualizations = CartoDB::Visualization::Collection.new.fetch({ ids: visualization_ids})
        full_updated_count = 0
        mapviews_liked_updated_count = 0
        visualizations.each do |v|
          explore_visualization = explore_visualizations_by_visualization_id[v.id]
          # We use to_id to remove the miliseconds that could give to erroneous updates
          # http://railsware.com/blog/2014/04/01/time-comparison-in-ruby/
          if v.updated_at.to_i != explore_visualization[:visualization_updated_at].to_i
            if v.privacy != CartoDB::Visualization::Member::PRIVACY_PUBLIC
              privated_visualization_ids << v.id
            else
              # TODO: update instead of delete-insert
              user.in_database.run delete_query([v.id])
              insert_visualizations(user, filter_valid_visualizations([v]))
              full_updated_count += 1
            end
          else
            # INFO: retrieving mapviews makes this much slower
            # TODO: only update when there're new mapviews or likes
            user.in_database.run update_mapviews_and_likes_query(v, bbox_values[v.id])
            mapviews_liked_updated_count += 1
          end
        end

        print "Batch size: #{explore_visualizations.length}.\tMatches: #{visualizations.count}.\tUpdated #{full_updated_count} \tMapviews and liked updates: #{mapviews_liked_updated_count}\n"

        deleted_visualization_ids +=  visualization_ids - visualizations.collect(&:id)

        offset += explore_visualizations.length
      end

      puts "DELETING #{deleted_visualization_ids.length} DELETED VISUALIZATIONS"
      if deleted_visualization_ids.length > 0
        user.in_database.run delete_query(deleted_visualization_ids)
      end

      puts "DELETING #{privated_visualization_ids.length} PRIVATED VISUALIZATIONS"
      if privated_visualization_ids.length > 0
        user.in_database.run delete_query(privated_visualization_ids)
      end

    end

    def delete_query(ids)
      %Q{ delete from #{VISUALIZATIONS_TABLE} where visualization_id in ('#{ids.join("', '")}') }
    end

    def insert_new_visualizations_at_user(user, most_recent_created_date, most_recent_updated_date)

      puts "INSERTING NEW CREATED"
      page = 1
      while (visualizations = CartoDB::Visualization::Collection.new.fetch(filter(page, most_recent_created_date))).count > 0 do
        insert_visualizations(user, filter_valid_visualizations(visualizations))
        print "Batch ##{page}. \t Insertions: #{visualizations.count}\n"
        page += 1
      end

      puts "INSERTING OLD MADE PUBLIC"
      page = 1
      while (visualizations = CartoDB::Visualization::Collection.new.fetch(filter(page, nil, most_recent_created_date))).count > 0 do
        updated_ids = visualizations.collect(&:id)

        existing_ids = user.in_database[%Q{ select visualization_id from #{VISUALIZATIONS_TABLE} where visualization_id in ('#{updated_ids.join("','")}')}].all.map { |row| row[:visualization_id] }

        missing_ids = updated_ids - existing_ids

        if missing_ids.length > 0
          missing_visualizations = visualizations.select { |v| missing_ids.include?(v.id) }
          insert_visualizations(user, filter_valid_visualizations(missing_visualizations))
          print "Batch ##{page}. \t Insertions: #{missing_visualizations.length}\n"
        end
        page += 1
      end

    end

    def filter(page, min_created_at = nil, min_updated_at = nil)
      filter = {
        page: page,
        per_page: BATCH_SIZE,
        order: :created_at,
        order_asc_desc: :asc,
        privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
      }
      filter['types'] = [CartoDB::Visualization::Member::TYPE_CANONICAL, CartoDB::Visualization::Member::TYPE_DERIVED]
      filter[:min_created_at] = min_created_at if min_created_at
      filter[:min_updated_at] = min_updated_at if min_updated_at
      filter
    end

    def filter_valid_visualizations(visualizations)
      visualizations.select { |v| !v.user_id.nil? && !v.user.nil? }
    end

    def insert_visualizations(user, visualizations)
      visualization_ids = visualizations.map{|v| v.id}
      visualizations_bbox = get_visualizations_bbox(visualization_ids)
      insert_values = @explore_api_helper.get_visualizations_values_for_insert(visualizations, visualizations_bbox)
      sql = "INSERT INTO #{VISUALIZATIONS_TABLE} (#{Helpers::ExploreAPI::VISUALIZATIONS_COLUMNS.join(", ")}) VALUES #{insert_values.join(", ")}"
      user.in_database.run(sql)
    end

    def get_visualizations_bbox(visualization_ids)
      bbox_dataset = Rails::Sequel.connection.fetch(
        %Q[SELECT id, bbox FROM visualizations WHERE id in ('#{visualization_ids.join("','")}') AND type = '#{CartoDB::Visualization::Member::TYPE_CANONICAL}']
      ).all
      Hash[bbox_dataset.map {|row| [row[:id], row[:bbox]] }]
    end

    def update_mapviews_and_likes_query(visualization, bbox_value)
      %Q{ UPDATE #{VISUALIZATIONS_TABLE} set
            visualization_mapviews = #{visualization.mapviews},
            visualization_likes = #{visualization.likes_count},
            visualization_synced = #{!visualization.is_synced?}
            #{update_tables(visualization)}
            #{update_geometry(visualization, bbox_value)}
          where visualization_id = '#{visualization.id}' }
    end

    def update_tables(visualization)
      %Q{, visualization_table_names = '#{@explore_api_helper.get_visualization_tables(visualization)}'}
    end

    def update_geometry(visualization, bbox_value)
      geometry_data = @explore_api_helper.get_geometry_data(visualization)
      bbox_value = !bbox_value.nil? ? "ST_AsText('#{bbox_value}')" : 'NULL'
      if visualization.type == CartoDB::Visualization::Member::TYPE_DERIVED
        %Q{, visualization_bbox = #{bbox_value},
             visualization_view_box = #{geometry_data[:view_box_polygon]},
             visualization_view_box_center = #{geometry_data[:center_geometry]},
             visualization_zoom = #{geometry_data[:zoom]}}
      elsif !bbox_value.nil?
        %Q{, visualization_bbox = #{bbox_value}}
      else
        return
      end
    end

    def common_data_user
      username = Cartodb.config[:explore_api]['username']
      User.where(username: username).first
    end

    alias :target_user :common_data_user

    def touch_metadata(user)
      user.in_database(as: :superuser).run(%Q{SELECT CDB_TableMetadataTouch('#{VISUALIZATIONS_TABLE}')})
    end

    def stats_aggregator
      CartoDB::Stats::ExploreAPI.instance
    end

  end

end
