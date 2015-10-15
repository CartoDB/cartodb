#!/usr/bin/env ruby

# export-user.rb
# This script can be used to generate an as-is backup of the metadata of an user.
# It can be ran against a single user or a single user ID or a list of any of both.
# It will generate a SQL dump and a redis dump that can be ran against redis-cli --pipe
# and also the ones needed to remove that user.

require 'pg'
require 'redis'
require 'yaml'
require 'optparse'
require 'json'

require_relative 'config'
require_relative 'utils'


module CartoDB
  module DataMover
    class DumpJob
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

      def initialize(database_host, database_name, path, filename, database_schema=nil)
        @database_host = database_host
        @database_name = database_name
        @filename = filename
        @database_schema = database_schema
        @path = path

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
    class ExportJob
      TABLE_NULL_EXCEPTIONS = ['table_quota'] #those won't be discarded if set to NULL
      include CartoDB::DataMover::Utils

      def get_user_metadata(user_id)
        q = pg_conn.exec("SELECT * FROM users WHERE username = '#{user_id}'")
        if q.count > 0
          @user_data = q[0]
        else
          throw "Can't find user #{@user_id}"
        end
        @username = @user_data["username"]
        @user_id = @user_data["id"]
      end

      def get_org_metadata(organization_id)
        q = pg_conn.exec("SELECT * FROM organizations WHERE name = '#{organization_id}'")
        if q.count > 0
          org_data = q[0]
        else
          throw "Can't find organization #{@organization_id}"
        end

        org_data
      end

      def get_org_users(organization_id)
        q = pg_conn.exec("SELECT * FROM users WHERE organization_id = '#{organization_id}'")
        if q.count > 0
          return q
        else
          throw "Can't find organization #{@organization_id}"
        end
      end

      def get_org_groups(organization_id)
        q = pg_conn.exec("SELECT * FROM groups WHERE organization_id = '#{organization_id}'")
        if q.count > 0
          return q
        else
          throw "Can't find organization #{@organization_id}"
        end
      end

      def dump_user_data(redis_keys)
        data = dump_related_data(Carto::User, @user_id)
        data[Carto::User] = [@user_data]
        data.reject!{ |key, value| [Carto::Organization, Carto::Group, Carto::FeatureFlag].include?(key) }
        dump_sql_data(data, "user_#{@user_id}")
        dump_redis_keys(redis_keys)
      end


      def dump_role_grants(role)
        roles = pg_conn.exec("SELECT oid, rolname FROM pg_roles WHERE pg_has_role( '#{role}', oid, 'member');")
        roles.collect{|q| q['rolname']}.reject{|r| r == role}
      end

      def dump_org_data
        data = dump_related_data(Carto::Organization, @org_id)
        data[Carto::Organization] = [@org_metadata]
        data.select!{ |key, value| [Carto::Organization, Carto::Group].include?(key) }
        dump_sql_data(data, "org_#{@org_id}")
      end

      def dump_sql_data(data, prefix)

        # We sort the order of the tables to be exported so rows are exported after their dependencies, but deleted before.
        models = data.keys
        models_ordered = models.clone
        models.each do |model|
          depends = model.reflections.values.select{ |r| r.belongs_to? }.collect{ |r| r.klass }
          max_position = depends.collect{|s| models_ordered.index(s)}.reject{|s| s==nil}.max
          models_ordered.insert(max_position, models_ordered.delete(model)) unless max_position == nil
        end
        File.open(@options[:path] + "#{prefix}_metadata.sql", "w") do |f|
          models_ordered.reverse.each do |model|
            data[model].each do |rows|
              keys = rows.keys.select { |k| !TABLE_NULL_EXCEPTIONS.include?(k.to_s) == (rows[k] != nil) }
              f.write generate_pg_insert_query(model.table_name, keys, rows)
            end
          end
        end
        File.open(@options[:path] + "#{prefix}_metadata_undo.sql", "w") do |f|
          models_ordered.each do |model|
            data[model].each do |rows|
              keys = rows.keys.select { |k| rows[k] != nil }
              f.write generate_pg_delete_query(model.table_name, rows)
            end
          end
        end
      end

      def generate_pg_delete_query(table_name, rows)
        "DELETE FROM #{table_name} WHERE id = '#{rows['id']}';\n"
      end

      def generate_pg_insert_query(table_name, keys, rows)
        "INSERT INTO #{table_name}(#{keys.collect { |i| "\"#{i}\"" }.join(",")}) VALUES(#{keys.collect { |i| rows[i] == nil ? 'NULL' : "'"+pg_conn.escape_string(rows[i])+"'" }.join(",")});\n"
      end

      def dump_related_data(model, id, exclude=[])
        data = {}
        id = [id] if id.is_a? Integer or id.is_a? String

        #first dump this model
        query = "SELECT * FROM #{model.table_name} WHERE id IN (#{id.collect { |i| "'#{i}'" }.join(", ")});"
        result = pg_conn.exec(query)
        data[model] = (0..result.cmd_tuples-1).collect do |tuple_number|
          result[tuple_number]
        end


        model.reflections.each do |name, reflection|
          unless exclude.include? reflection.klass or reflection.through_reflection != nil

            if reflection.belongs_to?
              ids = data[model].collect{|t| t[reflection.association_foreign_key.to_s]}.reject{|t| t == nil}
              next if ids.empty?
              query = "SELECT * FROM #{reflection.table_name} WHERE #{reflection.association_primary_key} IN (#{ids.collect { |i| "'#{i}'" }.join(", ")})"
            else
              query = "SELECT * FROM #{reflection.table_name} WHERE #{reflection.foreign_key} IN (#{id.collect { |i| "'#{i}'" }.join(", ")})"
            end
            result = pg_conn.exec(query)

            data[reflection.klass] = (0..result.cmd_tuples-1).collect do |tuple_number|
              result[tuple_number]
            end

            ids = data[reflection.klass].collect do |data_for_related_key|
              data_for_related_key["id"]
            end
            data.merge!(dump_related_data(reflection.klass, ids, exclude+[model])) { |_, x, y| merge_without_duplicated_ids(x, y) } if ids.length > 0
          end
        end

        return data
      end

      def merge_without_duplicated_ids(x, y)
        #this gets called when we try to merge >1 table.
        #it will remove duplicates by ida
        (x+y).uniq { |s| s['id'] }
      end

      def gen_redis_proto(*cmd)
        proto = ""
        proto << "*"+cmd.length.to_s+"\r\n"
        cmd.each { |arg|
          proto << "$"+arg.to_s.bytesize.to_s+"\r\n"
          proto << arg.to_s+"\r\n"
        }
        proto
      end

      def format_redis_dump(str)
        str.gsub("'", %q(\\\'))
      end

      def dump_redis_keys(redis_keys)
        File.open(@options[:path] + "user_#{@user_id}_metadata.redis", "wb") do |dump|
          File.open(@options[:path] + "user_#{@user_id}_metadata_undo.redis", "wb") do |undo|
            redis_keys.each do |k, v|
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

      def redis_template_user_gsub(template, id, username)
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

      def alter_redis_hash(redis_key, redis_attribute, redis_value, options = {})
        redis_db = options['db'].nil? ? 0 : options['db']
        redis_conn.select(redis_db)
        redis_conn.hset(redis_key, @user_id, redis_value)
      end

      def redis_conn
        @redis ||= Redis.new(:host => CartoDB::DataMover::Config[:redis_host], :port => CartoDB::DataMover::Config[:redis_port])
      end

      def pg_conn
        @conn ||= PGconn.connect(host: CartoDB::DataMover::Config[:dbhost],
                                 user: CartoDB::DataMover::Config[:dbuser],
                                 dbname: CartoDB::DataMover::Config[:dbname],
                                 port: CartoDB::DataMover::Config[:dbport],
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

        Hash[roles.collect{|role| [role, dump_role_grants(role)]}]
      end

      def user_info
        {user: @user_data, roles: user_roles}
      end

      def reflections_for_model(model, skip=[], parents=[])
        result = {}
        parents << model.table_name.to_sym
        reflections = model.reflections
        related = reflections.keys.select{|r| reflections[r].through_reflection == nil && !parents.include?(reflections[r].table_name.to_sym) }
        relations = {}
        related.each do |reflection_name|
          reflection = reflections[reflection_name]
          relations[reflection.klass.table_name] = reflection.foreign_key
        end
        result[model.table_name] = {:related => related.collect{|t| reflections[t].klass.table_name}, :relation_for => relations}
        related.each do |rel|
          unless skip.include?(reflections[rel].klass.table_name) || result.keys.include?(reflections[rel].klass.table_name)
            result.merge!(reflections_for_model(reflections[rel.to_sym].klass, (skip+result.keys).uniq, parents))
          end
        end
        result
      end



      def initialize(options)
        @options = options
        @options[:path] ||= ''

        @logs = []

        redis_keys = {
            :mapviews => {
                :template => "user:USERNAME:mapviews:*",
                :var_position => 1,
                :type => 'zset',
                :db => 5,
                :separator => ":"
            },
            :map_style => {
                :template => "map_style|USERDB|*",
                :var_position => 1,
                :separator => '|',
                :db => 0,
                :type => 'string'
            },
            :map_template => {
                :template => "map_tpl|USERNAME",
                :no_clone => true,
                :var_position => 1,
                :separator => '|',
                :db => 0,
                :type => 'hash'
            },
            :table => {
                :template => "rails:USERDB:*",
                :var_position => 1,
                :separator => ':',
                :db => 0,
                :type => 'hash',
                :attributes => {
                    :user_id => 'USERID'
                }
            },
            :limits_tiler => {
                :template => "limits:tiler:USERNAME",
                :no_clone => true,
                :var_position => 2,
                :separator => ':',
                :db => 5,
                :type => 'hash'
            },
            :user => {
                :template => "rails:users:USERNAME",
                :no_clone => true,
                :var_position => 2,
                :separator => ':',
                :db => 5,
                :type => 'hash',
                :attributes => {
                    :database_name => 'USERDB',
                    :id => 'USERID'
                }
            }
        }
        if options[:id]
          get_user_metadata(options[:id])
          dump_user_data(redis_keys) unless options[:database_only] == true
          redis_conn.quit
          DumpJob.new(
              @user_data['database_host'] || '127.0.0.1',
              @user_data['database_name'],
              @options[:path],
              "#{@options[:path]}user_#{@user_id}.dump",
              options[:schema_mode] ? @user_data['database_schema'] : nil
          ) unless options[:metadata_only] == true

          File.open("#{@options[:path]}user_#{@user_id}.json", "w") do |f|
            f.write(user_info.to_json)
          end
        elsif options[:organization_name]
          @org_metadata = get_org_metadata(options[:organization_name])
          @org_id = @org_metadata['id']
          @org_users = get_org_users(@org_metadata['id'])
          @org_groups = get_org_groups(@org_metadata['id'])
          dump_org_data
          data = {organization: @org_metadata, users: @org_users.to_a, groups: @org_groups}
          File.open("#{@options[:path]}org_#{@org_metadata['id']}.json", "w") do |f|
            f.write(data.to_json)
          end
          @org_users.each do |org_user|
            CartoDB::DataMover::ExportJob.new({:id => org_user['username'], :metadata_only => true, :path => options[:path]})
            DumpJob.new(
                org_user['database_host'] || '127.0.0.1',
                org_user['database_name'],
                options[:path],
                "#{@options[:path]}user_#{@user_id}.dump",
                org_user['username']) unless options[:metadata_only] == true
          end
        end
        puts "#{@logs.length} errors"
        puts @logs.join("\n")
      end
    end
  end
end

if __FILE__ == $0

  options = {}
  parser = OptionParser.new do |opts|
    opts.banner = "Usage: #{__FILE__}  -u ID [-p|--path PATH]"
    opts.on("-u", "--user USERNAME", "Dump a single account (ID or username)") do |f|
      options[:id] = f
    end
    opts.on("-o", "--organization ORGNAME", "Dump an organization") do |f|
      options[:organization_name] = f
    end
    opts.on("-s", "--schemamode", "Dump schema instead of full database") do |f|
      options[:schema_mode] = true
    end
    opts.on("-d", "--database", "Dump database only (skip metadata)") do |f|
      options[:database_only] = true
    end
    opts.on("-m", "--metadata", "Dump metadata only (skip database)") do |f|
      options[:metadata_only] = true
    end
    opts.on("-p", "--path PATH", "export to path") do |f|
      options[:path] = f + "/"
    end
  end
  parser.parse!

  USER_ID = ARGV[0]

  def usage()
    puts "Check #{__FILE__} --help"
    p parser.help
    exit 1
  end

  if options.empty?
    puts parser.help
    exit 1
  end
  CartoDB::DataMover::ExportJob.new(options)
end
