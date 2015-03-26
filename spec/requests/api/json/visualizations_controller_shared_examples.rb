# encoding: utf-8

shared_examples_for "visualization controllers" do
  include_context 'visualization creation helpers'

  describe 'index' do
    it 'returns success response for empty user' do
      login_as(@user1, scope: @user1.subdomain)
      get base_url, nil, @headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      expected_response = { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
      body.should == expected_response
    end
  end

end
