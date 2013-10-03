# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../app/connectors/sync_table' 
require_relative '../../services/importer/spec/factories/pg_connection'

include CartoDB

describe Connector::SyncTable do

  describe '#register' do
    before do
      @database = Importer2::Factories::PGConnection.new.connection
    end

    it 'does nothing unless remote data changed' do
      connector = Connector::SyncTable.new(
        'sync_table',
        fake_runner(remote_data_updated: false),
        fake_table_registrar,
        fake_quota_checker,
        @database,
      )
      connector.register('sync_table', Object.new)
    end

    it 'does nothing if table already exists' do
      connector = Connector::SyncTable.new(
        'sync_table',
        fake_runner,
        fake_table_registrar(table_exists: true),
        fake_quota_checker,
        @database,
      )
      connector.register('sync_table', Object.new)
    end

    it 'moves the new table from cdb_importer schema to public' do
      connector = Connector::SyncTable.new(
        'sync_table',
        fake_runner,
        fake_table_registrar,
        fake_quota_checker,
        @database,
      )
      #connector.register('sync_table', Object.new)
    end

    it 'creates metadata for the new table' do
      connector = Connector::SyncTable.new(
        'sync_table',
        fake_runner,
        fake_table_registrar,
        fake_quota_checker,
        @database
      )
      #connector.register('sync_table', Object.new)
    end
  end #register

  describe '#overwrite' do
    it 'does nothing unless remote data changed' do
    end

    it 'overwrites the existing target table with the most recent data' do
    end
  end #overwrite

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "services/importer/fixtures/#{filepath}")
    )
  end #path_to

  def fake_runner(options={})
    runner = Class.new 
    runner.send :define_method, :run, lambda     { runner }
    runner.send :define_method, :results, lambda { 
      options.fetch(:results, [])
    }
    runner.send :define_method, :remote_data_updated?, lambda { 
      options.fetch(:remote_data_updated, true)
    }
    runner.new
  end

  def fake_table_registrar(options={})
    registrar = Class.new
    registrar.send :define_method, :exists?, lambda { |table_name|
      options.fetch(:table_exists, false)
    }
    registrar.new
  end

  def fake_quota_checker
    Class.new { 
      def over_table_quota?(results); false; end
    }.new
  end
end # Connector::Synctable

