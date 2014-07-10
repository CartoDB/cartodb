require_relative 'utils'

module CartoDB
  module Relocator
    class Tester
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
        @dbname = @config[:dbname]
        @username = @config[:username]
        @user_obj = @config[:user_object]
      end

      def get_state(conn)
        state = {}
        state[:number_of_tables] = get_number_of_tables(conn)
        state[:names_of_tables] = get_names_of_tables(conn)
        #state[:statement_timeout] = get_statement_timeout(conn)
        state[:query_tables_layers] = query_tables_layers(conn)
        state
      end

      def get_number_of_tables(conn)
        PG.connect(conn[:conn])
          .query("select count(*) from information_schema.tables where table_type='BASE TABLE' AND table_schema='#{conn[:schema]}' and table_name NOT IN ('spatial_ref_sys');")
          .to_a[0]['count']
      end

      def get_names_of_tables(conn)
        PG.connect(conn[:conn])
          .query("select count(*) from information_schema.tables where table_type='BASE TABLE' AND table_schema='#{conn[:schema]}' and table_name NOT IN ('spatial_ref_sys');")
          .to_a.collect{|t| t['rel_name']}
      end

      def get_statement_timeout(conn)
        PG.connect(conn[:conn])
          .query('show statement_timeout').to_a[0]['statement_timeout']
      end

      def query_tables_layers(conn)
        return false if @user_obj == nil
        sequel_conn = ::Sequel.connect(
          {adapter: 'postgres',
           host: conn[:conn][:host],
           port: conn[:conn][:port],
           username: conn[:conn][:username],
           database: conn[:conn][:dbname]
          })
        @user_obj.maps.collect do |map|
          map.layers.collect do |layer|
            query = JSON.parse(layer.values[:options])['query']
            if query != nil
              begin
                CartoDB::SqlParser.new(query, connection: sequel_conn)
                  .affected_tables.collect{|t| t.split(".")[1]}
              rescue
                nil
              end
            else
              nil
            end
          end.flatten
        end.flatten
      end

      def compare_state
        puts "Fetching stats for original database.."
        first = get_state(@config[:source])
        puts "Fetching stats for target database.."
        last = get_state(@config[:target])
        first.keys.collect do |key|
          throw "Consistency fail: #{key} (#{first[key]} != #{last[key][to_s]}) " if first[key] != last[key]
          [key, first[key] == last[key]]
        end
      end

    end
  end
end

