require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')

describe "Imports API uploads" do

  before(:each) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key
  end

  it 'allow to upload using the request body' do
    file = File.open(Rails.root.join('spec/support/whs_features.csv'), 'r+')

    post v1_imports_uploads_url(:host => 'test.localhost.lan'), {:body => file.read, :qqfile => File.basename(file.path), :api_key => @user.get_map_key}

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['file_uri'].should match(/uploads\/.*\/whs_features.csv/)
    response_json['success'].should be_true
  end

  it 'allow to upload using a file param' do

    file = Rack::Test::UploadedFile.new(Rails.root.join('spec/support/whs_features.csv'), 'text/plain')

    post v1_imports_uploads_url(:host => 'test.localhost.lan'), {:file => file, :api_key => @user.get_map_key}

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['file_uri'].should match(/uploads\/.*\/whs_features.csv/)
    response_json['success'].should be_true
  end

end
