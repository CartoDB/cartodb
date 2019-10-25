require 'spec_helper_min'
require 'factories/carto_visualizations'
require 'helpers/rate_limits_helper'
require 'helpers/account_types_helper'

describe Carto::UserMetadataExportService do
  include NamedMapsHelper
  include RateLimitsHelper
  include AccountTypesHelper
  include Carto::Factories::Visualizations

  before(:all) do
    bypass_named_maps
    @feature_flag = FactoryGirl.create(:carto_feature_flag)
    @connector_provider = FactoryGirl.create(:connector_provider)
    user = FactoryGirl.create(:carto_user)
    @oauth_app = FactoryGirl.create(:oauth_app, user: user)
  end

  after(:all) do
    @feature_flag.destroy
    @connector_provider.destroy
  end

  before(:each) do
    Cartodb::Central.any_instance.stubs(:update_user).returns(true)
  end

  def create_user_with_basemaps_assets_visualizations
    create_account_type_fg('FREE')
    @user = FactoryGirl.create(:carto_user)
    @user.static_notifications = Carto::UserNotification.new(notifications: full_export[:user][:notifications])
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)

    @tiled_layer = FactoryGirl.create(:carto_tiled_layer)
    @user.layers << @tiled_layer

    @asset = FactoryGirl.create(:carto_asset, user: @user)

    Carto::FeatureFlagsUser.create(feature_flag: @feature_flag, user: @user)

    CartoDB::GeocoderUsageMetrics.new(@user.username).incr(:geocoder_here, :success_responses)

    @user.synchronization_oauths.create!(service: 'gdrive', token: 'wadus')
    FactoryGirl.create(:connector_configuration, connector_provider: @connector_provider, user: @user)

    # Convert @table_visualization into a common data imported table
    sync = FactoryGirl.create(:carto_synchronization, user: @user)
    @table_visualization.update_attributes!(synchronization: sync)
    @table.data_import = FactoryGirl.create(:data_import, user: @user, synchronization_id: sync.id, table_id: @table.id)
    @table.save!
    edi = FactoryGirl.create(:external_data_import_with_external_source,
                             data_import: @table.data_import, synchronization: sync)
    @remote_visualization = edi.external_source.visualization
    @remote_visualization.update_attributes!(user: @user)

    # Create SearchTweets: one associated to an existing table, and one with invalid table
    @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(
      @user, visualization_attributes: { name: 'waduswadus22' }
    )
    @table2.data_import = FactoryGirl.create(:data_import, user: @user, table_id: @table2.id)
    @table2.save!
    @st1 = FactoryGirl.create(:carto_search_tweet, user_id: @user.id, data_import_id: @table2.data_import.id)
    @st2 = FactoryGirl.create(
      :carto_search_tweet, user_id: @user.id, data_import_id: FactoryGirl.create(:data_import).id
    )

    # Rate limits
    sequel_user = ::User[@user.id]
    sequel_user.rate_limit_id = FactoryGirl.create(:rate_limits).id
    sequel_user.save
    @user.reload

    # Client Application tokens
    sequel_user.client_application.access_tokens << ::AccessToken.new(
      token: "access_token",
      secret: "access_secret",
      callback_url: "http://callback2",
      verifier: "v2",
      scope: nil,
      client_application_id: sequel_user.client_application.id
    ).save
    sequel_user.client_application.oauth_tokens << ::OauthToken.new(
      token: "oauth_token",
      secret: "oauth_secret",
      callback_url: "http//callback.com",
      verifier: "v1",
      scope: nil,
      client_application_id: sequel_user.client_application.id
    ).save

    Carto::UserMultifactorAuth.create!(user_id: @user.id, type: 'totp', last_login: Time.zone.now)

    oauth_app_user = FactoryGirl.create(:oauth_app_users, oauth_app: @oauth_app, user: @user)
    FactoryGirl.create(:oauth_authorization_codes, oauth_app_user: oauth_app_user)
    api_key = FactoryGirl.create(:oauth_api_key, user: @user)
    FactoryGirl.create(:oauth_access_tokens, oauth_app_user: oauth_app_user, api_key: api_key)
    FactoryGirl.create(:oauth_refresh_tokens, oauth_app_user: oauth_app_user, scopes: ['offline'])

    @user.reload
  end

  def destroy_user(user = @user)
    user.update_attributes!(viewer: false) unless user.destroyed?

    gum = CartoDB::GeocoderUsageMetrics.new(user.username)
    $users_metadata.DEL(gum.send(:user_key_prefix, :geocoder_here, :success_responses, Time.zone.now))

    user.oauth_app_users.each do |oau|
      oau.skip_role_setup = true
      oau.oauth_access_tokens.each { |oat| oat.api_key.skip_role_setup = true }
    end

    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    destroy_full_visualization(@map2, @table2, @table_visualization2, @visualization2)
    @remote_visualization.destroy
    @table.data_import.destroy
    @tiled_layer.destroy
    @asset.destroy
    [@st1, @st2].each do |st|
      st.data_import.destroy
      st.destroy
    end
    user.destroy
    ::User[user.id].before_destroy(skip_table_drop: true)
  end

  let(:service) { Carto::UserMetadataExportService.new }

  describe '#export' do
    before(:all) do
      Cartodb::Central.any_instance.stubs(:update_user).returns(true)
      create_user_with_basemaps_assets_visualizations
    end

    after(:all) do
      destroy_user
    end

    it 'exports' do
      export = service.export_user_json_hash(@user)

      expect_export_matches_user(export[:user], @user)
    end

    it 'includes all user model attributes' do
      expected_attrs = @user.attributes.symbolize_keys.keys - [:rate_limit_id] + [:rate_limit]

      export = service.export_user_json_hash(@user)

      expect(export[:user].keys).to include(*expected_attrs)
    end
  end

  describe '#user import' do
    after :each do
      if @search_tweets
        @search_tweets.each do |st|
          st.data_import.try(:destroy)
          st.destroy
        end
      end
      ClientApplication.where(user_id: @user.id).each(&:destroy)

      @user.oauth_app_users.each do |oau|
        unless oau.oauth_access_tokens.blank?
          oau.oauth_access_tokens.each do |oat|
            oat.api_key.skip_role_setup = true
            oat.api_key.skip_cdb_conf_info = true
          end
        end
      end

      @user.destroy if @user
    end

    def test_import_user_from_export(export)
      @user = service.build_user_from_hash_export(export)
      create_account_type_fg('FREE')
      service.save_imported_user(@user)
      @search_tweets = service.build_search_tweets_from_hash_export(export)
      @search_tweets.each { |st| service.save_imported_search_tweet(st, @user) }

      expect_export_matches_user(export[:user], @user)
      @user
    end

    it 'imports latest' do
      test_import_user_from_export(full_export)
    end

    it 'imports 1.0.12 (without company_employees and use_case)' do
      user = test_import_user_from_export(full_export_one_zero_twelve)

      expect(user.company_employees).to be_nil
      expect(user.use_case).to be_nil
    end

    it 'imports 1.0.11 (without maintenance_mode)' do
      user = test_import_user_from_export(full_export_one_zero_eleven)

      expect(user.maintenance_mode).to eq false
    end

    it 'imports 1.0.10 (without regular_api_key_quota)' do
      user = test_import_user_from_export(full_export_one_zero_ten)

      expect(user.regular_api_key_quota).to be_nil
    end

    it 'imports 1.0.9 (without public_map_quota)' do
      user = test_import_user_from_export(full_export_one_zero_nine)

      expect(user.public_map_quota).to be_nil
    end

    it 'imports 1.0.8 (without oauth_apps and oauth_app_users)' do
      user = test_import_user_from_export(full_export_one_zero_eight)

      expect(user.oauth_apps).to be_empty
      expect(user.oauth_app_users).to be_empty
    end

    it 'imports 1.0.7 (without user_multifactor_auths)' do
      user = test_import_user_from_export(full_export_one_zero_seven)

      expect(user.user_multifactor_auths).to be_empty
    end

    it 'imports 1.0.6 (without password_reset_token and password_reset_sent_at)' do
      user = test_import_user_from_export(full_export_one_zero_six)

      expect(user.password_reset_token).to be_nil
      expect(user.password_reset_sent_at).to be_nil
    end

    it 'imports 1.0.5 (without client_application)' do
      user = test_import_user_from_export(full_export_one_zero_five)

      expect(user.client_applications).to be_empty
    end

    it 'imports 1.0.4 (without synchornization oauths nor connector configurations)' do
      user = test_import_user_from_export(full_export_one_zero_four)

      expect(user.synchronization_oauths).to be_empty
      expect(user.connector_configurations).to be_empty
    end

    it 'imports 1.0.3 (without company nor phone)' do
      user = test_import_user_from_export(full_export_one_zero_three)

      expect(user.company).to be_nil
      expect(user.phone).to be_nil
    end

    it 'imports 1.0.2 (without rate limits)' do
      user = test_import_user_from_export(full_export_one_zero_two)

      expect(user.rate_limit).to be_nil
    end

    it 'imports 1.0.1 (without static notifications)' do
      user = test_import_user_from_export(full_export_one_zero_one)

      expect(user.static_notifications.notifications).to be_empty
    end

    it 'imports 1.0.0 (without search tweets)' do
      user = test_import_user_from_export(full_export_one_zero_zero)

      expect(user.search_tweets).to be_empty
    end
  end

  describe '#user export + import' do
    after :each do
      destroy_user
    end

    it 'export + import latest' do
      create_user_with_basemaps_assets_visualizations
      export_import(@user)
    end
  end

  describe '#full export + import (user and visualizations)' do
    after :each do
      destroy_user(@imported_user)
    end

    it 'export + import user with rate limit and visualizations' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        full_export_import(path)

        expect_rate_limits_saved_to_redis(@user.username)
      end
    end

    it 'export + import user and visualizations for a viewer user' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        full_export_import_viewer(path)

        expect_rate_limits_saved_to_redis(@user.username)
      end
    end

    it 'skips a canonical visualization without a user table' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        # Set up fake visualizations
        source_visualizations = @user.visualizations.order(:id).map(&:attributes)
        canonical_without_table = source_visualizations.find { |v| v['type'] == 'table' }
        UserTable.where(name: canonical_without_table['name']).delete
        @user.in_database.execute("DROP TABLE #{canonical_without_table['name']}")

        # Export and destroy user before import
        service.export_to_directory(@user, path)

        destroy_user

        # At this point, the user database is still there, but the tables got destroyed.
        # We recreate a dummy one for the visualization we did export
        canonical_with_table = source_visualizations.find do |v|
          v['type'] == 'table' && v['name'] != canonical_without_table['name']
        end
        @user.in_database.execute("CREATE TABLE #{canonical_with_table['name']} (cartodb_id int)")

        # We import the visualizations
        @imported_user = service.import_from_directory(path)
        service.import_metadata_from_directory(@imported_user, path)

        expect(@imported_user.visualizations.count).to eq source_visualizations.count - 1
      end
    end

    it 'skips not remote visualizations without a map' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        @user.visualizations.find { |v| !v.remote? }.map.delete

        full_export_import(path)

      end
    end

    it 'keeps visualization password' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations

        @user.update_attributes(private_maps_enabled: true, private_tables_enabled: true)
        v = @user.visualizations.where(type: 'derived').first
        v.password = 'dont_tell_anyone'
        v.privacy = 'password'
        v.save!

        full_export_import(path)

        v.reload
        expect(v.password_protected?).to be_true
        expect(v.password_valid?('dont_tell_anyone')).to be_true
      end
    end
  end

  EXCLUDED_USER_META_DATE_FIELDS = ['created_at', 'updated_at', 'period_end_date', 'auth_token'].freeze
  EXCLUDED_USER_META_ID_FIELDS = ['map_id', 'permission_id', 'active_layer_id', 'tags'].freeze

  def compare_excluding_dates_and_ids(v1, v2)
    filtered1 = v1.reject { |k, _| EXCLUDED_USER_META_ID_FIELDS.include?(k) }
    filtered2 = v2.reject { |k, _| EXCLUDED_USER_META_ID_FIELDS.include?(k) }
    compare_excluding_dates(filtered1, filtered2)
  end

  def compare_excluding_dates(u1, u2)
    filtered1 = u1.reject { |k, _| EXCLUDED_USER_META_DATE_FIELDS.include?(k) }
    filtered2 = u2.reject { |k, _| EXCLUDED_USER_META_DATE_FIELDS.include?(k) }
    expect(filtered1).to eq filtered2
    expect(u1['period_end_date'].try(:round)).to eq(u2['period_end_date'].try(:round)) # Ignore microseconds
  end

  def expect_export_matches_user(export, user)
    Carto::UserMetadataExportService::EXPORTED_USER_ATTRIBUTES.each do |att|
      error = "attribute #{att.inspect} expected: #{user.attributes[att.to_s].inspect} got: #{export[att].inspect}"
      expect(export[att]).to eq(user.attributes[att.to_s]), error
    end

    expect(export[:layers].count).to eq user.layers.size
    export[:layers].zip(user.layers).each { |exported_layer, layer| expect_export_matches_layer(exported_layer, layer) }

    expect(export[:assets].count).to eq user.assets.size
    export[:assets].zip(user.assets).each { |exported_asset, asset| expect_export_matches_asset(exported_asset, asset) }

    expect(export[:feature_flags]).to eq user.feature_flags_user.map(&:feature_flag).map(&:name)

    if export[:search_tweets]
      expect(export[:search_tweets].count).to eq user.search_tweets.size
      export[:search_tweets].zip(user.search_tweets).each do |exported_search_tweet, search_tweet|
        expect_export_matches_search_tweet(exported_search_tweet, search_tweet)
      end
    else
      expect(user.search_tweets).to be_empty
    end

    if export[:synchronization_oauths]
      expect(export[:synchronization_oauths].count).to eq user.synchronization_oauths.size
      export[:synchronization_oauths].zip(user.synchronization_oauths).each do |exported_so, so|
        expect_export_matches_synchronization_oauth(exported_so, so)
      end
    else
      expect(user.synchronization_oauths).to be_empty
    end

    if export[:connector_configurations]
      expect(export[:connector_configurations].count).to eq user.connector_configurations.size
      export[:connector_configurations].zip(user.connector_configurations).each do |exported_cc, cc|
        expect_export_matches_connector_configuration(exported_cc, cc)
      end
    else
      expect(user.connector_configurations).to be_empty
    end

    expect_export_matches_rate_limit(export[:rate_limit], user.rate_limit)
    expect_export_matches_client_application(export[:client_application], ::User.find(id: user.id).client_application)

    if export[:user_multifactor_auths]
      expect(export[:user_multifactor_auths].count).to eq user.user_multifactor_auths.size
      export[:user_multifactor_auths].zip(user.user_multifactor_auths).each do |exported_uma, uma|
        expect_export_matches_user_multifactor_auth(exported_uma, uma)
      end
    else
      expect(user.user_multifactor_auths).to be_empty
    end

    if export[:oauth_app_users]
      expect_export_matches_oauth_app_users(export[:oauth_app_users].first, user.oauth_app_users.first)
    else
      expect(user.oauth_app_users).to be_empty
    end
  end

  def expect_export_matches_layer(exported_layer, layer)
    expect(exported_layer[:options]).to eq layer.options
    expect(exported_layer[:kind]).to eq layer.kind
  end

  def expect_export_matches_asset(exported_asset, asset)
    expect(exported_asset[:public_url]).to eq asset.public_url
    expect(exported_asset[:kind]).to eq asset.kind
    expect(exported_asset[:storage_info]).to eq asset.storage_info
  end

  def expect_redis_restored(user)
    expect(CartoDB::GeocoderUsageMetrics.new(user.username).get(:geocoder_here, :success_responses)).to eq(1)
  end

  def expect_export_matches_search_tweet(exported_search_tweet, search_tweet)
    if exported_search_tweet[:data_import]
      expect(exported_search_tweet[:data_import][:id]).to eq search_tweet.data_import.id
    else
      expect(search_tweet.data_import).to be_nil
    end
    expect(exported_search_tweet[:service_item_id]).to eq search_tweet.service_item_id
    expect(exported_search_tweet[:retrieved_items]).to eq search_tweet.retrieved_items
    expect(exported_search_tweet[:state]).to eq search_tweet.state
    expect(exported_search_tweet[:created_at].to_s).to eq search_tweet.created_at.to_s
    expect(exported_search_tweet[:updated_at].to_s).to eq search_tweet.updated_at.to_s
  end

  def expect_export_matches_synchronization_oauth(exported_so, so)
    expect(exported_so[:service]).to eq so.service
    expect(exported_so[:token]).to eq so.token
    expect(exported_so[:created_at].to_s).to eq so.created_at.to_s
    expect(exported_so[:updated_at].to_s).to eq so.updated_at.to_s
  end

  def expect_export_matches_connector_configuration(exported_cc, cc)
    expect(exported_cc[:enabled]).to eq cc.enabled
    expect(exported_cc[:max_rows]).to eq cc.max_rows
    expect(exported_cc[:created_at].to_s).to eq cc.created_at.to_s
    expect(exported_cc[:updated_at].to_s).to eq cc.updated_at.to_s
    expect(exported_cc[:provider_name]).to eq cc.connector_provider.name
  end

  def expect_export_matches_rate_limit(exported_rate_limit, rate_limit)
    expect(exported_rate_limit).to be_nil && return unless rate_limit
    expect(exported_rate_limit[:id]).to eq rate_limit.id
    rate_limit.api_attributes.each do |k, v|
      # versions older than 1.0.6 don't include sql_copy rate limits so avoid checking them
      next if [:sql_copy_from, :sql_copy_to].include?(k) && !exported_rate_limit[:limits].key?(k)
      expect(exported_rate_limit[:limits][k]).to eq v
    end
  end

  def expect_export_matches_client_application(exported_app, app)
    expect(exported_app).to be_nil && return unless app

    expect(exported_app[:name]).to eq app.name
    expect(exported_app[:url]).to eq app.url
    expect(exported_app[:support_url]).to eq app.support_url
    expect(exported_app[:callback_url]).to eq app.callback_url
    expect(exported_app[:key]).to eq app.key
    expect(exported_app[:secret]).to eq app.secret

    # Compare dates using AR conversions
    fake_app = Carto::ClientApplication.new(
      created_at: exported_app[:created_at],
      updated_at: exported_app[:updated_at]
    )
    expect(fake_app.created_at).to eq app.created_at
    expect(fake_app.updated_at).to eq app.updated_at

    expect(exported_app[:oauth_tokens].size + exported_app[:access_tokens].size).to eq app.oauth_tokens.size
    exported_app[:oauth_tokens].each do |ex_t|
      expect_exported_token_matches_token(ex_t, app.oauth_tokens.find { |t| t.token == ex_t[:token] })
    end
    expect(exported_app[:access_tokens].size).to eq app.access_tokens.size
    exported_app[:access_tokens].each do |ex_t|
      expect_exported_token_matches_token(ex_t, app.access_tokens.find { |t| t.token == ex_t[:token] })
    end
  end

  def expect_export_matches_user_multifactor_auth(exported_uma, uma)
    expect(exported_uma).to be_nil && return unless uma
    expect(exported_uma[:user_id]).to eq uma.user_id
    expect(exported_uma[:type]).to eq uma.type
    expect(exported_uma[:shared_secret]).to eq uma.shared_secret
    expect(exported_uma[:enabled]).to eq uma.enabled

    fake_uma = Carto::UserMultifactorAuth.new(
      last_login: exported_uma[:last_login],
      created_at: exported_uma[:created_at],
      updated_at: exported_uma[:updated_at]
    )

    expect(fake_uma.last_login).to eq uma.last_login
    expect(fake_uma.created_at).to eq uma.created_at
    expect(fake_uma.updated_at).to eq uma.updated_at
  end

  def expect_exported_token_matches_token(exported_t, token)
    expect(exported_t[:token]).to eq token.token
    expect(exported_t[:secret]).to eq token.secret
    expect(exported_t[:callback_url]).to eq token.callback_url
    expect(exported_t[:verifier]).to eq token.verifier
    expect(exported_t[:scope]).to eq token.scope

    # Compare dates using AR conversions
    fake_app = Carto::OauthToken.new(
      authorized_at: exported_t[:authorized_at],
      invalidated_at: exported_t[:invalidated_at],
      valid_to: exported_t[:valid_to],
      created_at: exported_t[:created_at],
      updated_at: exported_t[:updated_at]
    )

    expect(fake_app.authorized_at).to eq token.authorized_at
    expect(fake_app.invalidated_at).to eq token.invalidated_at
    expect(fake_app.valid_to).to eq token.valid_to
    expect(fake_app.created_at).to eq token.created_at
    expect(fake_app.updated_at).to eq token.updated_at
  end

  def expect_export_matches_oauth_app_users(exported_oauth_app_user, oauth_app_user)
    expect(exported_oauth_app_user).to be_nil && return unless oauth_app_user

    expect(exported_oauth_app_user[:id]).to eq oauth_app_user.id
    expect(exported_oauth_app_user[:oauth_app_id]).to eq oauth_app_user.oauth_app_id
    expect(exported_oauth_app_user[:scopes]).to eq oauth_app_user.scopes

    expect_export_matches_oauth_app_users_dates(exported_oauth_app_user, oauth_app_user)
    expect_export_matches_oauth_app_users_friends(exported_oauth_app_user, oauth_app_user, oauth_app_user.id)
  end

  def expect_export_matches_oauth_app_users_friends(exported_oauth_app_user, oauth_app_user, oauth_app_user_id)
    if exported_oauth_app_user[:oauth_authorization_codes]
      expect_export_matches_oauth_authorization_codes(
        exported_oauth_app_user[:oauth_authorization_codes].first,
        oauth_app_user.oauth_authorization_codes.first,
        oauth_app_user_id
      )
    end

    if exported_oauth_app_user[:oauth_access_tokens]
      expect_export_matches_oauth_access_tokens(
        exported_oauth_app_user[:oauth_access_tokens].first,
        oauth_app_user.oauth_access_tokens.first,
        oauth_app_user_id
      )
    end

    if exported_oauth_app_user[:oauth_refresh_tokens]
      expect_export_matches_oauth_refresh_tokens(
        exported_oauth_app_user[:oauth_refresh_tokens].first,
        oauth_app_user.oauth_refresh_tokens.first,
        oauth_app_user_id
      )
    end
  end

  def expect_export_matches_oauth_app_users_dates(exported_oauth_app_user, oauth_app_user)
    fake_oauth_app_user = Carto::OauthAppUser.new(
      created_at: exported_oauth_app_user[:created_at],
      updated_at: exported_oauth_app_user[:updated_at]
    )

    expect(fake_oauth_app_user.created_at).to eq oauth_app_user.created_at
    expect(fake_oauth_app_user.updated_at).to eq oauth_app_user.updated_at
  end

  def expect_export_matches_oauth_authorization_codes(exported_oac, oac, oauth_app_user_id)
    expect(exported_oac).to be_nil && return unless oac

    expect(oauth_app_user_id).to eq oac.oauth_app_user_id
    expect(exported_oac[:scopes]).to eq oac.scopes
    expect(exported_oac[:code]).to eq oac.code
    expect(exported_oac[:redirect_uri]).to eq oac.redirect_uri

    expect_export_matches_oauth_authorization_codes_dates(exported_oac, oac)
  end

  def expect_export_matches_oauth_authorization_codes_dates(exported_oac, oac)
    fake_oauth_authorization_code = Carto::OauthAuthorizationCode.new(
      created_at: exported_oac[:created_at]
    )

    expect(fake_oauth_authorization_code.created_at).to eq oac.created_at
  end

  def expect_export_matches_oauth_access_tokens(exported_oauth_access_token, oauth_access_token, oauth_app_user_id)
    expect(exported_oauth_access_token).to be_nil && return unless oauth_access_token

    expect(oauth_app_user_id).to eq oauth_access_token.oauth_app_user_id
    expect(exported_oauth_access_token[:api_key_id]).to eq oauth_access_token.api_key_id
    expect(exported_oauth_access_token[:scopes]).to eq oauth_access_token.scopes

    fake_oauth_access_token = Carto::OauthAccessToken.new(
      created_at: oauth_access_token[:created_at]
    )

    expect(fake_oauth_access_token.created_at).to eq oauth_access_token.created_at
  end

  def expect_export_matches_oauth_refresh_tokens(exported_oauth_refresh_token, oauth_refresh_token, oauth_app_user_id)
    expect(exported_oauth_refresh_token).to be_nil && return unless oauth_refresh_token

    expect(oauth_app_user_id).to eq oauth_refresh_token.oauth_app_user_id
    expect(exported_oauth_refresh_token[:token]).to eq oauth_refresh_token.token
    expect(exported_oauth_refresh_token[:scopes]).to eq oauth_refresh_token.scopes

    fake_oauth_refresh_token = Carto::OauthRefreshToken.new(
      created_at: oauth_refresh_token[:created_at],
      updated_at: oauth_refresh_token[:updated_at]
    )

    expect(fake_oauth_refresh_token.created_at).to eq oauth_refresh_token.created_at
    expect(fake_oauth_refresh_token.updated_at).to eq oauth_refresh_token.updated_at
  end

  def export_import(user)
    export = service.export_user_json_hash(user)
    expect_export_matches_user(export[:user], user)
    source_user = user.attributes
    destroy_user

    imported_user = service.build_user_from_hash_export(export)
    service.save_imported_user(imported_user)
    imported_user.reload

    search_tweets = service.build_search_tweets_from_hash_export(export)
    search_tweets.each { |st| service.save_imported_search_tweet(st, imported_user) }

    expect_export_matches_user(export[:user], imported_user)
    compare_excluding_dates(imported_user.attributes, source_user)
  end

  def full_export_import(path)
    @visualization.mark_as_vizjson2
    service.export_to_directory(@user, path)
    source_user = @user.attributes

    source_visualizations = @user.visualizations.order(:id).reject { |v| !v.remote? && !v.map }.map(&:attributes)
    source_tweets = @user.search_tweets.map(&:attributes)
    synchronization_oauths = @user.synchronization_oauths.map(&:attributes)
    destroy_user

    # At this point, the user database is still there, but the tables got destroyed. We recreate some dummy ones
    source_visualizations.select { |v| v['type'] == 'table' }.each do |v|
      @user.in_database.execute("CREATE TABLE #{v['name']} (cartodb_id int)")
    end

    # Clean redis for vizjson2 marking
    $tables_metadata.del(Carto::Visualization::V2_VISUALIZATIONS_REDIS_KEY)
    expect(@visualization.uses_vizjson2?).to be_false

    @imported_user = service.import_from_directory(path)
    service.import_metadata_from_directory(@imported_user, path)

    compare_excluding_dates(@imported_user.attributes, source_user)
    expect_redis_restored(@imported_user)
    expect(@imported_user.visualizations.count).to eq source_visualizations.count
    @imported_user.visualizations.order(:id).zip(source_visualizations).each do |v1, v2|
      compare_excluding_dates_and_ids(v1.attributes, v2)
    end

    expect(@visualization.uses_vizjson2?).to be_true
    @imported_user.search_tweets.zip(source_tweets).each do |st1, st2|
      expect(st1.user_id).to eq @imported_user.id
      expect(st1.service_item_id).to eq st2['service_item_id']
      expect(st1.retrieved_items).to eq st2['retrieved_items']
      expect(st1.state).to eq st2['state']
    end
    @imported_user.static_notifications.notifications.should eq full_export[:user][:notifications]

    @imported_user.synchronization_oauths.zip(synchronization_oauths).each do |so1, so2|
      expect(so1.user_id).to eq @imported_user.id
      expect(so1.service).to eq so2['service']
      expect(so1.token).to eq so2['token']
    end
  end

  def full_export_import_viewer(path)
    @user.update_attributes(viewer: true)
    ::User[@user.id].reload # Refresh Sequel cache
    service.export_to_directory(@user, path)
    source_user = @user.attributes

    source_visualizations = @user.visualizations.order(:id).map(&:attributes)
    source_tweets = @user.search_tweets.map(&:attributes)
    @user.update_attributes(viewer: false) # For destruction purposes
    destroy_user

    # At this point, the user database is still there, but the tables got destroyed. We recreate some dummy ones
    source_visualizations.select { |v| v['type'] == 'table' }.each do |v|
      @user.in_database.execute("CREATE TABLE #{v['name']} (cartodb_id int)")
    end

    @imported_user = service.import_from_directory(path)
    service.import_metadata_from_directory(@imported_user, path)

    compare_excluding_dates(@imported_user.attributes, source_user)
    expect_redis_restored(@imported_user)
    expect(@imported_user.visualizations.count).to eq source_visualizations.count
    @imported_user.visualizations.order(:id).zip(source_visualizations).each do |v1, v2|
      compare_excluding_dates_and_ids(v1.attributes, v2)
    end
    @imported_user.search_tweets.zip(source_tweets).each do |st1, st2|
      expect(st1.user_id).to eq @imported_user.id
      expect(st1.service_item_id).to eq st2['service_item_id']
      expect(st1.retrieved_items).to eq st2['retrieved_items']
      expect(st1.state).to eq st2['state']
    end
  end

  let(:service_item_id) do
    '{\"dates\":{\"fromDate\":\"2014-07-29\",\"fromHour\":0,\"fromMin\":0,\"toDate\":'\
      '\"2014-08-27\",\"toHour\":23,\"toMin\":59,\"user_timezone\":0,\"max_days\":30},\"categories\":'\
      '[{\"terms\":[\"cartodb\"],\"category\":\"1\",\"counter\":1007}]}'
  end

  let(:full_export) do
    {
      version: "1.0.12",
      user: {
        email: "e00000002@d00000002.com",
        crypted_password: "0f865d90688f867c18bbd2f4a248537878585e6c",
        database_name: "cartodb_test_user_5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0_db",
        username: "user00000001",
        state: 'active',
        admin: nil,
        maintenance_mode: true,
        enabled: true,
        invite_token: nil,
        invite_token_date: nil,
        map_enabled: true,
        quota_in_bytes: 5000000,
        table_quota: nil,
        public_map_quota: 20,
        regular_api_key_quota: 20,
        account_type: "FREE",
        private_tables_enabled: false,
        period_end_date: nil,
        map_view_quota: 10000,
        max_layers: 8,
        database_timeout: 300000,
        user_timeout: 300000,
        database_render_timeout: 0,
        user_render_timeout: 0,
        upgraded_at: nil,
        map_view_block_price: nil,
        geocoding_quota: 0,
        dashboard_viewed_at: nil,
        sync_tables_enabled: false,
        database_host: "localhost",
        geocoding_block_price: nil,
        api_key: "21ee521b8a107ea55d61fd7b485dd93d54c0b9d2",
        notification: nil,
        organization_id: nil,
        created_at: Time.zone.now,
        updated_at: Time.zone.now,
        disqus_shortname: nil,
        id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0",
        twitter_username: nil,
        website: nil,
        description: nil,
        name: nil,
        avatar_url: "example.com/avatars/avatar_stars_red.png",
        database_schema: "public",
        soft_geocoding_limit: false,
        auth_token: nil,
        twitter_datasource_enabled: nil,
        twitter_datasource_block_price: nil,
        twitter_datasource_block_size: nil,
        twitter_datasource_quota: 0,
        soft_twitter_datasource_limit: false,
        available_for_hire: false,
        private_maps_enabled: false,
        google_sign_in: false,
        last_password_change_date: nil,
        max_import_file_size: 157286400,
        max_import_table_row_count: 500000,
        max_concurrent_import_count: 3,
        last_common_data_update_date: nil,
        google_maps_key: nil,
        google_maps_private_key: nil,
        enable_account_token: nil,
        location: nil,
        here_isolines_quota: 0,
        here_isolines_block_price: nil,
        soft_here_isolines_limit: false,
        obs_snapshot_quota: 0,
        obs_snapshot_block_price: nil,
        soft_obs_snapshot_limit: false,
        mobile_xamarin: false,
        mobile_custom_watermark: false,
        mobile_offline_maps: false,
        mobile_gis_extension: false,
        mobile_max_open_users: 0,
        mobile_max_private_users: 0,
        obs_general_quota: 0,
        obs_general_block_price: nil,
        soft_obs_general_limit: false,
        viewer: false,
        salesforce_datasource_enabled: false,
        builder_enabled: nil,
        geocoder_provider: nil,
        isolines_provider: nil,
        routing_provider: nil,
        github_user_id: nil,
        engine_enabled: true,
        mapzen_routing_quota: nil,
        mapzen_routing_block_price: nil,
        soft_mapzen_routing_limit: false,
        no_map_logo: false,
        org_admin: false,
        last_name: nil,
        feature_flags: [Carto::FeatureFlag.first.name],
        company: 'CARTO',
        phone: '1234567',
        api_keys: [
          {
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "kkkkkkkkktest_cartodb_user_5f02aa9a-100f-11e8-a8b7-080027eb929e",
            db_role: "test_cartodb_user_5f02aa9a-100f-11e8-a8b7-080027eb929e",
            name: "Master",
            token: "21ee521b8a107ea55d61fd7b485dd93d54c0b9d2",
            type: "master",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: ["sql", "maps"]
            }, {
              type: 'dataservices',
              services: ['geocoding', 'routing', 'isolines', 'observatory']
            }, {
              type: 'user',
              data: ['profile']
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          },
          {
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "be63855d1179de48dc8c82b9fce338636d961e76",
            db_role: "user00000001_role_31cf62cd1123fe32b0bf76b048e3af39",
            name: "some Api Key",
            token: "OHP1p6jPwG5Lbabr4jq20g",
            type: "regular",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: []
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          },
          {
            id: "2135c786-1ecf-4aff-bcde-e759bb1843e0",
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "be63855d1179de48dc8c82b9fce338636d961e76",
            db_role: "user00000001_role_31cf62cd112354340bf76b048e3af398",
            name: "oauth_authorization 2135c786-1ecf-4aff-bcde-e759bb1843e0",
            token: "OHP1p6jPwG5Lbabr4jq202",
            type: "oauth",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: ["sql", "maps"]
            }, {
              type: "user",
              data: ["profile"]
            }, {
              type: "dataservices",
              services: ["routing", "isolines", "observatory", "geocoding"]
            }, {
              type: "database",
              tables: [{
                name: "st",
                permissions: ["select"],
                schema: "test1"
              }]
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          }
        ],
        assets: [
          {
            public_url: "https://manolo.es/es/co/bar.png",
            kind: nil,
            storage_info: nil
          }
        ],
        layers: [
          {
            options: {
              "default" => true,
              "url" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "subdomains" => "abcd",
              "minZoom" => "0",
              "maxZoom" => "18",
              "attribution" => "© <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> ...",
              "urlTemplate" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "type" => "Tiled",
              "name" => "Positron Labels"
            },
            kind: "tiled"
          }
        ],
        rate_limit: {
          id: "44d9db90-e12a-4764-85a4-fee012a98333",
          limits: {
            maps_anonymous: [0, 1, 2],
            maps_static: [0, 1, 2],
            maps_static_named: [0, 1, 2],
            maps_dataview: [0, 1, 2],
            maps_dataview_search: [0, 1, 2],
            maps_analysis: [0, 1, 2],
            maps_tile: [0, 1, 2],
            maps_attributes: [0, 1, 2],
            maps_named_list: [0, 1, 2],
            maps_named_create: [0, 1, 2],
            maps_named_get: [0, 1, 2],
            maps_named: [0, 1, 2],
            maps_named_update: [0, 1, 2],
            maps_named_delete: [0, 1, 2],
            maps_named_tiles: [0, 1, 2],
            maps_analysis_catalog: [0, 1, 2],
            sql_query: [0, 1, 2],
            sql_query_format: [0, 1, 2],
            sql_job_create: [0, 1, 2],
            sql_job_get: [0, 1, 2],
            sql_job_delete: [0, 1, 2],
            sql_copy_from: [0, 1, 2],
            sql_copy_to: [0, 1, 2]
          }
        },
        search_tweets: [
          {
            data_import: {
              data_source: '/path',
              data_type: 'file',
              table_name: 'twitter_cartodb',
              state: 'complete',
              success: true,
              log: {
                type: 'import',
                entries: ''
              },
              updated_at: Time.zone.now,
              created_at: Time.zone.now,
              error_code: nil,
              queue_id: nil,
              tables_created_count: nil,
              table_names: nil,
              append: false,
              migrate_table: nil,
              table_copy: nil,
              from_query: nil,
              id: '118813f4-c943-4583-822e-111ed0b51ca4',
              service_name: 'twitter_search',
              service_item_id: service_item_id,
              stats: '{}',
              type_guessing: true,
              quoted_fields_guessing: true,
              content_guessing: false,
              server: nil,
              host: nil,
              upload_host: nil,
              resque_ppid: nil,
              create_visualization: false,
              visualization_id: nil,
              user_defined_limits: '{}',
              import_extra_options: nil,
              original_url: '',
              privacy: nil,
              cartodbfy_time: 0.0,
              http_response_code: nil,
              rejected_layers: nil,
              runner_warnings: nil,
              collision_strategy: nil,
              external_data_imports: []
            },
            service_item_id: service_item_id,
            retrieved_items: 123,
            state: 'complete',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          },
          {
            data_import: nil,
            service_item_id: service_item_id,
            retrieved_items: 123,
            state: 'complete',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          }
        ],
        notifications: {
          builder: {
            onboarding: true,
            "layer-style-onboarding": true,
            "layer-analyses-onboarding": true
          }
        },
        synchronization_oauths: [
          {
            service: 'gdrive',
            token: '1234567890',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          }
        ],
        connector_configurations: [
          {
            created_at: Time.zone.now,
            updated_at: Time.zone.now,
            enabled: true,
            max_rows: 100000,
            provider_name: @connector_provider.name
          }
        ],
        client_application: {
          name: 'Dummy Application',
          url: 'http://somewhere.es',
          support_url: 'http://somewhere.es/support',
          callback_url: nil,
          key: "crjNXIU3p8xKcoFMuX5eb10xDwK71BP446ToBRnP",
          secret: "CH3M9gcd9BhLu4ukAg8TPruN0W5zsP4OJ0BQOdtv",
          created_at: "2018-06-08T15:00:45+00:00",
          updated_at: "2018-06-08T15:00:45+00:00",
          oauth_tokens: [{
            token: "oauth_token",
            secret: "oauth_secret",
            callback_url: "http//callback.com",
            verifier: "v1",
            scope: nil,
            authorized_at: "2018-06-11T14:31:46+00:00",
            invalidated_at: "2018-06-11T14:31:46+00:00",
            valid_to: "2018-06-11T14:31:46+00:00",
            created_at: "2018-06-11T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }],
          access_tokens: [{
            token: "access_token",
            secret: "access_secret",
            callback_url: "http://callback2",
            verifier: "v2",
            scope: nil,
            authorized_at: "2018-06-11T14:31:46+00:00",
            invalidated_at: "2018-06-11T14:31:46+00:00",
            valid_to: "2018-06-11T14:31:46+00:00",
            created_at: "2018-06-11T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }]
        },
        user_multifactor_auths: [{
          user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0",
          created_at: "2018-11-16T14:31:46+00:00",
          updated_at: "2018-11-17T16:41:56+00:00",
          last_login: "2018-11-17T16:41:56+00:00",
          enabled: true,
          shared_secret: 'abcdefgh',
          type: 'totp'
        }],
        oauth_app_users: [{
          id: "d881e0f1-cf35-4c35-b44a-6dc31608a435", # necessary for role creation
          oauth_app_id: @oauth_app.id,
          scopes: ["datasets:r:test1", "datasets:rw:test2"],
          created_at: "2018-11-16T14:31:46+00:00",
          updated_at: "2018-11-17T16:41:56+00:00",
          oauth_authorization_codes: [{
            scopes: ["datasets:r:test1"],
            code: "zzzz",
            redirect_uri: "https://carto.com",
            created_at: "2018-11-16T14:31:46+00:00"
          }],
          oauth_access_tokens: [{
            api_key_id: "2135c786-1ecf-4aff-bcde-e759bb1843e0",
            scopes: [
              "user:profile",
              "dataservices:routing",
              "dataservices:isolines",
              "dataservices:observatory",
              "dataservices:geocoding",
              "datasets:r:test1",
              "schemas:c"
            ],
            created_at: "2018-11-16T14:31:46+00:00"
          }],
          oauth_refresh_tokens: [{
            token: "zzzzz",
            scopes: ["datasets:r:test1", "offline"],
            created_at: "2018-11-16T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }]
        }]
      }
    }
  end

  let(:full_export_one_zero_twelve) do
    user_hash = full_export[:user].except!(:use_case, :company_employees)
    
    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_eleven) do
    full_export[:user][:maintenance_mode] = false
    full_export
  end

  let(:full_export_one_zero_ten) do
    user_hash = full_export_one_zero_eleven[:user].except!(:regular_api_key_quota)

    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_nine) do
    user_hash = full_export_one_zero_ten[:user].except!(:public_map_quota)

    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_eight) do
    user_hash = full_export_one_zero_nine[:user].except!(:oauth_app_users)

    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_seven) do
    user_hash = full_export_one_zero_eight[:user].except!(:user_multifactor_auths)

    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_six) do
    user_hash = full_export_one_zero_seven[:user].except!(:password_reset_token, :password_reset_sent_at)

    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_five) do
    user_hash = full_export_one_zero_six[:user].except!(:client_application)
    limits_hash = full_export[:user][:rate_limit][:limits]
    full_export[:user] = user_hash
    full_export[:user][:rate_limit][:limits] = limits_hash.except!(:sql_copy_from).except!(:sql_copy_to)
    full_export
  end

  let(:full_export_one_zero_four) do
    user_hash = full_export_one_zero_five[:user].except!(:synchronization_oauths, :connector_configurations)
    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_three) do
    user_hash = full_export_one_zero_four[:user].except!(:company).except!(:phone)
    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_two) do
    user_hash = full_export_one_zero_three[:user].except!(:rate_limit)
    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_one) do
    user_hash = full_export_one_zero_two[:user].except!(:notifications)
    full_export[:user] = user_hash
    full_export
  end

  let(:full_export_one_zero_zero) do
    user_hash = full_export_one_zero_one[:user].except!(:search_tweets)
    full_export[:user] = user_hash
    full_export
  end
end
