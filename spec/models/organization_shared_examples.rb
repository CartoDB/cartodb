# Tests should define the following methods:
# - get_organization: returns a correspoding Organization instance
# - get_twitter_imports_count_by_organization_id: returns organization import count. Needed because implementations don't share a common interface
shared_examples_for "organization models" do
  before do
    @organization = create(:organization_with_users)
    @org_user_1 = @organization.users.first
    @org_user_2 = @organization.users.second
    @user1 = create(:valid_user)
  end

  describe "#get_geocoding_calls" do

    it "counts all geocodings within the org" do
      base_line = get_geocoding_calls_by_organization_id(@organization.id)

      get_organization.owner.geocoder_provider = 'heremaps'
      org_user_1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        @org_user_1.username,
        @org_user_1.organization.name
      )
      org_user_1_geocoder_metrics.incr(:geocoder_here, :success_responses, 2)
      org_user_1_geocoder_metrics.incr(:geocoder_cache, :success_responses, 3)

      org_user_2_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        @org_user_2.username,
        @org_user_2.organization.name
      )
      org_user_2_geocoder_metrics.incr(:geocoder_here, :success_responses, 4)
      org_user_2_geocoder_metrics.incr(:geocoder_cache, :success_responses, 5)

      user1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user1.username, nil)
      user1_geocoder_metrics.incr(:geocoder_here, :success_responses, 2)
      user1_geocoder_metrics.incr(:geocoder_cache, :success_responses, 3)

      ::User.any_instance.expects(:get_geocoding_calls).never
      get_geocoding_calls_by_organization_id(@organization.id).should == base_line + 14
    end

    it "counts all geocodings within the org using the org provider" do
      base_line = get_geocoding_calls_by_organization_id(@organization.id)

      get_organization.owner.geocoder_provider = 'tomtom'
      org_user_1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        @org_user_1.username,
        @org_user_1.organization.name
      )
      org_user_1_geocoder_metrics.incr(:geocoder_here, :success_responses, 2)
      org_user_1_geocoder_metrics.incr(:geocoder_cache, :success_responses, 3)

      org_user_2_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        @org_user_2.username,
        @org_user_2.organization.name
      )
      org_user_2_geocoder_metrics.incr(:geocoder_here, :success_responses, 4)
      org_user_2_geocoder_metrics.incr(:geocoder_cache, :success_responses, 5)

      user1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user1.username, nil)
      user1_geocoder_metrics.incr(:geocoder_here, :success_responses, 2)
      user1_geocoder_metrics.incr(:geocoder_cache, :success_responses, 3)

      ::User.any_instance.expects(:get_geocoding_calls).never
      get_geocoding_calls_by_organization_id(get_organization.id).should == base_line + 14
    end

  end

  describe '#signup_page_enabled' do
    it 'is true if domain whitelist is not empty' do
      organization = get_organization
      organization.update!(
        auth_username_password_enabled: true,
        whitelisted_email_domains: ['carto.com']
      )

      expect(organization.reload.signup_page_enabled).to be_true
    end

    it 'is false if domain whitelist is empty' do
      organization = get_organization
      organization.update!(
        auth_username_password_enabled: true,
        whitelisted_email_domains: []
      )

      expect(organization.reload.signup_page_enabled).to be_false
    end

    it 'is false if no authentication is enabled' do
      organization = get_organization
      organization.update_columns(
        auth_username_password_enabled: false,
        auth_google_enabled: false,
        auth_github_enabled: false,
        whitelisted_email_domains: ['carto.com']
      )

      expect(organization.reload.signup_page_enabled).to be_false
    end
  end

  it 'generates auth_tokens and save them for future accesses' do
    token = get_organization.get_auth_token
    token.should be
    get_organization.reload
    get_organization.get_auth_token.should eq token
  end
end
