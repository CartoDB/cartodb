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

  it "should have a default dashboard_viewed? false" do
    user = ::User.new
    user.dashboard_viewed?.should be_false
  end

  it "should reset dashboard_viewed when dashboard gets viewed" do
    user = ::User.new
    user.view_dashboard
    user.dashboard_viewed?.should be_true
  end

  describe "avatar checks" do
    let(:user1) do
      User.where(username: 'u1').first&.destroy
      create_user(email: 'ewdewfref34r43r43d32f45g5@example.com', username: 'u1', password: 'foobar')
    end

    after(:each) do
      user1.destroy
    end

    it "should load a cartodb avatar url if no gravatar associated" do
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 404))
      user1.stubs(:gravatar_enabled?).returns(true)
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      kind_regex = "(#{Cartodb.config[:avatars]['kinds'].join('|')})"
      color_regex = "(#{Cartodb.config[:avatars]['colors'].join('|')})"
      expected_url = /#{Cartodb.config[:avatars]['base_url']}\/avatar_#{kind_regex}_#{color_regex}\.png/

      expect(user1.avatar_url).to match(expected_url)
    end

    it "should load a cartodb avatar url if gravatar disabled" do
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.stubs(:gravatar_enabled?).returns(false)
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      kind_regex = "(#{Cartodb.config[:avatars]['kinds'].join('|')})"
      color_regex = "(#{Cartodb.config[:avatars]['colors'].join('|')})"
      expected_url = /#{Cartodb.config[:avatars]['base_url']}\/avatar_#{kind_regex}_#{color_regex}\.png/

      expect(user1.avatar_url).to match(expected_url)
    end

    it "should load a the user gravatar url" do
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.stubs(:gravatar_enabled?).returns(true)
      user1.reload_avatar
      user1.avatar_url.should == "//#{user1.gravatar_user_url}"
    end

    describe '#gravatar_enabled?' do
      it 'should be enabled by default (every setting but false will enable it)' do
        user = ::User.new
        Cartodb.with_config(avatars: {}) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => true }) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'true' }) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'wadus' }) { user.gravatar_enabled?.should be_true }
      end

      it 'can be disabled' do
        user = ::User.new
        Cartodb.with_config(avatars: { 'gravatar_enabled' => false }) { user.gravatar_enabled?.should be_false }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'false' }) { user.gravatar_enabled?.should be_false }
      end
    end
  end

  describe '#private_maps_enabled?' do
    it 'should not have private maps enabled by default' do
      user_missing_private_maps = create_user email: 'user_mpm@example.com',
                                              username: 'usermpm',
                                              password: '000usermpm'
      user_missing_private_maps.private_maps_enabled?.should eq false
      user_missing_private_maps.destroy
    end

    it 'should have private maps if enabled' do
      user_with_private_maps = create_user email: 'user_wpm@example.com',
                                           username: 'userwpm',
                                           password: '000userwpm',
                                           private_maps_enabled: true
      user_with_private_maps.private_maps_enabled?.should eq true
      user_with_private_maps.destroy
    end

    it 'should not have private maps if disabled' do
      user_without_private_maps = create_user email: 'user_opm@example.com',
                                              username: 'useropm',
                                              password: '000useropm',
                                              private_maps_enabled: false
      user_without_private_maps.private_maps_enabled?.should eq false
      user_without_private_maps.destroy
    end
  end

  describe "#purge_redis_vizjson_cache" do
    it "shall iterate on the user's visualizations and purge their redis cache" do
      # Create a few tables with their default vizs
      (1..3).each do |i|
        t = Table.new
        t.user_id = @user.id
        t.save
      end

      collection = CartoDB::Visualization::Collection.new.fetch({user_id: @user.id})
      redis_spy = RedisDoubles::RedisSpy.new
      redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new()
      redis_embed_cache = EmbedRedisCache.new()
      CartoDB::Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_spy)
      EmbedRedisCache.any_instance.stubs(:redis).returns(redis_spy)


      redis_vizjson_keys = collection.map { |v|
        [
          redis_vizjson_cache.key(v.id, false), redis_vizjson_cache.key(v.id, true),
          redis_vizjson_cache.key(v.id, false, 3), redis_vizjson_cache.key(v.id, true, 3),
          redis_vizjson_cache.key(v.id, false, '3n'), redis_vizjson_cache.key(v.id, true, '3n'),
          redis_vizjson_cache.key(v.id, false, '3a'), redis_vizjson_cache.key(v.id, true, '3a'),
        ]
      }.flatten
      redis_vizjson_keys.should_not be_empty

      redis_embed_keys = collection.map { |v|
        [redis_embed_cache.key(v.id, false), redis_embed_cache.key(v.id, true)]
      }.flatten
      redis_embed_keys.should_not be_empty

      @user.purge_redis_vizjson_cache

      redis_spy.deleted.should include(*redis_vizjson_keys)
      redis_spy.deleted.should include(*redis_embed_keys)
      redis_spy.deleted.count.should eq redis_vizjson_keys.count + redis_embed_keys.count
      redis_spy.invokes(:del).count.should eq 2
      redis_spy.invokes(:del).map(&:sort).should include(redis_vizjson_keys.sort)
      redis_spy.invokes(:del).map(&:sort).should include(redis_embed_keys.sort)
    end

    it "shall not fail if the user does not have visualizations" do
      user = create_user
      collection = CartoDB::Visualization::Collection.new.fetch({user_id: user.id})
      # 'http' keys
      redis_keys = collection.map(&:redis_vizjson_key)
      redis_keys.should be_empty
      # 'https' keys
      redis_keys = collection.map { |item| item.redis_vizjson_key(true) }
      redis_keys.should be_empty

      CartoDB::Visualization::Member.expects(:redis_cache).never

      user.purge_redis_vizjson_cache

      user.destroy
    end
  end

  describe '#visualization_count' do
    include_context 'organization with users helper'

    it 'filters by type if asked' do
      vis = create(:carto_visualization, user_id: @org_user_1.id, type: Carto::Visualization::TYPE_DERIVED)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(type: Carto::Visualization::TYPE_DERIVED).should eq 1
      [Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_REMOTE].each do |type|
        @org_user_1.visualization_count(type: type).should eq 0
      end

      vis.destroy
    end

    it 'filters by privacy if asked' do
      vis = create(:carto_visualization,
                               user_id: @org_user_1.id,
                               privacy: Carto::Visualization::PRIVACY_PUBLIC)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(privacy: Carto::Visualization::PRIVACY_PUBLIC).should eq 1
      [
        Carto::Visualization::PRIVACY_PRIVATE,
        Carto::Visualization::PRIVACY_LINK,
        Carto::Visualization::PRIVACY_PROTECTED
      ].each do |privacy|
        @org_user_1.visualization_count(privacy: privacy).should eq 0
      end

      vis.destroy
    end

    it 'filters by shared exclusion if asked' do
      vis = create(:carto_visualization, user_id: @org_user_1.id, type: Carto::Visualization::TYPE_DERIVED)
      share_visualization_with_user(vis, @org_user_2)

      @org_user_2.visualization_count.should eq 1
      @org_user_2.visualization_count(exclude_shared: true).should eq 0

      vis.destroy
    end

    it 'filters by raster exclusion if asked' do
      vis = create(:carto_visualization, user_id: @org_user_1.id, kind: Carto::Visualization::KIND_RASTER)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(exclude_raster: true).should eq 0

      vis.destroy
    end
  end

  describe 'viewer user' do
    def verify_viewer_quota(user)
      user.quota_in_bytes.should eq 0
      user.geocoding_quota.should eq 0
      user.soft_geocoding_limit.should eq false
      user.twitter_datasource_quota.should eq 0
      user.soft_twitter_datasource_limit.should eq false
      user.here_isolines_quota.should eq 0
      user.soft_here_isolines_limit.should eq false
    end

    describe 'creation' do
      it 'assigns 0 as quota and no soft limit no matter what is requested' do
        @user = create_user email: 'u_v@whatever.com', username: 'viewer', password: 'user11', viewer: true,
                            geocoding_quota: 10, soft_geocoding_limit: true, twitter_datasource_quota: 100,
                            soft_twitter_datasource_limit: 10, here_isolines_quota: 10, soft_here_isolines_limit: true
        verify_viewer_quota(@user)
        @user.destroy
      end
    end

    describe 'builder -> viewer' do
      it 'assigns 0 as quota and no soft limit no matter what is requested' do
        @user = create_user email: 'u_v@whatever.com', username: 'builder-to-viewer', password: 'user11', viewer: false,
                            geocoding_quota: 10, soft_geocoding_limit: true, twitter_datasource_quota: 100,
                            soft_twitter_datasource_limit: 10, here_isolines_quota: 10, soft_here_isolines_limit: true
        # Random check, but we can trust create_user
        @user.quota_in_bytes.should_not eq 0

        @user.viewer = true
        @user.save
        @user.reload
        verify_viewer_quota(@user)
        @user.destroy
      end
    end

    describe 'quotas' do
      it "can't change for viewer users" do
        @user = create_user(viewer: true)
        verify_viewer_quota(@user)
        @user.quota_in_bytes = 666
        @user.save
        @user.reload
        verify_viewer_quota(@user)
        @user.destroy
      end
    end
  end

  describe 'session' do
    before { Cartodb::Central.stubs(:login_redirection_enabled?).returns(true) }

    before(:all) do
      @user = create(:valid_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'salt should be generated at creation' do
      @user.session_salt.should_not be_nil
    end

    it 'security token should include salt' do
      sec_token = Carto::Common::EncryptionService.encrypt(sha_class: Digest::SHA256, password: @user.crypted_password,
                                                           salt: @user.session_salt)
      @user.security_token.should == sec_token
    end

    describe '#invalidate_all_sessions!' do
      before(:each) do
        Cartodb::Central.any_instance.stubs(:send_request)
      end

      after(:each) do
        Cartodb::Central.any_instance.unstub(:send_request)
      end

      context 'when everything succeeds' do
        it 'updates the session_salt' do
          initial_session_salt = @user.session_salt

          @user.invalidate_all_sessions!

          initial_session_salt.should_not == @user.reload.session_salt
        end

        it 'updates the user in Central' do
          Cartodb::Central.any_instance.expects(:send_request).once

          @user.invalidate_all_sessions!
        end
      end

      context 'when syncing to Central fails' do
        context 'due to a newtork error' do
          before do
            User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure, 'Error')
          end

          it 'logs an error' do
            Rails.logger.expects(:error).once

            @user.invalidate_all_sessions!
          end
        end

        context 'due to anything else' do
          before do
            User.any_instance.stubs(:update_in_central).returns(false)
          end

          it 'logs an error' do
            Rails.logger.expects(:error).once

            @user.invalidate_all_sessions!
          end
        end
      end

      context 'when saving in local fails' do
        let(:user) { create(:valid_user) }

        include_context 'with MessageBroker stubs'

        it 'logs an error' do
          user.email = nil
          Rails.logger.expects(:error).at_least_once

          user.invalidate_all_sessions!
        end
      end
    end
  end

  describe '#assign_geocodings_to_organization_owner' do
    let(:organization) { create_organization_with_users }
    let(:organization_owner) { organization.owner }
    let(:user) { organization.users.where.not(id: organization_owner.id).first }

    before { create(:carto_geocoding, user: user) }

    it 'assigns geocodings to organization owner' do
      expect(organization_owner.geocodings.count).to eq(0)

      user.sequel_user.send(:assign_geocodings_to_organization_owner)

      expect(organization_owner.geocodings.count).to eq(1)
    end

    context 'when user does not belong to organization' do
      let(:user) { create(:valid_user).carto_user }

      it 'does nothing' do
        user.sequel_user.send(:assign_geocodings_to_organization_owner)
      end
    end
  end
end
