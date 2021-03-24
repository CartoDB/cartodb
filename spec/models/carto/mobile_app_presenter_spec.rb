require 'spec_helper_unit'

describe Carto::Api::MobileAppPresenter do

  it "Compares old and new ways of 'presenting' mobile app data" do
    user = build(:user, :mobile)
    mobile_app = build(:mobile_app)

    # Data should return mobile platforms data
    compare_data(mobile_app.data(user, fetch_mobile_platforms: true), mobile_app.as_json, fetch_mobile_platforms: true)
    # Data should return mobile app types data
    compare_data(mobile_app.data(user, fetch_app_types: true), mobile_app.as_json, fetch_app_types: true)
    # Data should return default mobile app data
    compare_data(mobile_app.data(user), mobile_app.as_json)

  end

  protected

  def compare_data(old_data, new_data, fetch_mobile_platforms: false, fetch_app_types: false)
    new_data['id'].should == old_data[:id]
    new_data['name'].should == old_data[:name]
    new_data['description'].should == old_data[:description]
    new_data['icon_url'].should == old_data[:icon_url]
    new_data['platform'].should == old_data[:platform]
    new_data['app_id'].should == old_data[:app_id]
    new_data['app_type'].should == old_data[:app_type]
    new_data['license_key'].should == old_data[:license_key]
    new_data['monthly_users'].should == old_data[:monthly_users]

    expect(old_data[:mobile_platforms]).to be_nil if fetch_mobile_platforms == false
    expect(old_data[:app_types]).to be_nil if fetch_app_types == false
    expect(old_data[:mobile_platforms]).not_to be_empty if fetch_mobile_platforms == true
    expect(old_data[:app_types]).not_to be_empty if fetch_app_types == true
  end
end
