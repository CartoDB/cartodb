require 'spec_helper_unit'

describe 'user' do
  before do
    Rake.application.rake_require "tasks/user"
    Rake::Task.define_task(:environment)
  end

  describe 'notifications:add_by_field' do
    it "should not accept wrong or incomplete input" do
      expect {
        Rake::Task["user:notifications:add_by_field"].reenable
        Rake.application.invoke_task "user:notifications:add_by_field"
      }.to raise_error(RuntimeError, "Filter field and value are needed")

      expect {
        Rake::Task["user:notifications:add_by_field"].reenable
        Rake.application.invoke_task "user:notifications:add_by_field[database_host]"
      }.to raise_error(RuntimeError, "Filter field and value are needed")

      expect {
        Rake::Task["user:notifications:add_by_field"].reenable
        Rake.application.invoke_task "user:notifications:add_by_field[database_host,localhost]"
      }.to raise_error(RuntimeError, "Notification not provided. Please include it")

      expect {
        Rake::Task["user:notifications:add_by_field"].reenable
        Rake.application.invoke_task "user:notifications:add_by_field[unknown_field,localhost,test notification!]"
      }.to raise_error(RuntimeError, "Unknown field unknown_field for filtering. Allowed fields are database_host")
    end

    it "should change the notification field for the users with localhost database" do
      user = create(:valid_user)
      user.database_host = "localhost"
      user.save

      user2 = create(:valid_user)
      user2.database_host = "127.0.0.1"
      user2.save

      Rake::Task["user:notifications:add_by_field"].reenable
      Rake.application.invoke_task "user:notifications:add_by_field[database_host,localhost,test notification!]"

      user.reload.notification.should eql 'test notification!'
      user2.reload.notification.should be_nil

      user.destroy
      user2.destroy
    end
  end

  describe 'notifications:clean_by_field' do
    it "should not accept wrong or incomplete input" do
      expect {
        Rake::Task["user:notifications:clean_by_field"].reenable
        Rake.application.invoke_task "user:notifications:clean_by_field"
      }.to raise_error(RuntimeError, "Filter field and value are needed")

      expect {
        Rake::Task["user:notifications:clean_by_field"].reenable
        Rake.application.invoke_task "user:notifications:clean_by_field[database_host]"
      }.to raise_error(RuntimeError, "Filter field and value are needed")

      expect {
        Rake::Task["user:notifications:clean_by_field"].reenable
        Rake.application.invoke_task "user:notifications:clean_by_field[unknown_field,localhost]"
      }.to raise_error(RuntimeError, "Unknown field unknown_field for filtering. Allowed fields are database_host")
    end

    it "should clean the notification field for the users with localhost database" do
      user = create(:valid_user)
      user.database_host = "localhost"
      user.notification = 'test notification!'
      user.save

      user2 = create(:valid_user)
      user2.database_host = "127.0.0.1"
      user2.notification = 'test notification!'
      user2.save

      Rake::Task["user:notifications:clean_by_field"].reenable
      Rake.application.invoke_task "user:notifications:clean_by_field[database_host,localhost]"

      user.reload.notification.should be_nil
      user2.reload.notification.should eql 'test notification!'

      user.destroy
      user2.destroy
    end
  end
end
