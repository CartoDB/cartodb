require 'spec_helper_min'
require 'rake'

describe 'passwords tasks' do
  before :all do
    Rake.application.rake_require "tasks/passwords"
    Rake::Task.define_task(:environment)
  end

  describe 'passwords:join_password_salt' do
    def run_join_password_salt_task
      Rake::Task["passwords:join_password_salt"].reenable
      Rake.application.invoke_task "passwords:join_password_salt"
    end

    it "migrates sha1 passwords with salt" do
      user = FactoryGirl.create(:valid_user)
      user.crypted_password = "patatin"
      user.salt = "himalayan"
      user.save

      run_join_password_salt_task

      user.reload.crypted_password.should eql "$sha$v=1$$himalayan$patatin"
      user.salt.should eql ""

      user.destroy
    end

    it "ignores users with empty salt" do
      user = FactoryGirl.create(:valid_user)
      user.crypted_password = "$sha$v=1$$himalayan$patatin"
      user.salt = ""
      user.save

      run_join_password_salt_task

      user.reload.crypted_password.should eql "$sha$v=1$$himalayan$patatin"
      user.salt.should eql ""

      user.destroy
    end
  end
end
