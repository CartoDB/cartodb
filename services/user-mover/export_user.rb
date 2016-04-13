#!/usr/bin/env ruby
# coding: utf-8

# export-user.rb
# This class can be used to generate an as-is backup of the metadata of an user.
# It can be ran against a single user or a single user ID or a list of any of both.
# See lib/tasks/user_mover.rake for usage examples.

require 'pg'
require 'redis'
require 'yaml'
require 'optparse'
require 'json'
require 'tsort'
require 'securerandom'

require_relative 'config'
require_relative 'utils'

module CartoDB
  module DataMover
    class DumpJob
      attr_reader :logger
      include CartoDB::DataMover::Utils
      def dump_db
        # find database host for user
        run_command("pg_dump #{conn_string(
          CartoDB::DataMover::Config[:dbuser],
          @database_host,
          CartoDB::DataMover::Config[:user_dbport],
          @database_name,
        )} -Fc -f #{@filename} --serializable-deferrable -v")
      end

      def initialize(database_host, database_name, path, filename, database_schema = nil, logger = default_logger)
        @database_host = database_host
        @database_name = database_name
        @filename = filename
        @database_schema = database_schema
        @path = path
        @logger = logger

        if database_schema == nil
          dump_db
        else
          dump_schema
        end
      end

      def dump_schema
        run_command("pg_dump #{conn_string(
          CartoDB::DataMover::Config[:dbuser],
          @database_host,
          CartoDB::DataMover::Config[:user_dbport],
          @database_name,
        )} -f #{@path}#{@database_schema}.schema.sql -n #{@database_schema} --verbose --no-tablespaces -Z 0")
      end
    end
  end
end

module CartoDB
  module DataMover
    class TsortableHash < Hash
      include TSort
      alias tsort_each_node each_key
      def tsort_each_child(node, &block)
        fetch(node).each(&block)
      end
    end
    class ExportJob
        attr_reader :logger

        REDIS_KEYS = {
          mapviews: {
            template: "user:USERNAME:mapviews:*",
            var_position: 1,
            type: 'zset',
            db: 5,
            separator: ":"
          },
          map_style: {
            template: "map_style|USERDB|*",
            var_position: 1,
            separator: '|',
            db: 0,
            type: 'string'
          },
          map_template: {
            template: "map_tpl|USERNAME",
            no_clone: true,
            var_position: 1,
            separator: '|',
            db: 0,
            type: 'hash'
          },
          table: {
            template: "rails:USERDB:*",
            var_position: 1,
            separator: ':',
            db: 0,
            type: 'hash',
            attributes: {
              user_id: 'USERID'
            }
          },
          limits_tiler: {
            template: "limits:tiler:USERNAME",
            no_clone: true,
            var_position: 2,
            separator: ':',
            db: 5,
            type: 'hash'
          },
          user: {
            template: "rails:users:USERNAME",
            no_clone: true,
            var_position: 2,
            separator: ':',
            db: 5,
            type: 'hash',
            attributes: {
              database_name: 'USERDB',
              id: 'USERID'
            }
          }
        }
      TABLE_NULL_EXCEPTIONS = ['table_quota'] # those won't be discarded if set to NULL
      include CartoDB::DataMover::Utils

      def get_user_metadata(user_id)
        q = pg_conn.exec("SELECT * FROM users WHERE username = '#{user_id}'")
        if q.count > 0
          user_data = q[0]
        else
          raise "Can't find user #{@user_id}"
        end
        user_data
      end

      def get_org_metadata(organization_id)
        q = pg_conn.exec("SELECT * FROM organizations WHERE name = '#{organization_id}'")
        if q.count > 0
          org_data = q[0]
        else
          raise "Can't find organization #{@organization_id}"
        end

        org_data
      end

      def get_org_users(organization_id)
        q = pg_conn.exec("SELECT * FROM users WHERE organization_id = '#{organization_id}'")
        if q.count > 0
          return q
        else
          raise "Can't find organization #{@organization_id}"
        end
      end

      def get_org_groups(organization_id)
        pg_conn.exec("SELECT * FROM groups WHERE organization_id = '#{organization_id}'")
      end

      def get_user_models_metadata
        data = dump_related_data(Carto::User, @user_id)
        data[Carto::User] = [@user_data]
        data.reject! { |key, _value| [Carto::Organization, Carto::Group, Carto::FeatureFlag].include?(key) }
        data
      end

      def dump_user_metadata
        dump_sql_data(get_user_models_metadata, "user_#{@user_id}")
        dump_redis_keys
      end

      def dump_role_grants(role)
        roles = user_pg_conn.exec("SELECT oid, rolname FROM pg_roles WHERE pg_has_role( '#{role}', oid, 'member');")
        roles.map { |q| q['rolname'] }.reject { |r| r == role }
      end

      def dump_org_metadata
        data = dump_related_data(Carto::Organization, @org_id)
        data[Carto::Organization] = [@org_metadata]
        data.select! { |key, _value| [::Carto::Organization, ::Carto::Group].include?(key) }
        dump_sql_data(data, "org_#{@org_id}")
      end

      def dump_sql_data(data, prefix)
        # We sort the order of the tables to be exported so rows are imported before their dependencies, and deleted after.
        # For this, we generate a dependency tree and then use the built-in "tsort" topological sort library
        models = data.keys
        model_dependencies = models.map do |m|
          [m,
           m.reflections.values.select(&:belongs_to?)
           .reject { |r| !r.inverse_of.nil? && r.inverse_of.belongs_to? } # Remove mutual foreign_keys
           .map(&:klass).select { |s| models.include?(s) }]
        end
        models_ordered = TsortableHash[model_dependencies].tsort
        File.open(@options[:path] + "#{prefix}_metadata.sql", "w") do |f|
          models_ordered.each do |model|
            data[model].each do |rows|
              keys = rows.keys.select { |k| !TABLE_NULL_EXCEPTIONS.include?(k.to_s) == (!rows[k].nil?) }
              f.write generate_pg_insert_query(model.table_name, keys, rows)
            end
          end
        end
        File.open(@options[:path] + "#{prefix}_metadata_undo.sql", "w") do |f|
          models_ordered.reverse_each do |model|
            data[model].each do |rows|
              keys = rows.keys.select { |k| !rows[k].nil? }
              f.write generate_pg_delete_query(model.table_name, rows)
            end
          end
        end
      end

      def generate_pg_delete_query(table_name, rows)
        "DELETE FROM #{table_name} WHERE id = '#{rows['id']}';\n"
      end

      # This could be more solid by avoiding to generate SQL queries manually. There are
      # two things here besides the generation itself. The need for setting the NULL word
      # and escaping stuff, quoting marks, etc..
      # A safer way would be selecting the affected rows in a new table and dump the table.
      # That would require creating and removing extra tables
      # Another approach would be using COPY with SQL query into a CSV and restore it later
      def generate_pg_insert_query(table_name, keys, rows)
        "INSERT INTO #{table_name}(#{keys.map { |i| "\"#{i}\"" }.join(',')}) VALUES(#{keys.map { |i| rows[i] == nil ? 'NULL' : "'" + pg_conn.escape_string(rows[i]) + "'" }.join(',')});\n"
      end

      def dump_related_data(model, id, exclude = [])
        data = {}
        id = [id] if id.is_a? Integer or id.is_a? String


        # first dump this model
        query = "SELECT * FROM #{model.table_name} WHERE id IN (#{id.map { |i| "'#{i}'" }.join(', ')});"
        result = pg_conn.exec(query)
        data[model] = (0..result.cmd_tuples - 1).map do |tuple_number|
          result[tuple_number]
        end

        model.reflections.each do |_name, reflection|
          unless exclude.include? reflection.klass or !reflection.through_reflection.nil?

            if reflection.belongs_to?
              ids = data[model].map { |t| t[reflection.association_foreign_key.to_s] }.reject { |t| t == nil }
              next if ids.empty?
              query = "SELECT * FROM #{reflection.table_name} WHERE #{reflection.association_primary_key} IN (#{ids.map { |i| "'#{i}'" }.join(', ')})"
            else
              query = "SELECT * FROM #{reflection.table_name} WHERE #{reflection.foreign_key} IN (#{id.map { |i| "'#{i}'" }.join(', ')})"
            end
            result = pg_conn.exec(query)

            data[reflection.klass] = (0..result.cmd_tuples - 1).map do |tuple_number|
              result[tuple_number]
            end

            ids = data[reflection.klass].map do |data_for_related_key|
              data_for_related_key["id"]
            end
            data.merge!(dump_related_data(reflection.klass, ids, exclude + [model])) { |_, x, y| merge_without_duplicated_ids(x, y) } if ids.length > 0
          end
        end

        data
      end

      def merge_without_duplicated_ids(x, y)
        # this gets called when we try to merge >1 table.
        # it will remove duplicates by ida
        (x + y).uniq { |s| s['id'] }
      end

      # This is not very solid since we are definining the protocol
      # It would be nice using dump/restore
      def gen_redis_proto(*cmd)
        proto = ""
        proto << "*" + cmd.length.to_s + "\r\n"
        cmd.each { |arg|
          proto << "$" + arg.to_s.bytesize.to_s + "\r\n"
          proto << arg.to_s + "\r\n"
        }
        proto
      end

      def format_redis_dump(str)
        str.gsub("'", %q(\\\'))
      end

      def dump_redis_keys
        File.open(@options[:path] + "user_#{@user_id}_metadata.redis", "wb") do |dump|
          File.open(@options[:path] + "user_#{@user_id}_metadata_undo.redis", "wb") do |undo|
            REDIS_KEYS.each do |k, v|
              dump.write gen_redis_proto("SELECT", v[:db])
              undo.write gen_redis_proto("SELECT", v[:db])
              redis_conn.select(v[:db])
              these_redis_keys = redis_conn.keys(redis_template_user_gsub(v[:template], @user_id, @username))
              these_redis_keys.each do |trd|
                type = redis_conn.type(trd)
                if type == 'string'
                  dump.write gen_redis_proto("SET", trd, redis_conn.get(trd))
                end

                if type == 'hash'
                  redis_conn.hgetall(trd).each do |key, value|
                    dump.write gen_redis_proto("HSET", trd, key, value)
                  end
                end

                if type == 'zset'
                  r = redis_conn.zrangebyscore(trd, '-inf', '+inf')
                  r.each do |r_key|
                    k = redis_conn.zscore(trd, r_key)
                    dump.write gen_redis_proto("ZINCRBY", trd, k, r_key)
                  end
                end
                undo.write gen_redis_proto("DEL", trd)
              end
            end
            dump.write redis_oauth_keys
          end
        end
      end

      def redis_oauth_keys
        dump = ""
        pg_conn.exec("SELECT token,user_id FROM oauth_tokens WHERE type='AccessToken' AND user_id = '#{@user_id}'") do |result|
          dump += gen_redis_proto("SELECT", 3)
          redis_conn.select(3)
          result.each do |row|
            redis_conn.hgetall("rails:oauth_access_tokens:#{row['token']}").each do |key, value|
              dump += gen_redis_proto("HSET", "rails:oauth_access_tokens:#{row['token']}", key, value)
            end
          end
        end
        dump
      end

      def redis_replace_from_template(template, id)
        if template.include?('USERDB')
          user_database(id)
        elsif template.include?('DBUSER')
          database_username(id)
        elsif template.include?('USERNAME')
          @username
        elsif template.include?('USERID')
          id
        else
          ''
        end
      end

      def redis_template_user_gsub(template, id, _username)
        replacement = redis_replace_from_template(template, id)
        if template.include?('USERDB')
          template.gsub('USERDB', replacement)
        elsif template.include?('DBUSER')
          template.gsub('DBUSER', replacement)
        elsif template.include?('USERNAME')
          template.gsub('USERNAME', replacement)
        else
          ''
        end
      end

      def alter_redis_hash(redis_key, _redis_attribute, redis_value, options = {})
        redis_db = options['db'].nil? ? 0 : options['db']
        redis_conn.select(redis_db)
        redis_conn.hset(redis_key, @user_id, redis_value)
      end

      def redis_conn
        @redis ||= Redis.new(host: CartoDB::DataMover::Config[:redis_host], port: CartoDB::DataMover::Config[:redis_port])
      end

      def pg_conn
        @conn ||= PGconn.connect(host: CartoDB::DataMover::Config[:dbhost],
                                 user: CartoDB::DataMover::Config[:dbuser],
                                 dbname: CartoDB::DataMover::Config[:dbname],
                                 port: CartoDB::DataMover::Config[:dbport],
                                 password: CartoDB::DataMover::Config[:dbpass])
      end

      def user_pg_conn
        @user_conn ||= PGconn.connect(host: @database_host,
                                      user: CartoDB::DataMover::Config[:dbuser],
                                      dbname: @database_name,
                                      port: CartoDB::DataMover::Config[:user_dbport],
                                      password: CartoDB::DataMover::Config[:dbpass])
      end

      def run_command(cmd)
        p cmd
        IO.popen(cmd) do |io|
          Process.wait(io.pid)
        end
        puts "Output code: #{$?}"
      end

      def user_roles
        if @user_data['database_schema'] == 'public'
          roles = ['publicuser', database_username(@user_id)]
        else
          roles = ["cartodb_publicuser_#{@user_id}", database_username(@user_id)]
        end

        Hash[roles.map { |role| [role, dump_role_grants(role)] }]
      end

      def user_info
        { user: @user_data, roles: user_roles }
      end

      def reflections_for_model(model, skip = [], parents = [])
        result = {}
        parents << model.table_name.to_sym
        reflections = model.reflections
        related = reflections.keys.select { |r| reflections[r].through_reflection == nil && !parents.include?(reflections[r].table_name.to_sym) }
        relations = {}
        related.each do |reflection_name|
          reflection = reflections[reflection_name]
          relations[reflection.klass.table_name] = reflection.foreign_key
        end
        result[model.table_name] = { related: related.map { |t| reflections[t].klass.table_name }, relation_for: relations }
        related.each do |rel|
          unless skip.include?(reflections[rel].klass.table_name) || result.keys.include?(reflections[rel].klass.table_name)
            result.merge!(reflections_for_model(reflections[rel.to_sym].klass, (skip + result.keys).uniq, parents))
          end
        end
        result
      end

      def exportjob_logger
        @@exportjob_logger ||= ::Logger.new("#{Rails.root}/log/datamover.log")
      end

      def get_db_size(database)
        q = user_pg_conn.exec("SELECT pg_database_size('#{database}')")
        if q.count > 0
          size = q[0]['pg_database_size']
        else
          raise "Can't find db #{database}"
        end
        size
      end

      def initialize(options)
        default_options = { metadata: true, data: true, split_user_schemas: true, path: '' }
        @options = default_options.merge(options)

        @start = Time.now
        @logger = options[:logger] || default_logger


        job_uuid = @options[:job_uuid] || SecureRandom.uuid
        export_log = {'job_uuid'               => job_uuid,
                      'id'                     => @options[:id] || @options[:organization_name] || nil,
                      'type'                   => 'export',
                      'path'                   => @options[:path],
                      'start'                  => @start,
                      'end'                    => nil,
                      'server'                 => `hostname`.strip,
                      'pid'                    => Process.pid,
                      'db_source'              => nil,
                      'db_size'                => nil,
                      'status'                 => nil,
                      'trace'                  => nil
                     }

        begin
          if @options[:id]
            @user_data = get_user_metadata(options[:id])
            @username = @user_data["username"]
            @user_id = @user_data["id"]
            @database_host = @user_data['database_host']
            @database_name = @user_data['database_name']
            export_log[:db_source] = @database_host
            export_log[:db_size] = get_db_size(@database_name)
            dump_user_metadata if @options[:metadata]
            redis_conn.quit
            if @options[:data]
              DumpJob.new(
                @user_data['database_host'] || '127.0.0.1',
                @user_data['database_name'],
                @options[:path],
                "#{@options[:path]}user_#{@user_id}.dump",
                @options[:schema_mode] ? @user_data['database_schema'] : nil,
                @logger
              )
            end

            File.open("#{@options[:path]}user_#{@user_id}.json", "w") do |f|
              f.write(user_info.to_json)
            end
            set_user_mover_banner(@user_id)
          elsif @options[:organization_name]
            @org_metadata = get_org_metadata(@options[:organization_name])
            @org_id = @org_metadata['id']
            @org_users = get_org_users(@org_metadata['id'])
            @org_groups = get_org_groups(@org_metadata['id'])

            # Ensure all users belong to the same database
            database_names = @org_users.map{|u| u['database_name']}.uniq
            raise "Organization users inconsistent - there are users belonging to multiple databases" if database_names.length > 1
            @database_name = database_names[0]

            # Ensure all users belong to the same database host
            database_hosts = @org_users.map{|u| u['database_host']}.uniq
            raise "Organization users inconsistent - there are users belonging to multiple database hosts" if database_hosts.length > 1
            @database_host = database_hosts[0]

            dump_org_metadata if @options[:metadata]
            data = { organization: @org_metadata, users: @org_users.to_a, groups: @org_groups, split_user_schemas: @options[:split_user_schemas] }
            File.open("#{@options[:path]}org_#{@org_metadata['id']}.json", "w") do |f|
              f.write(data.to_json)
            end

            export_log[:db_source] ||= @database_host
            export_log[:db_size] ||= get_db_size(@database_name)

            if @options[:data] && !@options[:split_user_schemas]
              DumpJob.new(
                @database_host,
                @database_name,
                @options[:path],
                "#{@options[:path]}org_#{@org_id}.dump",
                nil,
                @logger
              )
            end
            @org_users.each do |org_user|
              export_job = CartoDB::DataMover::ExportJob.new({
                                                               id: org_user['username'],
                                                               data: @options[:data] && @options[:split_user_schemas],
                                                               path: @options[:path],
                                                               job_uuid: job_uuid,
                                                               from_org: true,
                                                               schema_mode: true
                                                             })
            end
          end
        rescue => e
          export_log[:end] = Time.now
          export_log[:status] = 'failure'
          export_log[:trace] = e.to_s
          if options[:organization_name]
            @org_users.each do |org_user|
              remove_user_mover_banner(org_user['id'])
            end
          end
          raise
        else
          export_log[:end] = Time.now
          export_log[:status] = 'success'
        ensure
          exportjob_logger.info(export_log.to_json) unless options[:from_org]
        end
      end
    end
  end
end
