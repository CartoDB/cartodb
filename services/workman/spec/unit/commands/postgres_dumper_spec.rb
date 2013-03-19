# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../commands/postgres_dumper'

include Workman::Commands

describe PostgresDumper do
  before do
    AWS.config(
      access_key_id:      nil,
      secret_access_key:  nil
    )
  end

  describe '#initialize' do
    it 'requires a database name' do
      lambda { PostgresDumper.new }.must_raise ArgumentError
      PostgresDumper.new('bogus_db').must_be_instance_of PostgresDumper
    end
  end #initialize

  describe '#dump' do
    it 'creates a dump for the database' do
      database_name = create_fake_database
      dumper        = PostgresDumper.new(database_name)
      dumper.dump

      File.exists?(dumper.dump_filepath).must_equal true
    end
  end #dump

  describe '#upload_to' do
    it 'makes the dump available for download' do
      database_name = create_fake_database
      dumper        = PostgresDumper.new(database_name)

      uploaded_filepath = dumper.dump.upload_to('local')

      File.exists?(uploaded_filepath).must_equal true
    end

    it 'makes the dump available for download' do
      database_name = create_fake_database
      dumper        = PostgresDumper.new(database_name)

      dump_url = dumper.dump.upload_to('s3')
      dump_url.must_match /s3.amazonaws.com.*#{database_name}.*dump/
    end
  end #upload_to

  def create_fake_database
    random_name = "bar_#{Time.now.to_f}"
    `createdb -T template0 #{random_name}`
    random_name
  end #create_fake_database
end # Commands::PostgresDumper

