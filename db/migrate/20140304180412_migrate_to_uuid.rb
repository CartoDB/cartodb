Sequel.migration do
  up do
    TABLE_LIST = {
      'assets' => ['id', 'user_id'],
      'automatic_geocodings' => ['id', 'table_id'],
      'client_applications' => ['id', 'user_id'],
      'data_imports' => ['id', 'user_id', 'table_id'],
      'geocodings' => ['id', 'user_id', 'table_id', 'automatic_geocoding_id'],
      'layers_maps' => ['id', 'map_id', 'layer_id'],
      'layers_users' => ['id', 'user_id', 'layer_id', ],
      'layers_user_tables' => ['id', 'user_table_id', 'layer_id'],
      'layers' => ['id'],
      'maps' => ['id', 'user_id'],
      'oauth_nonces' => ['id'],
      'oauth_tokens' => ['id', 'user_id', 'client_application_id'],
      'overlays' => ['id'],
      'synchronizations' => ['user_id'],
      'tags' => ['id', 'user_id', 'table_id'],
      'user_tables' => ['id', 'user_id', 'map_id', 'data_import_id'],
      'users' => ['id'],
      'visualizations' => ['map_id', 'active_layer_id']
    }

    manual_uuid_migration_steps = <<-EOS

The database migration has been stopped. 
Your database needs manual upgrade in order to use this CartoDB version or
any other newer one.

In this version we have moved from integer based ids to UUID based integers.
Your database already contains data so we believe it's dangerous letting the
rails migration do this task for you.

We have created a script to help you migrate your database. We highly encourage
to make a FULL backup of your database. This backup involves both PostgreSQL
metadata and user data databases and redis metadata database.

In order to run this migration you need to stop your application and make sure
that there is not any connection to your databases while you run the script.

After you run the migration script manually you need to run again the rails
migration task. This migration will detect that your database is already in the
right state and will continue normally.

Notice that this migration is mandatory in order to use this CartoDB version
and any other future version. Also, versions starting with this one are
incompatible with the old database schema with integer based ids.

These are the steps you need to follow in order to run the manual script:
        
  $ cd <application_root>
  $ export RAILS_ENV=<rails_env>
  $ export DBNAME=<your_postgresql_database_name>
  $ export DBHOST=<your_postgresql_database_host>
  $ export DBPORT=<your_postgresql_database_port>
  $ export DBUSER=<your_postgresql_database_user>
  $ export REDIS_HOST=<your_redis_host>
  $ bundle exec ./script/migrate_to_uuid.rb schema
  $ bundle exec ./script/migrate_to_uuid.rb meta
  $ bundle exec ./script/migrate_to_uuid.rb data
  $ bundle exec ./script/migrate_to_uuid.rb clean

    EOS

    fields_count = 0
    outdated_fields = {}
    tables_data = true
    TABLE_LIST.each do |table_name,columns|
      fields_count = fields_count + columns.length
      table_rows = SequelRails.connection[table_name.to_sym].count
      if table_rows == 0
        tables_data = false
      else
        tables_data = true
      end
      columns.each do |column|
        result = SequelRails.connection.fetch(%Q{
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name='#{table_name}' AND column_name='#{column}';
        }).first
        if result[:data_type] != 'uuid'
          if outdated_fields[table_name].nil?
            outdated_fields[table_name] = []
          end
          outdated_fields[table_name] << column
        end
      end
    end
    outdated_fields_count = 0
    outdated_fields.each do |k,v|
      outdated_fields_count = outdated_fields_count + v.length
    end

    ## Check results. Do actions
    #
    if tables_data == false
      if outdated_fields_count > 0 # one or more ids are not uuid
        uuid_extension = SequelRails.connection.fetch(%Q{
        SELECT count(*) as count
        FROM pg_available_extensions
        WHERE name='uuid-ossp'
        }).first
        if uuid_extension[:count] == 0
          puts "This migration cannot continue. You need to have postgresql extension 'uuid-ossp' installed"
        else
          SequelRails.connection.run(%Q{
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
          })
        end
        SequelRails.connection.transaction do
          TABLE_LIST.each do |table_name,columns|
            columns.each do |column|
              SequelRails.connection.run(%Q{
              ALTER TABLE #{table_name}
              DROP COLUMN #{column}
              })
              if column == 'id'
                SequelRails.connection.run(%Q{
                ALTER TABLE #{table_name}
                ADD COLUMN id uuid UNIQUE PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4()
                })
              else
                SequelRails.connection.run(%Q{
                ALTER TABLE #{table_name}
                ADD COLUMN #{column} uuid
                })
              end
            end
          end
        end
      end # end not all uids
    else # contains data
      if outdated_fields_count > 0 # one or more ids are not uuid
        if outdated_fields_count == fields_count # all integers
          puts manual_uuid_migration_steps
          exit(1)
        else # end all integers
          unexpected_uuid_migration_message = <<-EOS

The database migration has been stopped. 
Your database needs manual upgrade in order to use this CartoDB version or
any other newer one.

However your metadata database schema doesn't seem to be in the expected 
state. 
You only have #{outdated_fields_count} outdated fields of a 
#{fields_count} total. You should have either all fields outdated or all 
fields updated. Please, drop a line in our community forums in order to 
get help.

          EOS
          puts unexpected_uuid_migration_message
          exit(1)
        end # end not all integers
      end # end not all uuids
    end # if there are outdated fields
  end # migration up

  down do
    raise "Integer to UUID based IDs migration cannot be rolled back"
  end
end
