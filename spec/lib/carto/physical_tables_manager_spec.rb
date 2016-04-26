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

    describe '#propose_valid_name_table_name' do
      it 'should sanitize name' do
        valid_name = @physical_tables_manager.propose_valid_name_table_name("Mªnolo !Es'co`bar##!")

        valid_name.should eq 'm_nolo__es_co_bar___'
      end

      it 'should remove disallowed starting characters' do
        valid_name = @physical_tables_manager.propose_valid_name_table_name("____Mªnolo !Es'co`bar##!")

        valid_name.should eq 'm_nolo__es_co_bar___'
      end

      it 'should find unused names' do
        run_in_user_database(%{
            CREATE TABLE m_nolo__es_co_bar___   ("description" text);
            CREATE TABLE m_nolo__es_co_bar____1 ("description" text);
            CREATE TABLE m_nolo__es_co_bar____3 ("description" text);
        })

        valid_name = @physical_tables_manager.propose_valid_name_table_name("____Mªnolo !Es'co`bar##!")

        valid_name.should eq 'm_nolo__es_co_bar____2'
      end
    end
  end
end
