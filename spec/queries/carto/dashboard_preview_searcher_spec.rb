require_relative '../../spec_helper_min'

describe Carto::DashboardPreviewSearcher do
  include_context 'users helper'

  describe "#search" do
    before(:each) do
      @table_us = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_CANONICAL,
                                                           user: @carto_user1, name: 'new_york_polution',
                                                           description: 'Air particles caused by traffic and industry',
                                                           tags: ["United States", "contamination"])
      @map_uk = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_DERIVED,
                                                         user: @carto_user1, name: 'New industries in York',
                                                         description: 'Data from 2018',
                                                         tags: ["United Kingdom"])
      @map_spain = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_DERIVED,
                                                            user: @carto_user1, name: 'Madrid traffic',
                                                            tags: ["Spain", "contamination"])
    end

    it 'finds maps by name' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["derived"], pattern: "Mad", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@map_spain]
      result.total_count.should eql 1
    end

    it 'finds maps by description' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["derived"], pattern: "2018", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@map_uk]
      result.total_count.should eql 1
    end

    it 'finds maps by tag' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["derived"], pattern: "Spain", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@map_spain]
      result.total_count.should eql 1
    end

    it 'finds datasets by name' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["table"], pattern: "lution", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@table_us]
      result.total_count.should eql 1
    end

    it 'finds datasets by description' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["table"], pattern: "air", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@table_us]
      result.total_count.should eql 1
    end

    it 'finds datasets by tag' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["table"], pattern: "States", limit: 5)
      result = searcher.search

      result.tags.should eql []
      result.visualizations.should eql [@table_us]
      result.total_count.should eql 1
    end

    it 'finds tags' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, types: ["tag"], pattern: "united", limit: 5)
      result = searcher.search

      result.tags.should =~ ["united states", "united kingdom"]
      result.visualizations.should eql []
      result.total_count.should eql 2
    end

    it 'includes results from tags, maps and datasets' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, pattern: "contamin", limit: 5)
      result = searcher.search

      result.tags.should eql ["contamination"]
      result.visualizations.should =~ [@table_us, @map_spain]
      result.total_count.should eql 3
    end

    it 'limits results by type' do
      searcher = Carto::DashboardPreviewSearcher.new(user: @carto_user1, pattern: "contamin", limit: 1)
      result = searcher.search

      result.tags.should eql ["contamination"]
      result.visualizations.should =~ [@map_spain]
      result.total_count.should eql 3
    end

  end
end
