require_relative '../spec_helper'
require_relative 'user_shared_examples'
require 'helpers/user_part_helper'

describe User do
  include UserPartHelper
  include_context 'user spec configuration'

  it "should only allow legal usernames" do
    illegal_usernames = %w(si$mon 'sergio estella' j@vi sergio£££ simon_tokumine SIMON Simon jose.rilla -rilla rilla-)
    legal_usernames   = %w(simon javier-de-la-torre sergio-leiva sergio99)

    illegal_usernames.each do |name|
      @user.username = name
      @user.valid?.should be_false
      @user.errors[:username].should be_present
    end

    legal_usernames.each do |name|
      @user.username = name
      @user.valid?.should be_true
      @user.errors[:username].should be_blank
    end
  end

  it "should not allow a username in use by an organization" do
    org = create_org('testusername', 10.megabytes, 1)
    @user.username = org.name
    @user.valid?.should be_false
    @user.username = 'wadus'
    @user.valid?.should be_true
  end

  describe "email validation" do
    before(:all) do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :mx)
    end

    after(:all) do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)
    end

    it "disallows wrong domains" do
      invalid_emails = ['pimpam@example.com',
                        'pimpam@ageval.dr',
                        'pimpam@qq.ocm',
                        'pimpam@aa.ww',
                        'pimpam@iu.eduy',
                        'pimpam@gmail.como',
                        'pimpam@namr.cim',
                        'pimpam@buffalo.edi']

      invalid_emails.each do |email|
        user = ::User.new(email: email)

        user.valid?.should be_false
        user.errors.should include :email
      end
    end

    it 'disallows a wrong domain if the email changes' do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)
      user = create_user
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :mx)

      user.email = 'email@wrongdomain.fake'
      user.valid?.should be_false
      user.errors.should include :email
    end

    it 'allows wrong domain if the email does not change' do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)
      user = create_user
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :mx)

      user.name = 'new name'
      user.valid?.should be_true
    end
  end

  it "should validate that password is present if record is new and crypted_password is blank" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"

    user.valid?.should be_false
    user.errors[:password].should be_present

    another_user = new_user(user.values.merge(:password => "admin123"))
    user.crypted_password = another_user.crypted_password
    user.valid?.should be_true
    user.save

    # Let's ensure that crypted_password does not change
    user_check = ::User[user.id]
    user_check.crypted_password.should == another_user.crypted_password

    user.password = nil
    user.valid?.should be_true

    user.destroy
  end

  it "should validate password presence and length" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"

    user.valid?.should be_false
    user.errors[:password].should be_present

    user.password = 'short'
    user.valid?.should be_false
    user.errors[:password].should be_present

    user.password = 'manolo' * 11
    user.valid?.should be_false
    user.errors[:password].should be_present
  end

  it "should validate password is different than username" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"
    user.password = user.password_confirmation = "adminipop"

    user.valid?.should be_false
    user.errors[:password].should be_present
  end

  it "should validate password is not a common one" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"
    user.password = user.password_confirmation = '123456'

    user.valid?.should be_false
    user.errors[:password].should be_present
  end

  describe "#change_password" do
    before(:all) do
      @new_valid_password = '000123456'
      @user3 = create_user(password: @user_password)
    end

    after(:all) do
      @user3.destroy
    end

    it "updates crypted_password" do
      initial_crypted_password = @user3.crypted_password
      @user3.change_password(@user_password, @new_valid_password, @new_valid_password)
      @user3.valid?.should eq true
      @user3.save(raise_on_failure: true)
      @user3.crypted_password.should_not eql initial_crypted_password

      @user3.change_password(@new_valid_password, @user_password, @user_password)
      @user3.save(raise_on_failure: true)
    end

    it "checks old password" do
      @user3.change_password('aaabbb', @new_valid_password, @new_valid_password)
      @user3.valid?.should eq false
      @user3.errors.fetch(:old_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, /old_password Old password not valid/)
    end

    it "checks password confirmation" do
      @user3.change_password(@user_password, 'aaabbb', 'bbbaaa')
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password doesn't match confirmation")
    end

    it "can throw several errors" do
      @user3.change_password('aaaaaa', 'aaabbb', 'bbbaaa')
      @user3.valid?.should eq false
      @user3.errors.fetch(:old_password).nil?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expected_errors = "old_password Old password not valid, new_password doesn't match confirmation"
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, expected_errors)
    end

    it "checks minimal length" do
      @user3.change_password(@user_password, 'tiny', 'tiny')
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password must be at least 6 characters long")
    end

    it "checks maximal length" do
      long_password = 'long' * 20
      @user3.change_password(@user_password, long_password, long_password)
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password must be at most 64 characters long")
    end

    it "checks that the new password is not nil" do
      @user3.change_password(@user_password, nil, nil)
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password can't be blank")
    end
  end

  describe '#needs_password_confirmation?' do
    it 'is true for a normal user' do
      user = build(:carto_user, :google_sign_in => nil)
      user.needs_password_confirmation?.should == true

      user = build(:user, :google_sign_in => false)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      user = build(:user, :google_sign_in => true)
      user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      user = build(:user, :google_sign_in => true, :last_password_change_date => Time.now)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that were created with http authentication' do
      user = build(:valid_user, last_password_change_date: nil)
      Carto::UserCreation.stubs(:http_authentication).returns(stub(find_by_user_id: build(:user_creation)))
      user.needs_password_confirmation?.should == false
    end
  end

  describe '#password_expired?' do
    let!(:organization) { create_organization_with_owner }
    let!(:github_user) { build(:valid_user, github_user_id: 932_847) }
    let!(:google_user) { build(:valid_user, google_sign_in: true) }
    let!(:password_user) { build(:valid_user) }
    let!(:organization_user) { create(:valid_user, account_type: 'ORGANIZATION USER', organization: organization) }

    it 'never expires without configuration' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => nil }) do
        expect(github_user.password_expired?).to be_false
        expect(google_user.password_expired?).to be_false
        expect(password_user.password_expired?).to be_false
        expect(organization_user.password_expired?).to be_false
      end
    end

    it 'never expires for users without password' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        Delorean.jump(10.days)
        expect(github_user.password_expired?).to be_false
        expect(google_user.password_expired?).to be_false
        Delorean.back_to_the_present
      end
    end

    it 'expires for users with oauth and changed passwords' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        github_user.last_password_change_date = Time.now - 10.days
        expect(github_user.password_expired?).to be_true
        google_user.last_password_change_date = Time.now - 10.days
        expect(google_user.password_expired?).to be_true
      end
    end

    it 'expires for password users after a while has passed' do
      password_user.save

      Cartodb.with_config(passwords: { 'expiration_in_d' => 15 }) do
        expect(password_user.password_expired?).to be_false
        Delorean.jump(30.days)
        expect(password_user.password_expired?).to be_true
        password_user.password = password_user.password_confirmation = 'waduspass'
        password_user.save
        expect(password_user.password_expired?).to be_false
        Delorean.jump(30.days)
        expect(password_user.password_expired?).to be_true
        Delorean.back_to_the_present
      end
    end

    it 'expires for org users with password_expiration set' do
      organization.update!(password_expiration_in_d: 2)
      org_user2 = create(:valid_user, account_type: 'ORGANIZATION USER', organization: organization)

      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(1.day)
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(5.days)
        expect(org_user2.password_expired?).to be_true
        org_user2.password = org_user2.password_confirmation = 'waduspass'
        org_user2.save
        Delorean.jump(1.day)
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(5.day)
        expect(org_user2.password_expired?).to be_true
        Delorean.back_to_the_present
      end
    end

    it 'never expires for org users with no password_expiration set' do
      organization.stubs(:password_expiration_in_d).returns(nil)
      org_user2 = create(:valid_user, organization: organization)

      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(10.days)
        expect(org_user2.password_expired?).to be_false
        org_user2.password = org_user2.password_confirmation = 'waduspass'
        org_user2.save
        Delorean.jump(10.days)
        expect(org_user2.password_expired?).to be_false
        Delorean.back_to_the_present
      end
    end
  end

  describe "when user is signed up with google sign-in and don't have any password yet" do
    before(:each) do
      @user.google_sign_in = true
      @user.last_password_change_date = nil
      @user.save

      @user.needs_password_confirmation?.should == false

      new_valid_password = '000123456'
      @user.change_password("doesn't matter in this case", new_valid_password, new_valid_password)

      @user.needs_password_confirmation?.should == true
    end

    it 'should allow updating password w/o a current password' do
      @user.valid?.should eq true
      @user.save
    end

    it 'should have updated last password change date' do
      @user.last_password_change_date.should_not eq nil
      @user.save
    end
  end

  describe 'api keys' do
    before(:all) do
      @auth_api_user = create(:valid_user)
    end

    after(:all) do
      @auth_api_user.destroy
    end

    describe 'create api keys on user creation' do
      it "creates master api key on user creation" do
        api_keys = Carto::ApiKey.where(user_id: @auth_api_user.id)
        api_keys.should_not be_empty

        master_api_key = Carto::ApiKey.where(user_id: @auth_api_user.id).master.first
        master_api_key.should be
        master_api_key.token.should eq @auth_api_user.api_key
      end
    end

    it 'syncs api key changes with master api key' do
      master_key = Carto::ApiKey.where(user_id: @auth_api_user.id).master.first
      expect(@auth_api_user.api_key).to eq master_key.token

      expect { @auth_api_user.regenerate_api_key }.to(change { @auth_api_user.api_key })
      master_key.reload
      expect(@auth_api_user.api_key).to eq master_key.token
    end

    describe 'are enabled/disabled' do
      before(:all) do
        @regular_key = @auth_api_user.api_keys.create_regular_key!(name: 'regkey', grants: [{ type: 'apis', apis: [] }])
      end

      after(:all) do
        @regular_key.destroy
      end

      before(:each) do
        @auth_api_user.state = 'active'
        @auth_api_user.engine_enabled = true
        @auth_api_user.save
      end

      def enabled_api_key?(api_key)
        $users_metadata.exists(api_key.send(:redis_key))
      end

      it 'disables all api keys for locked users' do
        @auth_api_user.state = 'locked'
        @auth_api_user.save

        expect(@auth_api_user.api_keys.none? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to_not eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end

      it 'disables regular keys for engine disabled' do
        @auth_api_user.engine_enabled = false
        @auth_api_user.save

        expect(@auth_api_user.api_keys.regular.none? { |k| enabled_api_key?(k) }).to be_true
        expect(@auth_api_user.api_keys.master.all? { |k| enabled_api_key?(k) }).to be_true
        expect(@auth_api_user.api_keys.default_public.all? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end

      it 'enables all keys for active engine users' do
        expect(@auth_api_user.api_keys.all? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end
    end

    describe '#regenerate_all_api_keys' do
      before(:all) do
        @regular_key = @auth_api_user.api_keys.create_regular_key!(name: 'regkey', grants: [{ type: 'apis', apis: [] }])
      end

      after(:all) do
        @regular_key.destroy
      end

      it 'regenerates master key at user model' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @auth_api_user.api_key })
      end

      it 'regenerates master key model' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @auth_api_user.api_keys.master.first.token })
      end

      it 'regenerates regular key' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @regular_key.reload.token })
      end
    end

    describe '#has_feature_flag?' do
      before :all do
        @account_type_org = create_account_type_fg('ORGANIZATION USER')
        @organization = create(:organization)

        @owner = create(:user, account_type: @account_type_org)
        uo = CartoDB::UserOrganization.new(@organization.id, @owner.id)
        uo.promote_user_to_admin
        @organization.reload
        @user_org = build(:user, account_type: 'FREE')
        @user_org.organization = @organization
        @user_org.enabled = true
        @user_org.save

        @user_regu = create(:valid_user)

        @ff_owner = create(:feature_flag, name: 'drop', restricted: true)
        @ff_user = create(:feature_flag, name: 'drop-user', restricted: true)

        @owner.activate_feature_flag!(@ff_owner)
        @user_org.activate_feature_flag!(@ff_user)
        @user_regu.activate_feature_flag!(@ff_user)
      end

      after :all do
        @user_org.destroy!
        @user_regu.destroy!
        @owner.destroy!
        @organization.destroy!
        @account_type_org.destroy!
        @ff_owner.destroy!
        @ff_user.destroy!
      end

      it 'inherits feature flags from owner if inherit_owner_ffs' do
        @organization.update!(inherit_owner_ffs: true)

        @user_org.reload
        @user_org.has_feature_flag?('drop').should eq true
        @user_org.has_feature_flag?('drop-user').should eq true
        @user_org.feature_flags.count.should eq 2
      end

      it 'does not inherit feature flags from owner if not inherit_owner_ffs' do
        @organization.update!(inherit_owner_ffs: false)

        @user_org.reload
        @user_org.has_feature_flag?('drop').should eq false
        @user_org.has_feature_flag?('drop-user').should eq true
        @user_org.feature_flags.count.should eq 1
      end

      it 'does not inherit feature flags for regular users' do
        @organization.update!(inherit_owner_ffs: true)

        @user_regu.reload
        @user_regu.has_feature_flag?('drop').should eq false
        @user_regu.has_feature_flag?('drop-user').should eq true
        @user_regu.feature_flags.count.should eq 1
      end

      it 'does not inherit feature flags for owner' do
        @organization.update!(inherit_owner_ffs: true)

        @owner.reload
        @owner.has_feature_flag?('drop').should eq true
        @owner.has_feature_flag?('drop-user').should eq false
        @owner.feature_flags.count.should eq 1
      end
    end
  end
end
