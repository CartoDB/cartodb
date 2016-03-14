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
      @ghost_tables_manager.stubs(:stale_tables).returns [id: 3, name: 'manolo']

      @ghost_tables_manager.consistent?.should be false
    end

    it 'should be inconsistent when new tables' do
      @ghost_tables_manager.stubs(:non_linked_tables).returns [id: 5, name: 'manolo']

      @ghost_tables_manager.consistent?.should be false
    end

    it 'should relink renamed tables' do
      @ghost_tables_manager.stubs(:non_linked_tables).returns [{ id: 1, name: 'manolo' }]
      @ghost_tables_manager.stubs(:fetch_table_for_user_table)
                           .returns ::UserTable.new(user_id: @user.id, name: 'manolo')

      Table.any_instance.expects(:name=).with('manolo').never
      ::Visualization.any_instance.expects(:name=).with('manolo').once

      @ghost_tables_manager.link
    end

    it 'should link new tables' do
      @ghost_tables_manager.stubs(:all_tables).returns [{ id: 1, name: 'manolo' }, { id: 2, name: 'escobar' }]
      @ghost_tables_manager.stubs(:non_linked_tables).returns [{ id: 1, name: 'manolo' }, { id: 2, name: 'escobar' }]

      Table.any_instance.expects(:name=).with('manolo').once
      Table.any_instance.expects(:name=).with('escobar').once
      ::Visualization.any_instance.expects(:name=).never

      @ghost_tables_manager.link
    end
  end
end
