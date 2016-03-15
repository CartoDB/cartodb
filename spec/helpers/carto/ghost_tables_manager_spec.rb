# encoding utf-8

require_relative '../../spec_helper_min.rb'

module Carto
  describe 'GhostTablesManager' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)

      @ghost_tables_manager = Carto::GhostTablesManager.new(@user.id)
    end

    after(:all) do
      @user.destroy
    end

    it 'should be consistent when no new/renamed/dropped tables' do
      @ghost_tables_manager.consistent?.should be true
    end

    it 'should be inconsistent when renamed/dropped tables' do
      @ghost_tables_manager.stubs(:stale_tables).returns [id: 3, name: 'ManoloEscobar']

      @ghost_tables_manager.consistent?.should be false
    end

    it 'should be inconsistent when new tables' do
      @ghost_tables_manager.stubs(:non_linked_tables).returns [id: 5, name: 'ManoloEscobar']

      @ghost_tables_manager.consistent?.should be false
    end

    it 'should relink renamed tables' do
      @ghost_tables_manager.stubs(:all_tables).returns [{ id: 1, name: 'ManoloEscobar' }]
      @ghost_tables_manager.stubs(:non_linked_tables).returns [{ id: 1, name: 'ManoloEscobar' }]

      table = Table.new

      vis = ::Visualization::Member.new(privacy: 'private',
                                        name: '_escobar',
                                        user_id: UUIDTools::UUID.timestamp_create.to_s,
                                        type: 'carto')

      vis.stubs(:store)
      @ghost_tables_manager.stubs(:fetch_table_for_user_table).returns table
      table.stubs(:table_visualization).returns vis

      vis.expects(:name=).with('ManoloEscobar').once

      @ghost_tables_manager.link
    end

    it 'should link new tables' do
      @ghost_tables_manager.stubs(:all_tables).returns [{ id: 1, name: 'ManoloEscobar' }, { id: 2, name: '_escobar' }]
      @ghost_tables_manager.stubs(:non_linked_tables)
                           .returns [{ id: 1, name: 'ManoloEscobar' }, { id: 2, name: '_escobar' }]

      Table.any_instance.expects(:name=).with('ManoloEscobar').once
      Table.any_instance.expects(:name=).with('_escobar').once
      ::Visualization::Member.any_instance.expects(:name=).never

      @ghost_tables_manager.link
    end

    it 'should unlink dropped tables' do
      @ghost_tables_manager.stubs(:stale_tables).returns [{ id: 1, name: 'ManoloEscobar' }, { id: 2, name: '_escobar' }]
      @ghost_tables_manager.stubs(:fetch_table_for_user_table).with(1).returns Table.new
      @ghost_tables_manager.stubs(:fetch_table_for_user_table).with(2).returns Table.new

      Table.any_instance.expects(:destroy).twice

      @ghost_tables_manager.link
    end
  end
end
