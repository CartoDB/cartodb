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
require 'uuid'
DBHOST = ENV['DBHOST'] || 'localhost'
DBUSER = ENV['DBUSER'] || 'postgres'
DBNAME = ENV['DBNAME'] || 'cartodb_production'
REDIS_HOST = ENV['REDIS_HOST'] || '127.0.0.1'
REDIS_PORT = ENV['REDIS_PORT'] || '6379'
ENVIRONMENT = ENV['ENVIRONMENT'] || 'production'

TABLE_NULL_EXCEPTIONS = ['table_quota'] #those won't be discarded if set to NULL

options = {}
parser = OptionParser.new do |opts|
  opts.banner = "Usage: #{__FILE__} [-f FILE | -u ID] [-I|--ids]"
  opts.on("-f", "--file FILE", "Use a file with a list of accounts") do |f|
    options[:file] = f
  end
  opts.on("-u", "--user ID", "Dump a single account (ID or username)") do |f|
    options[:id] = f
  end
  opts.on("-I", "--ids", "search by IDs instead of usernames") do |f|
    options[:ids] = true
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

@logs = []
tables = {
  :assets => { 
    :related => [],
    :singular => 'asset'
  },
  :automatic_geocodings => { 
    :related => ['geocodings'],
    :singular => 'automatic_geocoding'
  },
  :client_applications => {
    :related => ['oauth_tokens'],
    :singular => 'client_application'
  },
  :data_imports => {
    :related => ['user_tables'],
    :singular => 'data_import'
  },
  :geocodings => {
    :related => [],
    :singular => 'geocoding'
  },
  :layers => {
    :related => ['visualizations'],
    :singular => 'layer',
    :relation_for => {'visualizations' => 'active_layer'}
  },
  :layers_maps => {
    :related => [],
    :singular => 'layer_map',
    :many_to_many => {'layers' => 'layer'}
  },
  :layers_user_tables => {
    :related => [],
    :singular => 'layer_user_table',
    :many_to_many => {'layers' => 'layer'}
  },
  :layers_users => {
    :related => [],
    :singular => 'layer_user',
    :many_to_many => {'layers' => 'layer'}
  },
  :maps => {
    :related => ['user_tables', 'layers_maps', 'visualizations'],
    :singular => 'map'
  },
  :oauth_nonces => {
    :related => [],
    :singular => 'oauth_nonce'
  },
  :oauth_tokens => {
    :related => [],
    :singular => 'oauth_token'
  },
  :overlays => {
    :related => [],
    :singular => 'overlay'
  },
  :tags => {
    :related => [],
    :singular => 'tag'
  },
  :user_tables => {
    :related => ['data_imports', 'layers_user_tables', 'tags', 'automatic_geocodings', 'geocodings'],
    :singular => 'table',
    :relation_for => {'layers_user_tables' => 'user_table'}
  },
  :users => {
    :related => ['user_tables', 'maps', 'layers_users', 'assets', 'client_applications', 'oauth_tokens', 'tags', 'data_imports', 'synchronizations', 'geocodings'],
    :singular => 'user'
  },
  :visualizations => {
    :related => ['overlays'],
    :singular => 'visualization'
  },
  :synchronizations => {
    :related => [],
    :singular => 'synchronization'
  }
}

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


def dump_user_data(user_id, tables, redis_keys, ids=false)
  if ids
    q = @conn.exec("SELECT * FROM users WHERE id = '#{user_id}'")[0]
  else
    q = @conn.exec("SELECT * FROM users WHERE username = '#{user_id}'")
  end
  if q.count > 0
    @user_data = q[0]
  else
    @logs << "Can't find user #{user_id}"
    return
  end
  username = @user_data["username"]
  user_id = @user_data["id"]
  data = dump_related_data(tables, :users, user_id)
  data[:users] = [@user_data]
  File.open("user_#{user_id}_metadata.sql", "w") do |f|
    data.each do |table_name, table|
      table.each do |rows|
        keys = rows.keys.select{|k| !TABLE_NULL_EXCEPTIONS.include?(k.to_s) == (rows[k] != nil)}
        p keys
        f.write "INSERT INTO #{table_name}(#{keys.collect{|i| "\"#{i}\""}.join(",")}) VALUES(#{keys.collect{|i| rows[i] == nil ? 'NULL' : "'"+@conn.escape_string(rows[i])+"'"} .join(",")});\n"
      end
    end
  end
  File.open("user_#{user_id}_metadata_undo.sql", "w") do |f|
    data.each do |table_name, table|
      table.each do |rows|
        keys = rows.keys.select{|k| rows[k] != nil }
        f.write "DELETE FROM #{table_name} WHERE id = '#{rows['id']}';\n"
      end
    end
  end

  dump = dump_redis_keys(redis_keys, user_id, username) 
end

def dump_related_data(tables, model, id, parent='')
  data = {}
  id = [id] if id.is_a? Integer or id.is_a? String
  model_object = tables[model.to_sym]
  #first dump this model
  query = "SELECT * FROM #{model.to_s} WHERE id IN (#{id.collect{|i| "'#{i}'"}.join(", ")});"
  result = @conn.exec(query)
  data[model] = (0..result.cmd_tuples-1).collect do |tuple_number|
    result[tuple_number]
  end
  model_object[:related].reject{|r| r.to_sym == parent.to_sym}.each do |related_key|
    other_key = model_object.fetch(:relation_for, {}).fetch(related_key, false) || model_object[:singular]
    query = "SELECT * FROM #{related_key} WHERE #{other_key}_id IN (#{id.collect{|i| "'#{i}'"}.join(", ")})"
    result = @conn.exec(query)

    data[related_key] = (0..result.cmd_tuples-1).collect do |tuple_number|
      result[tuple_number]
    end

    ids = data[related_key].collect do |data_for_related_key|
      data_for_related_key["id"]
    end
    data.merge!(dump_related_data(tables, related_key, ids, model))  {|_,x,y| merge_without_duplicated_ids(x,y) } if ids.length > 0
    #end
  end

  if model_object[:many_to_many]
    model_object[:many_to_many].each do |key, value|
      ids = data[model].collect do |data_for_related_key|
        data_for_related_key[value+"_id"]
      end
      data.merge!(dump_related_data(tables, key, ids, key)) {|_,x,y| merge_without_duplicated_ids(x,y) } if ids.length > 0
    end
  end
  return data
end

def merge_without_duplicated_ids(x,y)
  #this gets called when we try to merge >1 table.
  #it will remove duplicates by ida
  (x+y).uniq {|s| s['id']}
end

def gen_redis_proto(*cmd)
  proto = ""
  proto << "*"+cmd.length.to_s+"\r\n"
  cmd.each{|arg|
    proto << "$"+arg.to_s.bytesize.to_s+"\r\n"
    proto << arg.to_s+"\r\n"
  }
  proto
end

def format_redis_dump(str)
  str.gsub("'", %q(\\\'))
end
def dump_redis_keys(redis_keys, id, username)
  File.open("user_#{id}_metadata.redis", "wb") do |dump|
    File.open("user_#{id}_metadata_undo.redis", "wb") do |undo|
      uuid = id
      redis = Redis.new(:host => REDIS_HOST, :port => REDIS_PORT)
      redis_keys.each do |k,v|
        dump.write gen_redis_proto("SELECT", v[:db])
        undo.write gen_redis_proto("SELECT", v[:db])
        redis.select(v[:db])
        these_redis_keys = redis.keys(redis_template_user_gsub(v[:template], id, username))
        these_redis_keys.each do |trd|
          type = redis.type(trd)
          if type == 'string'
            dump.write gen_redis_proto("SET", trd,  redis.get(trd))
          end

          if type == 'hash'
            redis.hgetall(trd).each do |key,value|
              dump.write gen_redis_proto("HSET", trd, key, value)
            end
          end

          if type == 'zset'
            r = redis.zrangebyscore(trd, '-inf','+inf')
            r.each do |r_key|
              k = redis.zscore(trd, r_key)
              dump.write gen_redis_proto("ZINCRBY", trd, r_key, k)
            end
          end
          undo.write gen_redis_proto("DEL", trd)
        end
      end
      dump.write redis_oauth_keys(id)
      redis.quit
    end
  end
end

def redis_oauth_keys(user_id)
  dump = ""
  redis = Redis.new(:host => REDIS_HOST)
  @conn.exec("SELECT token,user_id FROM oauth_tokens WHERE type='AccessToken' AND user_id = '#{user_id}'") do |result|
    dump += gen_redis_proto("SELECT", 3)
    redis.select(3)
    result.each do |row|
      redis.hgetall("rails:oauth_access_tokens:#{row['token']}").each do |key, value|
        dump += gen_redis_proto("HSET", "rails:oauth_access_tokens:#{row['token']}", key, value)
      end
    end
  end  
  dump
end

def redis_replace_from_template(template, id, username)
  if template.include?('USERDB')
    user_database(id)
  elsif template.include?('DBUSER')
    database_username(id)
  elsif template.include?('USERNAME')
    username
  elsif template.include?('USERID')
    id
  else
    '' 
  end
end

def redis_template_user_gsub(template, id, username)
  replacement = redis_replace_from_template(template, id, username)
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
  redis = Redis.new(:host => REDIS_HOST)
  redis.select(redis_db)
  redis.hset(redis_key, user_id, redis_value)
  redis.quit
end

def relation_column_name_for(tables, table, related)
  if tables[table][:related].include?(related) && tables[table][:relation_for] && tables[table][:relation_for][related]
    tables[table][:relation_for][related]
  else
    tables[table][:singular]
  end
end



def database_username(user_id)
  "#{db_username_prefix}#{user_id}"
end #database_username

def user_database(user_id)
  "#{database_name_prefix}#{user_id}_db"
end #user_database

def db_username_prefix
  return "cartodb_user_" if ENVIRONMENT == 'production'
  return "development_cartodb_user_" if ENVIRONMENT == 'development'
  "cartodb_user_#{ENVIRONMENT}_"
end #username_prefix

def database_name_prefix
  return "cartodb_user_" if ENVIRONMENT == 'production'
  return "cartodb_dev_user_" if ENVIRONMENT == 'development'
  "cartodb_#{ENVIRONMENT}_user_"
end #database_prefix

@conn = PGconn.connect( host: DBHOST, user: DBUSER, dbname: DBNAME )
if options[:id]
  dump_user_data(options[:id], tables, redis_keys, options[:ids])
elsif options[:file]
  users = File.read(options[:file]).split("\n").collect{|l| l.strip }
  users.each do |user|
    dump_user_data(user, tables, redis_keys, options[:ids])
  end
end
puts ""
puts "#############"
puts "#{@logs.length} errors"
puts "#############"
puts @logs.join("\n")
