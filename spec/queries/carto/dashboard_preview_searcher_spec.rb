# encoding: utf-8

require_relative '../../spec_helper_min'

describe Carto::DashboardPreviewSearcher do
  include_context 'users helper'

  describe "#search" do
    before(:each) do
      FactoryGirl.create(:table_visualization, user_id: @user1.id, name: 'new_york_polution',
                                               description: 'Air particles caused by traffic and industry',
                                               tags: ["United States", "contamination"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, name: 'New industries in York',
                                                 description: 'Data from 2018',
                                                 tags: ["United Kingdom"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, name: 'Madrid traffic',
                                                 tags: ["Spain", "contamination"])
    end

    it 'finds maps by name' do
      expected_result = [{ type: "derived", name: "Madrid traffic", url: 'WIP' }]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "Madrid")
      result = searcher.search(limit: 10)

      result.should eql expected_result
    end

    it 'finds maps by description' do
      expected_result = [{ type: "derived", name: "New industries in York", url: 'WIP' }]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "2018")
      result = searcher.search(limit: 10)

      result.should eql expected_result
    end

    it 'finds maps by tag' do
      expected_result = { type: "derived", name: "Madrid traffic", url: 'WIP' }

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "Spain")
      result = searcher.search(limit: 10)

      result.should include(expected_result)
    end

    it 'finds datasets by name' do
      expected_result = [{ type: "table", name: "new_york_polution", url: 'WIP' }]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "polution")
      result = searcher.search(limit: 10)

      result.should eql expected_result
    end

    it 'finds datasets by description' do
      expected_result = [{ type: "table", name: "new_york_polution", url: 'WIP' }]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "air")
      result = searcher.search(limit: 10)

      result.should eql expected_result
    end

    it 'finds datasets by tag' do
      expected_result = { type: "table", name: "new_york_polution", url: 'WIP' }

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "United States")
      result = searcher.search(limit: 10)

      result.should include(expected_result)
    end

    it 'finds tags' do
      expected_result = [
        { type: "tag", name: "united states", url: 'WIP' },
        { type: "tag", name: "united kingdom", url: 'WIP' }
      ]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "united")
      result = searcher.search(limit: 10)

      result.should include(*expected_result)
    end

    it 'includes results from tags, maps and datasets' do
      expected_result = [
        { type: "tag", name: "contamination", url: 'WIP' },
        { type: "derived", name: "Madrid traffic", url: 'WIP' },
        { type: "table", name: "new_york_polution", url: 'WIP' }
      ]

      searcher = Carto::DashboardPreviewSearcher.new(user: @user1, pattern: "contamination")
      result = searcher.search(limit: 10)

      result.should =~ expected_result
    end

  end
end
