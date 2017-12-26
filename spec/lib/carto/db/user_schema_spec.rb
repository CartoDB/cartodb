# encoding: utf-8

require_relative '../../../spec_helper_min.rb'
require 'carto/db/user_schema'

module Carto
  module Db
    describe UserSchema do
      before(:all) do
        @user = ::User[FactoryGirl.create(:carto_user).id]

        @user_schema = Carto::Db::UserSchema.new(@user)
      end

      before(:each) do
        bypass_named_maps
      end

      after(:all) do
        @user.destroy
      end

      def run_in_user_database(query)
        @user.in_database.run(query)
      end

      describe '#table_names' do
        it 'Regression for CDB-3446' do
          new_name = 'table_'
          run_in_user_database(%{
            CREATE TABLE #{new_name} ("description" text);
          })

          @user_schema.table_names.should include(new_name)
        end

        it 'should find unused names' do
          run_in_user_database(%{
            CREATE TABLE table_m_nolo_es_co_bar_   ("description" text);
            CREATE TABLE table_m_nolo_es_co_bar_1 ("description" text);
            CREATE TABLE table_m_nolo_es_co_bar_3 ("description" text);
          })

          table_names = @user_schema.table_names
          table_names.should include('table_m_nolo_es_co_bar_')
          table_names.should include('table_m_nolo_es_co_bar_1')
          table_names.should include('table_m_nolo_es_co_bar_3')
        end
      end
    end
  end
end
