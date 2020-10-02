require 'spec_helper_min'
require 'rake'

describe 'user' do
  before :all do
    Rake.application.rake_require 'tasks/user_database_host_update'
    Rake::Task.define_task(:environment)
  end

  describe 'cartodb:database_host' do
    describe 'update_dbm_and_redis' do
      it 'should not accept wrong or incomplete input' do
        expect do
          Rake::Task['cartodb:database_host:update_dbm_and_redis'].reenable
          Rake.application.invoke_task 'cartodb:database_host:update_dbm_and_redis'
        end.to raise_error(RuntimeError, 'Origin IP parameter is mandatory')

        expect do
          Rake::Task['cartodb:database_host:update_dbm_and_redis'].reenable
          Rake.application.invoke_task "cartodb:database_host:update_dbm_and_redis['127.0.0.1']"
        end.to raise_error(RuntimeError, 'Destination IP parameter is mandatory')
      end

      it 'should change the database host for the users and also sync the metadata' do
        user = FactoryGirl.create(:valid_user)
        user.database_host = 'localhost'
        user.save

        user2 = FactoryGirl.create(:valid_user)
        user2.database_host = '127.0.0.1'
        user2.save

        Rake::Task['cartodb:database_host:update_dbm_and_redis'].reenable
        Rake.application.invoke_task 'cartodb:database_host:update_dbm_and_redis[localhost,127.0.0.1]'

        user.reload.database_host.should eql '127.0.0.1'
        user2.reload.database_host.should eql '127.0.0.1'

        metadata_user = $users_metadata.hgetall("rails:users:#{user.username}")
        metadata_user['database_host'].should eql '127.0.0.1'
        metadata_user2 = $users_metadata.hgetall("rails:users:#{user2.username}")
        metadata_user2['database_host'].should eql '127.0.0.1'

        user.destroy
        user2.destroy
      end
    end
  end
end
