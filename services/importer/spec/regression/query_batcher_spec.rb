# encoding: utf-8

require 'rspec'
require 'mocha'
require_relative '../../lib/importer/query_batcher'
require_relative '../factories/pg_connection'

module CartoDB
  module Importer2

    describe QueryBatcher do

      before do
        conn = Factories::PGConnection.new
        @db = conn.connection
        @pg_options = conn.pg_options
        @table_name = 'query_batcher_table_test'
        @n_values = 3
        @batch_size = 1
      end

      def fetch_values(query)
        @db.fetch(query).all.map { |r| r[:id] }
      end

      before(:each) do
        @db.run(%Q[create table #{@table_name} (id integer)])
        @db.run(%Q[insert into #{@table_name} select generate_series(1, #{@n_values})])
      end

      after(:each) do
        @db.drop_table @table_name
      end

      describe 'QueryBatcher#execute' do

        it 'processes every row' do
          QueryBatcher.execute(@db, %Q[update #{@table_name} set id = id * 10], @table_name, nil, '', false, @batch_size)
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every row for batch size bigger than table' do
          QueryBatcher.execute(@db, %Q[update #{@table_name} set id = id * 10], @table_name, nil, '', false, @n_values + 1)
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries matching all rows' do
          QueryBatcher.execute(@db, %Q[update #{@table_name} set id = id * 10 #{QueryBatcher::QUERY_WHERE_PLACEHOLDER} where id % 1 = 0 #{QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}], @table_name, nil, '', false, @batch_size)
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries not matching all rows' do
          pending('See #1994. For where-limited queries use instance execute method instead of class method') do
            QueryBatcher.execute(@db, %Q[update #{@table_name} set id = id * 10 #{QueryBatcher::QUERY_WHERE_PLACEHOLDER} where id % 2 = 0 #{QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}], @table_name, nil, '', false, @batch_size)
            fetch_values(%Q[select id from #{@table_name} order by id]).should eq [1, 3, 20]
          end
        end

      end

      describe '#execute_update' do
        before(:each) do
          @qb = QueryBatcher.new(@db, nil, false, @batch_size)
          @qb_big_batch = QueryBatcher.new(@db, nil, false, @n_values + 1)
        end

        it 'processes every row' do
          @qb.execute_update(%Q[update #{@table_name} set id = id * 10], @table_name, nil)
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every row for batch size bigger than table' do
          @qb_big_batch.execute_update(%Q[update #{@table_name} set id = id * 10], @table_name, nil)
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries matching all rows' do
          @qb.execute_update(%Q[update #{@table_name} set id = id * 10], @table_name, %Q[id % 1 = 0])
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries not matching all rows' do
          @qb.execute_update(%Q[update #{@table_name} set id = id * 10], @table_name, %Q[id % 2 = 0])
          fetch_values(%Q[select id from #{@table_name} order by id]).should eq [1, 3, 20]
        end

      end

    end

  end
end
