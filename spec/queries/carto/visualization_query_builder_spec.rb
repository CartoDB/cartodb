require 'spec_helper_unit'
require 'helpers/unique_names_helper'

describe Carto::VisualizationQueryBuilder do
  include UniqueNamesHelper
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include Carto::Factories::Visualizations
  include_context 'visualization creation helpers'

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
  let(:vqb) { described_class.new.with_user_id(user.id) }
  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:organization_user) do
    create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true })
  end

  before do
    DBQueryMatchers.configure do |config|
      config.ignores = []
      config.ignores << /SHOW client_min_messages/
      config.ignores << /SET client_min_messages TO 'panic'/
      config.ignores << /SET standard_conforming_strings = on/
      config.ignores << /SET client_min_messages TO 'notice'/
      config.ignores << /SHOW TIME ZONE/
      config.ignores << /SELECT a.attname, format_type(a.atttypid, a.atttypmod), d.adsrc, a.attnotnull/
      config.ignores << /SHOW search_path/
      config.ignores << /LEFT JOIN pg_namespace n ON n.oid = c.relnamespace/
      config.ignores << /INNER JOIN pg_depend dep ON attr.attrelid = dep.refobjid AND attr.attnum = dep.refobjsubid/
      config.ignores << /WHERE a.attrelid = '".*"'::regclass/
      config.ignores << /SHOW max_identifier_length/
    end
  end

  it 'searches for all visualizations' do
    table = create_random_table(user)
    table_visualization = table.table_visualization
    table_visualization.store
    Carto::VisualizationQueryBuilder.new.build.map(&:id).should include table_visualization.id
  end

  it 'searches for all visualizations for a user' do
    table1 = create_random_table(user)
    table2 = create_random_table(other_user)
    table_visualization1 = table1.table_visualization
    table_visualization1.store
    table_visualization2 = table2.table_visualization
    table_visualization2.store
    ids = Carto::VisualizationQueryBuilder.new.with_user_id(user.id).build.map(&:id)
    ids.should include table_visualization1.id
    ids.should_not include table_visualization2.id
  end

  it 'can prefetch user' do
    table1 = create_random_table(user)

    expect {
      vqb.build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 2..3)
    # 1: SELECT * FROM visualizations LIMIT 1
    # 2: to select basic user fields
    # 3: AR seems to not be very clever detecting vis.user is already fetched and sometimes re-fetches it

    expect {
      vqb.with_prefetch_user(true).build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 1)
  end

  it 'can prefetch table' do
    table1 = create_random_table(user)
    table_visualization = table1.table_visualization

    # Loads the model structures into memory, to avoid counting those as queries
    vqb.build.first.user_table.name

    expect {
      vqb.build.where(id: table_visualization.id).first.user_table.name
    }.to make_database_queries(count: 2..3)

    expect {
      vqb.with_prefetch_table.build.where(id: table_visualization.id).first.user_table.name
    }.to make_database_queries(count: 1)
  end

  context '#with_prefetch_dependent_visualizations' do
    before do
      table = create_random_table(user)
      @table_visualization = table.table_visualization
      @visualization = create(:carto_visualization, user_id: user.id)
      @visualization.map = create(:carto_map, user_id: user.id)
      @visualization.save!
      layer = build(:carto_layer)
      layer.options[:table_name] = table.name
      layer.save!
      @visualization.layers << layer
    end

    it 'can prefetch dependent visualizations' do
      expect {
        vqb.build.where(id: @table_visualization.id).all[0].dependent_visualizations
      }.to make_database_queries(count: 10)

      expect {
        vqb.with_prefetch_dependent_visualizations
            .build.where(id: @table_visualization.id).all[0].dependent_visualizations
      }.to make_database_queries(count: 1)
    end

    it 'can prefetch together two nested associations with the same root' do
      expect {
        vqb.build.where(id: @table_visualization.id).all[0].dependent_visualizations
      }.to make_database_queries(count: 10)

      expect {
        vqb.with_prefetch_dependent_visualizations.with_prefetch_table
            .build.where(id: @table_visualization.id).all[0].dependent_visualizations
      }.to make_database_queries(count: 1)
    end
  end

  it 'searches for shared visualizations' do
    table = create_random_table(user)
    shared_visualization = table.table_visualization
    Carto::SharedEntity.create(
      recipient_id: other_user.id,
      recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id: shared_visualization.id,
      entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )
    vq = vqb.with_shared_with_user_id(other_user.id)
    vq.build.all.map(&:id).should include(shared_visualization.id)
  end

  describe 'sharing with organization' do
    it 'lists all visualizations shared with the org' do
      table = create_random_table(organization.owner)
      shared_visualization = table.table_visualization
      Carto::SharedEntity.create(
        recipient_id: organization.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_ORGANIZATION,
        entity_id: shared_visualization.id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      vqb = Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(organization_user.id).build
      expect(vqb.count).to eq 1
      expect(vqb.all.map(&:id)).to eq [shared_visualization.id]
    end

    it 'lists all visualizations shared with a group' do
      @group = create(:carto_group, organization: organization)
      @group.add_user(organization_user.username)

      table = create_random_table(organization.owner)
      shared_visualization = table.table_visualization
      org_shared_entity = Carto::SharedEntity.create(
        recipient_id: @group.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_GROUP,
        entity_id: shared_visualization.id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      vqb = Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(organization_user.id).build
      expect(vqb.count).to eq 1
      expect(vqb.all.map(&:id)).to eq [shared_visualization.id]

      org_shared_entity.destroy
      @group.destroy
    end

    it 'lists visualizations once when they are shared with user and org' do
      # https://github.com/CartoDB/support/issues/1451
      # The problem is that the JOINs can make a visualization appear multiple times, so when AR
      # interprets the result, it gives less results than expected.
      table = create_random_table(organization.owner)
      shared_visualization = table.table_visualization
      Carto::SharedEntity.create(
        recipient_id: organization_user.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id: shared_visualization.id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      Carto::SharedEntity.create(
        recipient_id: organization.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_ORGANIZATION,
        entity_id: shared_visualization.id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      vqb = Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(organization_user.id).build
      expect(vqb.count).to eq 1
      expect(vqb.all.map(&:id)).to eq [shared_visualization.id]
    end
  end

  it 'orders using different criteria' do

    table1 = create_random_table(user)
    table2 = create_random_table(user)
    table3 = create_random_table(user)

    # Searches only using query builder itself
    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order(:updated_at, :desc).build.all.map(&:id)
    ids.should == [ table3.table_visualization.id, table2.table_visualization.id, table1.table_visualization.id ]

    # From here on, uses OffdatabaseQueryAdapter

    # Likes
    table1.table_visualization.likes.create!(actor: user.id)
    table1.table_visualization.likes.create!(actor: other_user.id)
    table3.table_visualization.likes.create!(actor: user.id)

    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL)
              .with_order('likes', :desc)
              .build
              .all.map(&:id)

    ids.should == [ table1.table_visualization.id, table3.table_visualization.id, table2.table_visualization.id ]

    vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('likes', :desc).build.count.should == 3

    # Check with limit
    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('likes', :desc).build.limit(2).all.map(&:id)
    ids.should == [ table1.table_visualization.id, table3.table_visualization.id ]

    # Check with limit AND offset
    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('likes', :desc).build
              .offset(1).limit(2).all.map(&:id)
    ids.should == [ table3.table_visualization.id, table2.table_visualization.id ]

    # Mapviews

    # visualization.mapviews -> visualization.stats -> CartoDB::Visualization::Stats ->
    #   CartoDB::Stats::APICalls.get_api_calls_with_dates
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(user.username, {stat_tag: table1.table_visualization.id})
                            .returns({ "2015-04-15" => 1, "2015-04-14" => 0 })
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(user.username, {stat_tag: table2.table_visualization.id})
                            .returns({ "2015-04-15" => 333, "2015-04-14" => 666 })
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(user.username, {stat_tag: table3.table_visualization.id})
                            .returns({ "2015-04-15" => 12, "2015-04-14" => 20 })

    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('mapviews', :desc).build.all.map(&:id)
    ids.should == [table2.table_visualization.id, table3.table_visualization.id, table1.table_visualization.id]

    # Size

    mocked_vis1 = Carto::Visualization.where(id: table1.table_visualization.id).first
    mocked_vis2 = Carto::Visualization.where(id: table2.table_visualization.id).first
    mocked_vis3 = Carto::Visualization.where(id: table3.table_visualization.id).first

    mocked_vis1.stubs(:size).returns(200)
    mocked_vis2.stubs(:size).returns(1)
    mocked_vis3.stubs(:size).returns(600)

    # Careful to not do anything else on this spec after this size assertions
    Carto::Visualization::ActiveRecord_Relation.any_instance.stubs(:all).returns(
      [mocked_vis3, mocked_vis1, mocked_vis2]
    )

    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('size', :desc).build.map(&:id)
    ids.should == [table3.table_visualization.id, table1.table_visualization.id, table2.table_visualization.id]

    # NOTE: Not testing with multiple order criteria as currently the editor doesn't supports it so is not needed
  end

  it 'filters remote tables with syncs' do

    bypass_named_maps

    table = create_random_table(user)

    remote_vis_1 = CartoDB::Visualization::Member.new({
          user_id: user.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: user.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    remote_vis_2 = CartoDB::Visualization::Member.new({
          user_id: user.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: user.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    remote_vis_3 = CartoDB::Visualization::Member.new({
          user_id: user.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: user.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    external_source_1 = Carto::ExternalSource.new({
      visualization_id: remote_vis_1.id,
      import_url: 'http://test.fake',
      rows_counted: 2,
      size: 12345,
      username: user.username,
      })
    external_source_1.save

    external_source_2 = Carto::ExternalSource.new({
      visualization_id: remote_vis_2.id,
      import_url: 'http://test2.fake',
      rows_counted: 4,
      size: 123456,
      username: user.username,
      })
    external_source_2.save

    external_source_3 = Carto::ExternalSource.new({
      visualization_id: remote_vis_3.id,
      import_url: 'http://test3.fake',
      rows_counted: 6,
      size: 9999,
      username: user.username,
      })
    external_source_3.save

    # Trick: reusing same data import for all 3 external
    data_import_1 = DataImport.create({
      user_id:                user.id,
      })

    # Old external data imports don't hide anything

    Carto::ExternalDataImport.new(data_import_id: data_import_1.id,
                                  external_source_id: external_source_1.id).save
    Carto::ExternalDataImport.new(data_import_id: data_import_1.id,
                                  external_source_id: external_source_2.id).save
    Carto::ExternalDataImport.new(data_import_id: data_import_1.id,
                                  external_source_id: external_source_3.id).save

    ids = vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_3.id, remote_vis_2.id, remote_vis_1.id ]

    # But new ones that have a sync should hide

    sync_1 = CartoDB::Synchronization::Member.new({
      }).store
    Carto::ExternalDataImport.new(data_import_id: data_import_1.id,
                                  external_source_id: external_source_2.id,
                                  synchronization_id: sync_1.id).save

    ids = vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_3.id, remote_vis_1.id ]

    sync_2 = CartoDB::Synchronization::Member.new({
      }).store
    Carto::ExternalDataImport.new(data_import_id: data_import_1.id,
                                  external_source_id: external_source_3.id,
                                  synchronization_id: sync_2.id).save

    ids = vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_1.id ]

    # as there are constraints, deleting the sync should remove the external data import
    sync_1.delete

    ids = vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_2.id, remote_vis_1.id ]

    # Searching for multiple types should not hide or show more/less remote tables, neither break search
    ids = vqb.with_types([ Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_REMOTE ])
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_2.id, remote_vis_1.id, table.table_visualization.id]

    Carto::ExternalDataImport.all.each { |edi| edi.destroy } # Clean up to avoid foreign key not null violation
  end

  it 'filters raster tables' do
    bypass_named_maps

    table = create_random_table(user)
    table_visualization = table.table_visualization
    table_visualization.store

    raster_table = create_random_table(user)
    raster_table_visualization = raster_table.table_visualization
    raster_table_visualization.kind = CartoDB::Visualization::Member::KIND_RASTER
    raster_table_visualization.store

    visualizations = vqb.without_raster.build

    visualizations.map(&:id).should include table_visualization.id
    visualizations.map(&:id).should_not include raster_table_visualization.id
  end

  it 'will not accept nil id or name' do
    expect { vqb.with_id_or_name(nil) }.to raise_error
  end

  it 'paginates correctly when ordering by size' do
    table1 = create_random_table(user)
    table2 = create_random_table(user)
    table3 = create_random_table(user)

    mocked_vis1 = Carto::Visualization.where(id: table1.table_visualization.id).first
    mocked_vis2 = Carto::Visualization.where(id: table2.table_visualization.id).first
    mocked_vis3 = Carto::Visualization.where(id: table3.table_visualization.id).first

    mocked_vis1.stubs(:size).returns(200)
    mocked_vis2.stubs(:size).returns(1)
    mocked_vis3.stubs(:size).returns(600)

    # Careful to not do anything else on this spec after this size assertions
    Carto::Visualization::ActiveRecord_Relation.any_instance.stubs(:all).returns(
      [mocked_vis3, mocked_vis1, mocked_vis2]
    )

    page = 2
    per_page = 1
    ids = vqb.with_type(Carto::Visualization::TYPE_CANONICAL).with_order('size', :desc)
              .build_paged(page, per_page).map(&:id)

    ids.should == [table1.table_visualization.id]
  end

  describe '#with_published' do
    it 'selects public v2' do
      map, table, table_visualization, visualization = create_full_visualization(user, visualization_attributes: { version: 2, privacy: Carto::Visualization::PRIVACY_PUBLIC })

      visualizations = vqb.with_published.build
      visualization.published?.should be true
      visualizations.map(&:id).should include visualization.id

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'selects nil version maps' do
      map, table, table_visualization, visualization = create_full_visualization(user, visualization_attributes: { version: nil, privacy: Carto::Visualization::PRIVACY_PUBLIC })

      visualization.update_column(:version, nil)

      visualizations = vqb.with_published.build
      visualization.published?.should be true
      visualizations.map(&:id).should include visualization.id

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'selects public v3 datasets' do
      map, table, table_visualization, visualization = create_full_visualization(user, visualization_attributes: { version: 3, privacy: Carto::Visualization::PRIVACY_PUBLIC, type: Carto::Visualization::TYPE_CANONICAL })

      visualizations = vqb.with_published.build
      visualization.published?.should be true
      visualizations.map(&:id).should include visualization.id

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'does not select private v2 maps' do
      user.stubs(:private_maps_enabled?).returns(true)
      map, table, table_visualization, visualization = create_full_visualization(user, visualization_attributes: { version: 2, privacy: Carto::Visualization::PRIVACY_PRIVATE })

      visualizations = vqb.with_published.build
      visualization.published?.should be false
      visualizations.map(&:id).should_not include visualization.id

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'selects v3 mapcapped mapcapped' do
      map, table, table_visualization, visualization = create_full_visualization(user, visualization_attributes: { version: 3 })

      visualizations = vqb.with_published.build
      visualization.published?.should be false
      visualizations.map(&:id).should_not include visualization.id

      Carto::Mapcap.create!(visualization_id: visualization.id)
      visualizations = vqb.with_published.build
      visualization.published?.should be true
      visualizations.map(&:id).should include visualization.id

      destroy_full_visualization(map, table, table_visualization, visualization)
    end
  end

  describe 'user visualizations helpers' do
    let(:user) { create(:carto_user, private_maps_enabled: true) }

    before do
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_DERIVED,
                                               privacy: Carto::Visualization::PRIVACY_PUBLIC)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_KUVIZ,
                                               privacy: Carto::Visualization::PRIVACY_PUBLIC)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_APP,
                                               privacy: Carto::Visualization::PRIVACY_PUBLIC)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_CANONICAL,
                                               privacy: Carto::Visualization::PRIVACY_PRIVATE)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_DERIVED,
                                               privacy: Carto::Visualization::PRIVACY_PRIVATE)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_DERIVED,
                                               privacy: Carto::Visualization::PRIVACY_LINK)
      create(:carto_visualization, user_id: user.id, type: Carto::Visualization::TYPE_DERIVED,
                                               privacy: Carto::Visualization::PRIVACY_PROTECTED, password: 'x')
    end

    it 'returns the private maps of a user' do
      result = Carto::VisualizationQueryBuilder.user_private_privacy_visualizations(user).build

      expect(result.count).to eq 1
      expect(result.first.privacy).to eq Carto::Visualization::PRIVACY_PRIVATE
    end

    it 'returns the public maps of a user' do
      result = Carto::VisualizationQueryBuilder.user_public_privacy_visualizations(user).build

      expect(result.count).to eq 2
      expect(result.all.map(&:privacy).uniq).to eq [Carto::Visualization::PRIVACY_PUBLIC]
    end

    it 'returns the link maps of a user' do
      result = Carto::VisualizationQueryBuilder.user_link_privacy_visualizations(user).build

      expect(result.count).to eq 1
      expect(result.first.privacy).to eq Carto::Visualization::PRIVACY_LINK
    end

    it 'returns the password maps of a user' do
      result = Carto::VisualizationQueryBuilder.user_password_privacy_visualizations(user).build

      expect(result.count).to eq 1
      expect(result.first.privacy).to eq Carto::Visualization::PRIVACY_PROTECTED
    end

    it 'returns all the user maps' do
      result = Carto::VisualizationQueryBuilder.user_all_visualizations(user).build

      expect(result.count).to eq 5
    end
  end
end
