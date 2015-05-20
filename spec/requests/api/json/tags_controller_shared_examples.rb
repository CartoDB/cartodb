# encoding: utf-8

shared_examples_for 'tags controllers' do
  include CacheHelper

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:each) do
      @headers = {'CONTENT_TYPE'  => 'application/json'}
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns an empty array for a user without tagged visualizations' do
      login_as(@user1, scope: @user1.subdomain)
      get api_v1_visualizations_tags_index_url(api_key: @api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == []
    end

    it 'returns an array with one tag with count one for a user with one tagged visualization' do
      visualization = create_visualization(@user1, { tags: ['tag1'] })

      login_as(@user1, scope: @user1.subdomain)
      get api_v1_visualizations_tags_index_url(api_key: @api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == [{ 'name' => 'tag1', 'count' => 1 }]

      login_as(@user2, scope: @user2.subdomain)
      get api_v1_visualizations_tags_index_url(api_key: @api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == [{ 'name' => 'tag1', 'count' => 1 }]
    end

    it 'returns an array with correct tag count with several visualizations' do
      visualization = create_visualization(@user1, { tags: ['tag1'] })
      visualization = create_visualization(@user1, { tags: ['tag1', 'tag2'] })

      login_as(@user1, scope: @user1.subdomain)
      get api_v1_visualizations_tags_index_url(api_key: @api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == [
        { 'name' => 'tag1', 'count' => 2 },
        { 'name' => 'tag2', 'count' => 1 }
      ]
    end

  end

end
