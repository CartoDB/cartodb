# encoding: utf-8

shared_examples_for 'tags controllers' do

  describe 'index' do
    include_context 'visualization creation helpers'

    before(:each) do
      login_as(@user1, scope: @user1.subdomain)
      @headers = {'CONTENT_TYPE'  => 'application/json'}
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns an empty array for a user without tagged visualizations' do
      get api_v1_visualizations_tags_index_url(api_key: @api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body.should == []
    end

  end

end
