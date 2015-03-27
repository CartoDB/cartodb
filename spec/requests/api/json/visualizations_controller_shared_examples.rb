# encoding: utf-8

shared_examples_for "visualization controllers" do
  include_context 'visualization creation helpers'

  # Custom hash comparation, since in the ActiveModel-based controllers
  # we allow some differences:
  # - x to many associations can return [] instead of nil
  def normalize_hash(h)
    h.each { |k, v| h[k] = nil if v == [] }
  end

  describe 'index' do

    it 'returns success, empty response for empty user' do
      login_as(@user1, scope: @user1.subdomain)
      get base_url, nil, @headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns valid information for a user with one table' do
      login_as(@user1, scope: @user1.subdomain)
      table1 = create_table(@user1)
      expected_visualization = JSON.parse(table1.table_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user1,
        table: table1,
        synchronization: nil
      ).to_json)
      expected_visualization = normalize_hash(expected_visualization)

      get base_url, nil, @headers
      body = JSON.parse(last_response.body)
      body['visualizations'] = body['visualizations'].map { |v| normalize_hash(v) }
      body.should == { 'visualizations' => [expected_visualization], 'total_entries' => 1, 'total_user_entries' => 1, 'total_likes' => 0, 'total_shared' => 0}
    end

  end

end
