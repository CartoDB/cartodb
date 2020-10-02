require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
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
        @table_name = 'cdbid_query_batcher_table_test'
        @n_values = 3
        @batch_size = 1
      end

      def fetch(query, column = :value)
        @db.fetch(query).all.map { |r| r[column] }
      end

      before(:each) do
        @db.run(%[create table #{@table_name} (cartodb_id integer, value integer)])
        @db.run(%[insert into #{@table_name}(cartodb_id) select generate_series(1, #{@n_values})])
        @db.run(%[update #{@table_name} set value = cartodb_id])
      end

      after(:each) do
        @db.drop_table @table_name
      end

      describe '#execute_update' do
        before(:each) do
          @qb = QueryBatcher.new(@db, nil, false, @batch_size)
          @qb_big_batch = QueryBatcher.new(@db, nil, false, @n_values + 1)
        end

        it 'processes every row' do
          @qb.execute_update(%[update #{@table_name} set value = value * 10], 'public', @table_name)
          fetch(%[select * from #{@table_name} order by cartodb_id]).should eq [10, 20, 30]
        end

        it 'processes every row for batch size bigger than table' do
          @qb_big_batch.execute_update(%[update #{@table_name} set value = value * 10], 'public', @table_name)
          fetch(%[select * from #{@table_name} order by cartodb_id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries matching all rows' do
          @qb.execute_update(%[update #{@table_name} set value = value * 10 where cartodb_id % 1 = 0], 'public', @table_name)
          fetch(%[select * from #{@table_name} order by cartodb_id]).should eq [10, 20, 30]
        end

        it 'processes every matching row for queries not matching all rows' do
          @qb.execute_update(%[update #{@table_name} set value = value * 10 where cartodb_id % 2 = 0], 'public', @table_name)
          fetch(%[select * from #{@table_name} order by cartodb_id]).should eq [1, 20, 3]
        end

        it 'does not fail with empty tables' do
          @db.run(%[create table empty_test_table (cartodb_id integer, value integer)])
          @qb.execute_update(%[update empty_test_table set value = value * 10 where cartodb_id % 2 = 0], 'public', 'empty_test_table')
          fetch(%[select * from empty_test_table order by cartodb_id]).should eq []
        ensure
          @db.drop_table 'empty_test_table'
        end
      end
    end

  end
end
