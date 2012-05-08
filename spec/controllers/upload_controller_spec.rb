require 'spec_helper'

describe UploadController do

  describe "POST create" do

    it "stores data from request body as a temp file" do
      request.env['warden'] = stub(
        :authenticated? => true,
        :authenticate! => true,
        :user => stub(:id => 1, :username => 'test'))
      request.host = 'test.localhost.lan'

      file = File.open(Rails.root.join('spec/support/whs_features.csv'), 'r+')

      post :create, :body => file.read, :qqfile => File.basename(file.path)

      response.code.should be == '200'
      puts response.body

      response_json = JSON.parse(response.body)
      response_json.should_not be_nil
      response_json['file_uri'].should match(/uploads\/.*\/whs_features.csv/)
      response_json['success'].should be_true

    end

    it "stores data from 'file' param as a temp file" do
      request.env['warden'] = stub(
        :authenticated? => true,
        :authenticate! => true,
        :user => stub(:id => 1, :username => 'test'))
      request.host = 'test.localhost.lan'

      file = File.open(Rails.root.join('spec/support/whs_features.csv'), 'r+')
      file = ActionDispatch::Http::UploadedFile.new(:tempfile => file, :filename => File.basename(file))

      post :create, :file => file

      response.code.should be == '200'

      response_json = JSON.parse(response.body)
      response_json.should_not be_nil
      response_json['file_uri'].should match(/uploads\/.*\/whs_features.csv/)
      response_json['success'].should be_true
    end

  end

end


