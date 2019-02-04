# encoding: utf-8

require_relative '../../spec_helper_min'

describe Carto::TagQueryBuilder do

  describe "#build" do
    before(:all) do
      @user1 = FactoryGirl.create(:carto_user)
      @user2 = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user1.destroy
      @user2.destroy
    end

    after(:each) do
      Carto::Visualization.all.each(&:destroy)
    end

    context 'with user' do
      before(:all) do
        @builder = Carto::TagQueryBuilder.new.with_user(@user1)
      end

      it 'returns zero results when the user has no visualizations' do
        FactoryGirl.create(:derived_visualization, user_id: @user2.id, tags: ["user2"])

        result = @builder.build.all

        result.length.should eql 0
      end

      it 'returns zero results when the user has no tags' do
        FactoryGirl.create(:derived_visualization, user_id: @user1.id)

        result = @builder.build.all

        result.length.should eql 0
      end

      it 'returns the tags in lowercase and merges tags with different letter case' do
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["USER1"])
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["uSeR1"])

        result = @builder.build.all

        result.length.should eql 1
        result[0].tag.should eql "user1"
        result[0].derived_count.should eql 2
        result[0].table_count.should eql 0
      end

      it 'returns the right count of single tags for maps and datasets' do
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["user1"])
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset"])
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["user1"])

        result = @builder.build.all

        result.length.should eql 2
        result[0].tag.should eql "user1"
        result[0].derived_count.should eql 1
        result[0].table_count.should eql 1
        result[1].tag.should eql "dataset"
        result[1].derived_count.should eql 0
        result[1].table_count.should eql 1
      end

      it 'returns the right count of multiple tags for maps and datasets' do
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["user1", "dataset"])
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset"])

        result = @builder.build.all

        result.length.should eql 2
        result[0].tag.should eql "dataset"
        result[0].table_count.should eql 2
        result[1].tag.should eql "user1"
        result[1].table_count.should eql 1
      end

      it 'returns the tags ordered by total occurrences' do
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset", "user1"])
        FactoryGirl.create(:table_visualization, user_id: @user1.id, tags: ["dataset", "user1"])
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["map", "user1"])

        result = @builder.build.all

        result.length.should eql 3
        result[0].tag.should eql "user1"
        result[1].tag.should eql "dataset"
      end
    end

    context 'without user' do
      before(:all) do
        @builder = Carto::TagQueryBuilder.new
      end

      after(:each) do
        Carto::Visualization.all.each(&:destroy)
      end

      it 'returns tags for all the users' do
        FactoryGirl.create(:derived_visualization, user_id: @user1.id, tags: ["user1"])
        FactoryGirl.create(:derived_visualization, user_id: @user2.id, tags: ["user2"])

        result = @builder.build.all

        result.length.should eql 2
        result[0].tag.should eql "user1"
        result[0].derived_count.should eql 1
        result[1].tag.should eql "user2"
        result[1].derived_count.should eql 1
      end
    end
  end

  describe "#build_paged" do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
      FactoryGirl.create(:table_visualization, user_id: @user.id, tags: ["tag1"])
      FactoryGirl.create(:table_visualization, user_id: @user.id, tags: ["tag1", "tag2"])
      FactoryGirl.create(:derived_visualization, user_id: @user.id, tags: ["tag1", "tag2", "tag3"])
      @builder = Carto::TagQueryBuilder.new.with_user(@user)
    end

    after(:all) do
      @user.destroy
    end

    after(:all) do
      Carto::Visualization.all.each(&:destroy)
    end

    it 'returns the expected result for the first page' do
      result = @builder.build_paged(1, 2)

      result.length.should eql 2
      result[0].tag.should eql "tag1"
      result[1].tag.should eql "tag2"
    end

    it 'returns the expected result for the last page' do
      result = @builder.build_paged(2, 2)

      result.length.should eql 1
      result[0].tag.should eql "tag3"
    end

  end
end
