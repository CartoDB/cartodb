gem 'minitest'
require 'minitest/autorun'
require 'spec_helper_min'
require_relative '../../lib/synchronizer/collection'
require_relative '../factories/pg_connection'
require_relative '../../../data-repository/backend/sequel'


include CartoDB::Synchronizer

describe Collection do
  before do
    @stop       = lambda { |result| EventMachine.stop }
    @run_call   = lambda { |records| records.process; EventMachine.stop }
    db          = Factories::PGConnection.new
    @connection = db.connection
    @options    = db.pg_options
  end

  describe '#fetch' do
    it 'fetchs all pending jobs from the synchronizations relation' do
      repository  =
        DataRepository::Backend::Sequel.new(@connection, :synchronizations)

      ensure_table_created_in(@connection)

      id = repository.next_id.to_s
      repository.store(id, synchronization(id))

      collection = Collection.new(@options)
      EventMachine.run { collection.fetch(@run_call, @stop) }

      collection.members.to_a.length.must_equal ensure_table_created_in
      collection.members.first.must_be_instance_of CartoDB::Synchronization::Member
    end
  end

  describe '#process' do
    it 'tells all members to run' do
      member      = Minitest::Mock.new
      collection  = Collection.new(@options)

      member.expect(:enqueue, self)
      collection.process([member])

      member.verify
    end
  end

  def synchronization(id)
    {
      id:         id,
      url:        'foo',
      user_id:    1,
      interval:   3600,
      run_at:     Time.now.utc - 2,
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
  end
end
