# encoding: utf-8

require_relative '../../../spec_helper'

include CartoDB

def app
  CartoDB::Application.new
end

shared_examples_for "visualization controllers" do
  before(:all) do
    @user = create_user(
      username: 'test',
      email: 'client@example.com',
      password: 'clientex'
    )
    @api_key = @user.api_key
  end

  before(:each) do
    delete_user_data @user
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  after(:all) do
    @user.destroy
  end

  describe 'index' do
    it 'returns success response for empty user' do
      login_as(@user, scope: @user.subdomain)
      get base_url, nil, @headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      expected_response = { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
      body.should == expected_response
    end
  end

end
