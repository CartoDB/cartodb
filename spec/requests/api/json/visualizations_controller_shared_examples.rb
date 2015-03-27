# encoding: utf-8

require_relative '../../../../app/models/visualization/member'

# TODO:
# - exclude private liked if not shared
# - count shared
# - ...

shared_examples_for "visualization controllers" do
  include_context 'visualization creation helpers'

  # Custom hash comparation, since in the ActiveModel-based controllers
  # we allow some differences:
  # - x to many associations can return [] instead of nil
  def normalize_hash(h)
    h.each { |k, v| h[k] = nil if v == [] }
  end

  def login(user)
    login_as(user, scope: user.subdomain)
  end

  def response_body
    get base_url, nil, @headers
    last_response.status.should == 200
    body = JSON.parse(last_response.body)
    body['visualizations'] = body['visualizations'].map { |v| normalize_hash(v) }
    body
  end

  describe 'index' do

    before(:each) do
      login(@user1)
    end

    it 'returns success, empty response for empty user' do
      response_body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns valid information for a user with one table' do
      table1 = create_table(@user1)
      expected_visualization = JSON.parse(table1.table_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user1,
        table: table1,
        synchronization: nil
      ).to_json)
      expected_visualization = normalize_hash(expected_visualization)

      response_body.should == { 'visualizations' => [expected_visualization], 'total_entries' => 1, 'total_user_entries' => 1, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns liked count' do
      table1 = create_table(@user1)
      table1b = create_table(@user1)
      table2 = create_table(@user2)
      table2b = create_table(@user2)
      visualization2 = table2.table_visualization
      visualization2.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization2.store
      visualization2.add_like_from(@user1.id)

      response_body['total_likes'].should == 1
    end

  end

end
