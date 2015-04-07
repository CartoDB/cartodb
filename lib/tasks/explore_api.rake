namespace :cartodb do

  namespace :explore_api do
    VISUALIZATIONS_TABLE = 'explore_api_visualizations'
    CREATE_TABLE_SQL = %Q{ 
      create table #{VISUALIZATIONS_TABLE} (
        visualization_id UUID primary key,
        visualization_name text,
        visualization_description text,
        visualization_type text,
        visualization_tags text[],
        visualization_created_at timestamp with time zone,
        visualization_updated_at timestamp with time zone,
        visualization_map_id uuid,
        visualization_title text,
        user_id uuid,
        user_username text,
        user_organization_id uuid,
        user_twitter_username text,
        user_website text,
        user_avatar_url text,
        user_available_for_hire boolean,
        language regconfig default 'english'
      ) }
    FULL_TEXT_SEARCHABLE_COLUMNS = %w{ visualization_name visualization_description visualization_title }
    DROP_TABLE_SQL = %Q{ drop table #{VISUALIZATIONS_TABLE} }
    BATCH_SIZE = 1000

    task :setup => [:environment] do
      user = target_user
      user.in_database.run CREATE_TABLE_SQL
      FULL_TEXT_SEARCHABLE_COLUMNS.each { |c|
        user.in_database.run "CREATE INDEX #{VISUALIZATIONS_TABLE}_#{c}_fts_idx ON #{VISUALIZATIONS_TABLE} USING gin(to_tsvector(language, #{c}))"
      }
      #user.in_database.run "select cartodb.CDB_CartodbfyTable('#{user.database_schema}', '#{VISUALIZATIONS_TABLE}')"
    end

    task :drop => [:environment] do
      target_user.in_database.run DROP_TABLE_SQL
    end

    task :update => [:environment] do
      user = target_user

      page = 1
      while (visualizations = CartoDB::Visualization::Collection.new.fetch({
            page: page,
            per_page: BATCH_SIZE,
            order: :created_at,
            types: [CartoDB::Visualization::Member::TYPE_CANONICAL, CartoDB::Visualization::Member::TYPE_DERIVED],
            privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
          })).count > 0 do
        print "#{page} \t #{visualizations.count}\n"

        visualizations.map { |v|
          u = v.user

          tags = "'#{v.tags.map { |t| t.gsub("'", %q(\\\')) }.join("','")}'"

          user.in_database.run %Q{
            insert into #{VISUALIZATIONS_TABLE} (
              visualization_id, visualization_name, visualization_description,
              visualization_type, visualization_tags, visualization_created_at,
              visualization_updated_at, visualization_map_id, visualization_title, 
              user_id, user_username, user_organization_id,
              user_twitter_username, user_website, user_avatar_url,
              user_available_for_hire)
            values (
              '#{v.id}', '#{v.name}', '#{v.description}',
              '#{v.type}', ARRAY[#{tags}], '#{v.created_at}',
              '#{v.updated_at}', '#{v.map_id}', '#{v.title}',
              '#{u.id}', '#{u.username}', '#{u.organization_id}',
              '#{u.twitter_username}', '#{u.website}', '#{u.avatar_url}',
              '#{u.available_for_hire}'
            )
          }.gsub("''", "NULL")

        }

        page += 1
      end

    end

    def common_data_user
      username = Cartodb.config[:common_data]['username']
      User.where(username: username).first
    end

    alias :target_user :common_data_user

  end

end
