# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/synchronizer/collection'
require_relative '../../lib/synchronizer/migrator'
require_relative '../factories/pg_connection'
require_relative '../../../data-repository/backend/sequel'


include CartoDB::Synchronizer

describe Collection do
  before do
    @stop       = lambda { |result| EventMachine.stop }
    db          = Factories::PGConnection.new
    @connection = db.connection
    @options    = db.pg_options
  end

  describe '#fetch' do
    it 'fetchs all pending jobs from the synctables relation' do
      repository  = 
        DataRepository::Backend::Sequel.new(@connection, :synctables)

      ensure_table_created_in(@connection)

      id = rand(999).to_s
      repository.store(id, synctable)

      collection = Collection.new(@options)
      EventMachine.run { collection.fetch(@stop, @stop) }

      collection.members.to_a.length.must_equal 1
      collection.members.first.must_be_instance_of Member
    end
  end

  describe '#process' do
    it 'tells all members to run' do
      member      = Minitest::Mock.new
      collection  = Collection.new(@options)

      member.expect(:run, self)
      collection.process([member])

      member.verify
    end
  end

  def synctable
    {
      id:         'foo',
      source:     'foo',
      user_id:    1,
      interval:   3600,
      run_at:     Time.now.utc,
      created_at: Time.now.utc,
      updated_at: Time.now.utc
    }
  end

  def fake_member
    member = Object.new
    def member.run; self; end
    member
  end


  def ensure_table_created_in(connection)
    Migrator.new(connection).drop
    Migrator.new(connection).migrate
  end
end
