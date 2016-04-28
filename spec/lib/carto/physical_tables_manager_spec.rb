# encoding utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/physical_tables_manager.rb'

module Carto
  describe PhysicalTablesManager do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)

      @physical_tables_manager = Carto::PhysicalTablesManager.new(@user.id)
    end

    before(:each) do
      bypass_named_maps
    end

    after(:all) do
      ::User[@user.id].destroy
    end

    def run_in_user_database(query)
      ::User[@user.id].in_database.run(query)
    end

    describe '#propose_valid_table_name' do
      it 'should sanitize name' do
        valid_name = @physical_tables_manager.propose_valid_table_name(contendent: "Mªnolo !Es'co`bar##!")

        valid_name.should eq 'm_nolo_es_co_bar_'
      end

      it 'should remove disallowed starting characters' do
        valid_name = @physical_tables_manager.propose_valid_table_name(contendent: "____Mªnolo !Es'co`bar##!")

        valid_name.should eq 'table_m_nolo_es_co_bar_'
      end

      it 'should find unused names' do
        run_in_user_database(%{
            CREATE TABLE table_m_nolo_es_co_bar_   ("description" text);
            CREATE TABLE table_m_nolo_es_co_bar_1 ("description" text);
            CREATE TABLE table_m_nolo_es_co_bar_3 ("description" text);
        })

        valid_name = @physical_tables_manager.propose_valid_table_name(contendent: "____Mªnolo !Es'co`bar##!")

        valid_name.should eq 'table_m_nolo_es_co_bar_2'
      end

      it 'should propose valid names when no contendent is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when nil contendent is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name(contendent: nil)

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when empty contendent is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name(contendent: '')

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when no schema is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when nil schema is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name(schema: nil)

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when empty schema is specified' do
        valid_name = @physical_tables_manager.propose_valid_table_name(schema: '')

        valid_name.should eq 'untitled_table'
      end
    end
  end
end
