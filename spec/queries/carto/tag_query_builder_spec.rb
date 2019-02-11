# encoding: utf-8

require_relative '../../spec_helper_min'

describe Carto::TagQueryBuilder do
  include_context 'users helper'

  before(:all) do
    @builder = Carto::TagQueryBuilder.new(@user1.id)
  end

  describe "#build_paged" do
    it 'returns an empty array when the user has no visualizations' do
      FactoryGirl.create(:derived_visualization, user_id: @user2.id, tags: ["user2"])

      result = @builder.build_paged(1, 10)

      result.should eql []
    end

    it 'returns an empty array when the user has no tags' do
      FactoryGirl.create(:derived_visualization, user_id: @user1.id)

      result = @builder.build_paged(1, 10)

      result.should eql []
    end

    it 'ignores empty tags' do
      FactoryGirl.create(:derived_visualization, user_id: @user1.id)
      visualization = Carto::Visualization.first
      visualization.update_attribute(:tags, [])

      result = @builder.build_paged(1, 10)

      result.should eql []
    end

    it 'ignores nil tags' do
      FactoryGirl.create(:derived_visualization, user_id: @user1.id)
      visualization = Carto::Visualization.first
      visualization.update_attribute(:tags, nil)

      result = @builder.build_paged(1, 10)

      result.should eql []
    end

    it 'returns the tags in lowercase and merges tags with different letter case' do
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["USER1"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["uSeR1"])
      expected_result = [{ tag: "user1", maps: 2, datasets: 0 }]

      result = @builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the right count of single tags for maps and datasets' do
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["user1"])
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["user1"])
      expected_result = [
        { tag: "user1", maps: 1, datasets: 1 },
        { tag: "dataset", maps: 0, datasets: 1 }
      ]

      result = @builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the right count of multiple tags for maps and datasets' do
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["user1", "dataset"])
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset"])
      expected_result = [
        { tag: "dataset", maps: 0, datasets: 2 },
        { tag: "user1", maps: 0, datasets: 1 }
      ]

      result = @builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the tags ordered by total occurrences' do
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset", "user1"])
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset", "user1"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["map", "user1"])
      expected_result = [
        { tag: "user1", maps: 1, datasets: 2 },
        { tag: "dataset", maps: 0, datasets: 2 },
        { tag: "map", maps: 1, datasets: 0 }
      ]

      result = @builder.build_paged(1, 10)

      result.should eql expected_result
    end

    context "pagination" do
      before(:each) do
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["tag1"])
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["tag1", "tag2"])
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["tag1", "tag2", "tag3"])
      end

      it 'returns the expected result for the first page' do
        expected_result = [
          { tag: "tag1", maps: 1, datasets: 2 },
          { tag: "tag2", maps: 1, datasets: 1 }
        ]

        result = @builder.build_paged(1, 2)

        result.should eql expected_result
      end

      it 'returns the expected result for the last page' do
        expected_result = [{ tag: "tag3", maps: 1, datasets: 0 }]

        result = @builder.build_paged(2, 2)

        result.should eql expected_result
      end
    end
  end

  describe "#total_count" do
    it 'returns 0 when there are no tags' do
      result = @builder.total_count

      result.should eql 0
    end

    it 'returns the number of different tags (not case-sensitive)' do
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["user1"])
      FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset"])
      FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["uSeR1"])

      result = @builder.total_count

      result.should eql 2
    end
  end
end
