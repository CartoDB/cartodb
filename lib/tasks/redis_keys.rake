namespace :cartodb do
  namespace :redis_keys do
    module ExportRedisKeys
      def get_database(number)
        db_numbers[number] || raise('Invalid redis db')
      end

      def db_numbers
        @db_numbers || {
          '0' => $tables_metadata,
          '3' => $api_credentials,
          '5' => $users_metadata,
          '6' => $redis_migrator_logs,
          '8' => $limits_metadata
        }.freeze
      end

      def export_key(rdb, key)
        ttl = rdb.ttl(key)
        {
          ttl: ttl < 0 ? 0 : ttl,
          value: rdb.dump(key)
        }
      end

      def import_key(rdb, key, value)
        rdb.restore(key, value[:ttl], value[:value])
      end
    end

    desc 'export keys in file'
    task :export, [:filename, :db] => :environment do |_, args|
      include ExportRedisKeys

      if args[:filename].nil?
        puts "usage: bundle exec rake cartodb:redis_keys:export[filter_file]\n
              you must pass a file that contains the redis keys you want to export one per line"
        exit 1
      end

      rdb = get_database(args[:db])

      result = {}
      File.foreach(args[:filename]) do |line|
        line.strip!
        result[line] = export_key(rdb, line)
      end

      File.open('redis_export.json', 'w') { |file| file.write(result.to_json) }
    end

    desc 'import keys in given json file to redis db'
    task :import, [:filename, :db, :overwrite] => :environment do |_, args|
      include ExportRedisKeys

      if args[:filename].nil?
        puts "usage: bundle exec rake cartodb:redis_keys:import[file.json,redis_db,overwrite]\n
              File containing a json that will be used for restoring keys. Overwrite defaults to false"
        exit 1
      end
      args.with_defaults(overwrite: 'false')
      overwrite = args[:overwrite] == 'true'

      redis_hash = JSON.parse(File.read(args[:filename])).deep_symbolize_keys

      rdb = get_database(args[:db])
      redis_hash.each do |key, value|
        rdb.del(key) if overwrite && rdb.exists(key)
        if overwrite || !rdb.exists(key)
          puts "Importing #{key}"
          import_key(rdb, key, value)
        end
      end
    end

    desc 'export named_maps key'
    task :export_named_maps, [:file, :batch_size] => :environment do |_task, args|
      args.with_defaults(batch_size: 100)

      if args[:file].nil?
        puts "usage: bundle exec rake cartodb:redis_keys:export_named_maps[filter]\n
        you must pass a file that contains a filter to select users such as:\n
        username in ['alex', 'lemmy']"
        exit 1
      end

      module ExportNamedMaps
        def export_users_json_hash(users, batch_size)
          {
            redis: export_users(users, batch_size)
          }
        end

        def export_users(users, batch_size)
          export_users_hash = { tables_metadata: {} }
          users.use_cursor(rows_per_fetch: batch_size).each do |u|
            puts("Exporting named maps for user #{u.username}")
            export_users_hash[:tables_metadata].merge!(export_dataservices($tables_metadata, "map_tpl|#{u.username}"))
          end
          export_users_hash
        end

        def export_dataservices(rdb, prefix)
          rdb.keys(prefix.to_s).map { |key|
            export_key(rdb, key)
          }.reduce({}, &:merge)
        end

        def export_key(redis_db, key)
          {
            key => {
              ttl: [0, redis_db.pttl(key)].max, # PTTL returns -1 if not set, clamp to 0
              value: redis_db.hgetall(key)
            }
          }
        end
      end

      include ExportNamedMaps

      users = User.where(File.read(args[:file]).to_s)
      File.open('redis_export.json', 'w') { |file| file.write(export_users_json_hash(users, args[:batch_size]).to_json) }
    end

    desc 'import named_maps key '
    task :import_named_maps, [:filename] => :environment do |_task, args|

      if args[:filename].nil?
        puts "usage: bundle exec rake cartodb:redis_keys:import_named_maps['redis_export.json']\n
         you must pass the name of the file with the keys you want to import"
        exit 1
      end

      module ImportNamedMaps
        def restore_redis_from_hash_export(exported_hash)
          restore_redis(exported_hash[:redis])
        end

        def restore_redis(redis_export)
          restore_keys($tables_metadata, redis_export[:tables_metadata])
        end

        def restore_keys(redis_db, redis_keys)
          redis_keys.each do |key, value|
            value[:value].each do |k, v|
              redis_db.hset(key, k, v) unless redis_db.hexists(key, k)
            end
          end
        end
      end

      include ImportNamedMaps

      exported_json_string = File.read(Dir[args[:filename]].first)
      restore_redis_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end
  end
end
