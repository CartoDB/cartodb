require_relative '../../../../spec_helper'
require_relative '../../../../factories/organizations_contexts.rb'
require 'helpers/feature_flag_helper'

describe Carto::Builder::Public::EmbedsController do
  include Warden::Test::Helpers, Carto::Factories::Visualizations, HelperMethods
  include FeatureFlagHelper

  before(:all) do
    bypass_named_maps
    @user = FactoryGirl.create(:valid_user, private_maps_enabled: true)
    @carto_user = Carto::User.find(@user.id)
    @map = FactoryGirl.create(:map, user_id: @user.id)
    @visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3)
    # Only mapcapped visualizations are presented by default
    Carto::Mapcap.create!(visualization_id: @visualization.id)
  end

  before(:each) do
    bypass_named_maps
    Carto::Visualization.any_instance.stubs(:organization?).returns(false)
    Carto::Visualization.any_instance.stubs(:get_auth_tokens).returns(['trusty_token'])
  end

  after(:all) do
    @map.destroy
    @visualization.destroy
    User[@user.id].destroy
    @feature_flag.destroy
  end

  def stub_passwords(password)
    Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
    Carto::Visualization.any_instance.stubs(:password_valid?).returns(false)
    Carto::Visualization.any_instance.stubs(:password_valid?).with(password).returns(true)
  end

  TEST_PASSWORD = 'manolo'.freeze

  describe '#show' do
    it 'does not display public visualizations without mapcaps' do
      unpublished_visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3, privacy: Carto::Visualization::PRIVACY_PUBLIC)
      get builder_visualization_public_embed_url(visualization_id: unpublished_visualization.id)
      response.status.should == 404

      unpublished_visualization.map = nil
      unpublished_visualization.destroy
    end

    it 'does not display link visualizations without mapcaps' do
      unpublished_visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3, privacy: Carto::Visualization::PRIVACY_LINK)
      get builder_visualization_public_embed_url(visualization_id: unpublished_visualization.id)
      response.status.should == 404

      unpublished_visualization.map = nil
      unpublished_visualization.destroy
    end

    it 'does not display visualizations without mapcaps' do
      unpublished_visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3)
      get builder_visualization_public_embed_url(visualization_id: unpublished_visualization.id)
      response.status.should == 404

      unpublished_visualization.map = nil
      unpublished_visualization.destroy
    end

    it 'displays published layers, not ("live") visualization layers' do
      @map, @table, @table_visualization, @visualization = create_full_builder_vis(@carto_user)
      Carto::Mapcap.create!(visualization_id: @visualization.id)

      layer = @visualization.layers[1]
      old_tile_style = layer.options['tile_style']

      new_layer_style = '#layer { marker-width: 7; }'
      layer.options['tile_style'] = new_layer_style
      layer.save

      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should_not include(new_layer_style)
      response.body.should include(old_tile_style)

      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    it 'embeds visualizations' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.include?(@visualization.name).should be true
    end

    describe 'connectivity issues' do
      it 'does not need connection to the user db' do
        @map, @table, @table_visualization, @visualization = create_full_builder_vis(@carto_user)
        Carto::Mapcap.create!(visualization_id: @visualization.id)

        @actual_database_name = @visualization.user.database_name
        @visualization.user.update_attribute(:database_name, 'wadus')

        CartoDB::Logger.expects(:warning).never
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)
        response.status.should == 200

        @visualization.user.update_attribute(:database_name, @actual_database_name)
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end
    end

    it 'redirects to builder for v2 visualizations' do
      Carto::Visualization.any_instance.stubs(:version).returns(2)
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 302
    end

    it 'does not include auth tokens for public/link visualizations' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should include("var authTokens = JSON.parse('[]');")
    end

    it 'does not include google maps if not configured' do
      @map.provider = 'googlemaps'
      @map.save
      @visualization.create_mapcap!
      @user.google_maps_key = ''
      @user.save
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should_not include("maps.googleapis.com/maps/api/js")
    end

    it 'includes the google maps client id if configured' do
      @map.provider = 'googlemaps'
      @map.save
      @visualization.create_mapcap!
      @user.google_maps_key = 'client=wadus_cid'
      @user.save
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should include("maps.googleapis.com/maps/api/js?v=3.30&client=wadus_cid")
    end

    it 'does not includes google maps if the maps does not need it' do
      @map.provider = 'leaflet'
      @map.save
      @visualization.create_mapcap!
      @user.google_maps_key = 'client=wadus_cid'
      @user.save
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should_not include("maps.googleapis.com/maps/api/js")
    end

    it 'includes 3rd party scripts for analytics' do
      Cartodb.with_config(
        trackjs: {
          'customer' => 'fake_trackjs_customer'
        },
        metrics: {
          'hubspot': {
            'enabled' => true,
            'token' => 'fake_hubspot_token'
          }
        },
        google_analytics: {
          'embeds' => 'fake_embed_id',
          'domain' => 'carto-test.com'
        }
      ) do
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.body.should include("www.google-analytics.com/analytics")
        response.body.should include("d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js")
      end
    end

    it 'does not include 3rd party scripts if cookies=0 query param is present' do
      Cartodb.with_config(
        trackjs: {
          'customer' => 'fake_trackjs_customer'
        },
        metrics: {
          'hubspot': {
            'enabled' => true,
            'token' => 'fake_hubspot_token'
          }
        },
        google_analytics: {
          'embeds' => 'fake_embed_id',
          'domain' => 'carto-test.com'
        }
      ) do
        get builder_visualization_public_embed_url(visualization_id: @visualization.id, cookies: '0')

        response.body.should_not include("www.google-analytics.com/analytics")
        response.body.should_not include("d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js")
      end
    end

    it 'does not embed password protected viz' do
      stub_passwords(TEST_PASSWORD)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.body.include?('Protected map').should be true
      response.status.should == 403
    end

    it 'returns 404 for inexistent visualizations' do
      get builder_visualization_public_embed_url(visualization_id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end

    describe 'private visualizations' do
      it 'cannot be embedded' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.body.include?('Embed error | CARTO').should be true
        response.status.should == 404
      end

      it 'can be embedded if logged in' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        login_as(@user)
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.status.should == 200
        response.body.should include @visualization.name
      end

      it 'include auth tokens in embed' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        login_as(@user)
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.status.should == 200
        response.body.should include @visualization.name

        @user.reload
        auth_tokens = @user.get_auth_tokens
        auth_tokens.each { |token| response.body.should include token }
      end
    end

    describe 'in organizations' do
      include_context 'organization with users helper'

      before(:each) do
        @org_map = FactoryGirl.create(:map, user_id: @org_user_owner.id)
        @org_visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_owner, map_id: @org_map.id, version: 3)
        @org_visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @org_visualization.save

        # Only mapcapped visualizations are presented by default
        Carto::Mapcap.create!(visualization_id: @org_visualization.id)

        share_visualization(@org_visualization, @org_user_1)
        Carto::Visualization.any_instance.unstub(:organization?)
        Carto::Visualization.any_instance.stubs(:needed_auth_tokens).returns([])

        @org_map2 = FactoryGirl.create(:map, user_id: @org_user_owner.id)

        @org_protected_visualization = FactoryGirl.create(
          :carto_visualization,
          user: @carto_org_user_owner,
          map_id: @org_map2.id,
          version: 3,
          privacy: Carto::Visualization::PRIVACY_PROTECTED,
          encrypted_password: 'xxx',
          password_salt: 'yyy'
        )
        share_visualization(@org_protected_visualization, @org_user_1)
      end

      it 'does not embed private visualizations' do
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 404
        response.body.should include 'Embed error | CARTO'
      end

      it 'embeds private visualizations if logged in as allowed user' do
        login_as(@org_user_1)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 200
        response.body.should include @org_visualization.name
      end

      it 'embeds protected visualizations if logged in as allowed user with the right password' do
        login_as(@org_user_1)

        stub_passwords(TEST_PASSWORD)

        post builder_visualization_public_embed_protected_url(visualization_id: @org_protected_visualization.id, password: TEST_PASSWORD)

        response.status.should == 200
        response.body.should include @org_protected_visualization.id
      end

      it 'returns 403 for private visualizations if logged in is not an allowed user' do
        login_as(@org_user_2)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 404
        response.body.should include 'Embed error | CARTO'
      end

      it 'includes auth tokens for privately shared visualizations' do
        login_as(@org_user_1)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 200
        @org_user_1.reload
        auth_tokens = @org_user_1.get_auth_tokens
        auth_tokens.count.should eq 2
        auth_tokens.each { |token| response.body.should include token }
      end

      it 'includes the organizations google maps client id if configured' do
        @org_visualization.map.provider = 'googlemaps'
        @org_visualization.map.save
        @org_visualization.create_mapcap!
        @organization.google_maps_key = 'client=wadus_org_cid'
        @organization.save
        login_as(@org_user_1)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 200
        response.body.should include("maps.googleapis.com/maps/api/js?v=3.30&client=wadus_org_cid")
      end
    end
  end

  describe '#show_protected' do
    it 'does not display visualizations without mapcaps' do
      stub_passwords(TEST_PASSWORD)
      unpublished_visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3, privacy: Carto::Visualization::PRIVACY_PROTECTED)
      unpublished_visualization.published?.should be_false


      post builder_visualization_public_embed_protected_url(visualization_id: unpublished_visualization.id, password: TEST_PASSWORD)

      response.body.include?('Invalid password').should be false
      response.status.should == 404

      unpublished_visualization.map = nil
      unpublished_visualization.destroy
    end

    it 'does display published visualizations' do
      stub_passwords(TEST_PASSWORD)
      published_visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map_id: @map.id, version: 3, privacy: Carto::Visualization::PRIVACY_PROTECTED)
      Carto::Mapcap.create!(visualization_id: published_visualization.id)
      published_visualization.published?.should be_true


      post builder_visualization_public_embed_protected_url(visualization_id: published_visualization.id, password: TEST_PASSWORD)

      response.status.should == 200

      published_visualization.map = nil
      published_visualization.destroy
    end

    it 'rejects incorrect passwords' do
      stub_passwords(TEST_PASSWORD)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save


      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: "${TEST_PASSWORD}NO!")

      response.body.include?('Invalid password').should be true
      response.status.should == 403
    end

    it 'accepts correct passwords' do
      stub_passwords(TEST_PASSWORD)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save


      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: TEST_PASSWORD)

      response.body.include?('Invalid password').should_not be true
      response.body.include?(@visualization.name).should be true
      response.status.should == 200
    end

    it 'includes auth tokens' do
      stub_passwords(TEST_PASSWORD)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save


      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: TEST_PASSWORD)

      response.status.should == 200
      @visualization.get_auth_tokens.each { |token| response.body.should include token }
    end
  end
end
