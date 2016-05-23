# coding: UTF-8

require_relative '../../spec_helper_min'

describe Carto::Api::MobileAppPresenter do

  it "Compares old and new ways of 'presenting' mobile app data" do
    user = FactoryGirl.build(:user, :mobile)
    mobile_app = FactoryGirl.build(:mobile_app)

    mobile_platforms_option = { mobile_platforms: true }
    app_types_option = { app_types: true }

    compare_data(mobile_app.data(user, mobile_platforms_option), mobile_app.as_json, mobile_platforms_option) # Data should return mobile platforms data
    compare_data(mobile_app.data(user, app_types_option), mobile_app.as_json, app_types_option)               # Data shoudl return mobile app types data
    compare_data(mobile_app.data(user), mobile_app.as_json, {})                                               # Data should return default mobile app data

  end

  protected

  def compare_data(old_data, new_data, options)
    new_data['id'].should == old_data[:id]
    new_data['name'].should == old_data[:name]
    new_data['description'].should == old_data[:description]
    new_data['icon_url'].should == old_data[:icon_url]
    new_data['platform'].should == old_data[:platform]
    new_data['app_id'].should == old_data[:app_id]
    new_data['app_type'].should == old_data[:app_type]
    new_data['license_key'].should == old_data[:license_key]
    new_data['monthly_users'].should == old_data[:monthly_users]

    expect(old_data[:mobile_platforms]).to exist if options.include?('mobile_platforms')
    expect(old_data[:app_types]).to exist if options.include?('app_types')
  end
end
