# encoding: utf-8

require 'carto/db/sql_interface'
require_relative '../../../spec_helper'

module Carto
  module Db
    describe SqlInterface do
      shared_examples 'run examples' do
        it 'should work with run' do
          db = Carto::Db::SqlInterface.new(@connection)
          result = db.run("SELECT version()")
          result.should be nil
        end

        it 'should raise an exception with run' do
          expect {
            db = Carto::Db::SqlInterface.new(@connection)
            db.run("SELECT this_function_does_not_exist()")
          }.to raise_error(Carto::Db::SqlInterface::Error,
                           /ERROR:  function this_function_does_not_exist\(\) does not exist/)
        end
      end

      shared_examples 'fetch examples' do
        it 'should work with fetch/block' do
          db = Carto::Db::SqlInterface.new(@connection)
          db.fetch("SELECT version()") do |result|
            result[:version].should match /PostgreSQL/
          end
        end

        it 'should work with fetch/noblock' do
          db = Carto::Db::SqlInterface.new(@connection)
          result = db.fetch("SELECT version()")
          result.length.should be 1
          result[0][:version].should match /PostgreSQL/
        end

        it 'should raise an exception with fetch/block' do
          db = Carto::Db::SqlInterface.new(@connection)
          expect {
            db.fetch("SELECT this_function_does_not_exist()") do
              nil
            end
          }.to raise_error(Carto::Db::SqlInterface::Error,
                           /ERROR:  function this_function_does_not_exist\(\) does not exist/)
        end

        it 'should raise an exception with fetch/noblock' do
          db = Carto::Db::SqlInterface.new(@connection)
          expect {
            db.fetch("SELECT this_function_does_not_exist()")
          }.to raise_error(Carto::Db::SqlInterface::Error,
                           /ERROR:  function this_function_does_not_exist\(\) does not exist/)
        end
      end

      context 'with sequel connection' do
        before do
          options = ::SequelRails.configuration.environment_for(Rails.env)
          @connection = ::Sequel.connect(options)
        end

        after do
          @connection.disconnect
        end

        include_examples 'run examples'
        include_examples 'fetch examples'
      end

      context 'with active record connection' do
        before do
          @connection = ::ActiveRecord::Base.connection
        end

        include_examples 'run examples'
        include_examples 'fetch examples'
      end
    end
  end
end
