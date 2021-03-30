require 'spec_helper_unit'

describe Carto::TagQueryBuilder do
  let(:user) do
    create(
      :carto_user,
      private_tables_enabled: true,
      private_maps_enabled: true,
      factory_bot_context: { only_db_setup: true }
    )
  end
  let(:other_user) do
    create(
      :carto_user,
      private_tables_enabled: true,
      private_maps_enabled: true,
      factory_bot_context: { only_db_setup: true }
    )
  end
  let(:builder) { described_class.new.with_owned_by_user_id(user.id) }

  describe "#build_paged" do
    it 'returns an empty array when the user has no visualizations' do
      create(:derived_visualization, user_id: other_user.id, tags: ["user2"])

      result = builder.build_paged(1, 10)

      result.should eql []
    end

    it 'returns an empty array when the user has no tags' do
      create(:derived_visualization, user_id: user.id)

      result = builder.build_paged(1, 10)

      result.should eql []
    end

    it 'ignores empty tags' do
      create(:derived_visualization, user_id: user.id)
      visualization = Carto::Visualization.first
      visualization.update_attribute(:tags, [])

      result = builder.build_paged(1, 10)

      result.should eql []
    end

    it 'ignores nil tags' do
      create(:derived_visualization, user_id: user.id)
      visualization = Carto::Visualization.first
      visualization.update_attribute(:tags, nil)

      result = builder.build_paged(1, 10)

      result.should eql []
    end

    it 'returns the tags in lowercase and merges tags with different letter case' do
      create(:derived_visualization, user_id: user.id, tags: ["USER1"])
      create(:derived_visualization, user_id: user.id, tags: ["uSeR1"])
      expected_result = [{ tag: "user1", maps: 2, datasets: 0, data_library: 0 }]

      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the right count of single tags for any type' do
      create(:table_visualization, user_id: user.id, tags: ["user1"])
      create(:table_visualization, user_id: user.id, tags: ["dataset"])
      create(:derived_visualization, user_id: user.id, tags: ["user1"])
      create(:carto_visualization, type: 'remote', user_id: user.id, tags: ["user1"])
      expected_result = [
        { tag: "user1", maps: 1, datasets: 1, data_library: 1 },
        { tag: "dataset", maps: 0, datasets: 1, data_library: 0 }
      ]

      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'allows to filter by one type' do
      create(:table_visualization, user_id: user.id, tags: ["dataset"])
      create(:derived_visualization, user_id: user.id, tags: ["map"])
      create(:carto_visualization, type: 'remote', user_id: user.id, tags: ["remote"])
      expected_result = [{ tag: "map", maps: 1 }]

      builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_types(["derived"])
      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'allows to filter by 2 types' do
      create(:table_visualization, user_id: user.id, tags: ["dataset"])
      create(:derived_visualization, user_id: user.id, tags: ["map"])
      create(:carto_visualization, type: 'remote', user_id: user.id, tags: ["remote"])
      expected_result = [
        { tag: "map", maps: 1, data_library: 0 },
        { tag: "remote", maps: 0, data_library: 1 }
      ]

      builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_types(["derived", "remote"])
      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the right count when having multiple tags' do
      create(:table_visualization, user_id: user.id, tags: ["user1", "dataset"])
      create(:table_visualization, user_id: user.id, tags: ["dataset"])
      expected_result = [
        { tag: "dataset", maps: 0, datasets: 2, data_library: 0 },
        { tag: "user1", maps: 0, datasets: 1, data_library: 0 }
      ]

      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    it 'returns the tags ordered by total occurrences' do
      create(:table_visualization, user_id: user.id, tags: ["dataset", "user1"])
      create(:table_visualization, user_id: user.id, tags: ["dataset", "user1"])
      create(:derived_visualization, user_id: user.id, tags: ["map", "user1"])
      expected_result = [
        { tag: "user1", maps: 1, datasets: 2, data_library: 0 },
        { tag: "dataset", maps: 0, datasets: 2, data_library: 0 },
        { tag: "map", maps: 1, datasets: 0, data_library: 0 }
      ]

      result = builder.build_paged(1, 10)

      result.should eql expected_result
    end

    context "pagination" do
      before(:each) do
        create(:table_visualization, user_id: user.id, tags: ["tag1"])
        create(:table_visualization, user_id: user.id, tags: ["tag1", "tag2"])
        create(:derived_visualization, user_id: user.id, tags: ["tag1", "tag2", "tag3"])
      end

      it 'returns the expected result for the first page' do
        expected_result = [
          { tag: "tag1", maps: 1, datasets: 2, data_library: 0 },
          { tag: "tag2", maps: 1, datasets: 1, data_library: 0 }
        ]

        result = builder.build_paged(1, 2)

        result.should eql expected_result
      end

      it 'returns the expected result for the last page' do
        expected_result = [{ tag: "tag3", maps: 1, datasets: 0, data_library: 0 }]

        result = builder.build_paged(2, 2)

        result.should eql expected_result
      end
    end

    context "search" do
      before(:each) do
        create(:table_visualization, user_id: user.id, tags: ["tag1"])
        create(:table_visualization, user_id: user.id, tags: ["tag1", "tag2"])
        create(:derived_visualization, user_id: user.id, tags: ["several words"])
      end

      it 'finds tags with the exact word' do
        expected_result = [{ tag: "tag2", datasets: 1, maps: 0, data_library: 0 }]

        builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_partial_match('tag2')
        result = builder.build_paged(1, 10)

        result.should =~ expected_result
      end

      it 'finds tags with partial words' do
        expected_result = [
          { tag: "tag1", datasets: 2, maps: 0, data_library: 0 },
          { tag: "tag2", datasets: 1, maps: 0, data_library: 0 }
        ]

        builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_partial_match('tag')
        result = builder.build_paged(1, 10)

        result.should =~ expected_result
      end

      it 'finds multiple tags' do
        expected_result = [
          { tag: "tag2", datasets: 1, maps: 0, data_library: 0 },
          { tag: "several words", datasets: 0, maps: 1, data_library: 0 }
        ]

        builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_partial_match('tag2 not-found word')
        result = builder.build_paged(1, 10)
        result.should =~ expected_result
      end

      it 'is not case sensitive' do
        expected_result = [{ tag: "tag1", datasets: 2, maps: 0, data_library: 0 }]

        builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_partial_match('TAG1')
        result = builder.build_paged(1, 10)

        result.should =~ expected_result
      end

      it 'finds tags with problematic characters' do
        create(:table_visualization, user_id: user.id, tags: ["50%"])
        expected_result = [{ tag: "50%", datasets: 1, maps: 0, data_library: 0 }]

        builder = Carto::TagQueryBuilder.new.with_owned_by_user_id(user.id).with_partial_match('%')
        result = builder.build_paged(1, 10)

        result.should =~ expected_result
      end
    end

    context "shared visualizations" do
      before(:each) do
        table = create_random_table(other_user)
        shared_visualization = table.table_visualization
        shared_visualization.tags = ["shared-tag"]
        shared_visualization.save
        Carto::SharedEntity.create(
          recipient_id: user.id,
          recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id: shared_visualization.id,
          entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
        )
        create(:derived_visualization, user_id: user.id, tags: ['owned-tag'])
      end

      it "does not include shared visualizations when using with_owned_by_user_id" do
        expected_result = [{ tag: "owned-tag", datasets: 0, maps: 1, data_library: 0 }]

        result = builder.build_paged(1, 10)

        result.should eql expected_result
      end

      it "includes tags from shared visualizations when using with_owned_by_or_shared_with_user_id" do
        builder = Carto::TagQueryBuilder.new.with_owned_by_or_shared_with_user_id(user.id)
        expected_result = [
          { tag: "owned-tag", datasets: 0, maps: 1, data_library: 0 },
          { tag: "shared-tag", datasets: 1, maps: 0, data_library: 0 }
        ]

        result = builder.build_paged(1, 10)

        result.should =~ expected_result
      end
    end
  end

  describe "#total_count" do
    it 'returns 0 when there are no tags' do
      result = builder.total_count

      result.should eql 0
    end

    it 'returns the number of different tags (not case-sensitive)' do
      create(:table_visualization, user_id: user.id, tags: ["user1"])
      create(:table_visualization, user_id: user.id, tags: ["dataset"])
      create(:derived_visualization, user_id: user.id, tags: ["uSeR1"])

      result = builder.total_count

      result.should eql 2
    end
  end
end
