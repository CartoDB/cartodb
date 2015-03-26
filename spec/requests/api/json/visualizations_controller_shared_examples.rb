# encoding: utf-8

shared_examples_for "visualization controllers" do
  include_context 'visualization creation helpers'

  describe 'index' do

    it 'returns success, empty response for empty user' do
      login_as(@user1, scope: @user1.subdomain)
      get base_url, nil, @headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns right information for a user with one table' do
      login_as(@user1, scope: @user1.subdomain)
      table1 = create_table(@user1)
      get base_url, nil, @headers
      body = JSON.parse(last_response.body)
      expected_visualization = JSON.parse(table1.table_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user1,
        table: table1,
        synchronization: nil
      ).to_json)
      body.should == { 'visualizations' => [expected_visualization], 'total_entries' => 1, 'total_user_entries' => 1, 'total_likes' => 0, 'total_shared' => 0}
    end

  end

end
