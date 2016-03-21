# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require_relative '../../spec_helper'
require 'helpers/random_names_helper'

describe CartoDB::TableRelator do
  include RandomNamesHelper
  describe '.rows_and_size' do
    before(:all) do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

      @user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @user.destroy
    end

    before do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    end

    it 'checks row_count_and_size relator method' do
      @user.in_database { |database| @db = database }

      table_name = random_name('table')

      table = create_table({
                               user_id: @user.id,
                               name: table_name
                           })

      expected_data = { size: 16384, row_count: 0}
      table.row_count_and_size.should eq expected_data

      @db.drop_table?(table_name)
    end
  end

  describe '.serialize_dependent_visualizations' do
    before :each do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      table = mock('Table')
      table.stubs(:id).returns(2)
      @affected_vis_records = [
        { id: 1, name: '1st', updated_at: Time.now },
        { id: 2, name: '2nd', updated_at: Time.now },
        { id: 3, name: '3rd', updated_at: Time.now },
      ]
      vis_mock = mock('DB Visualizations')
      records = mock('records')
      records.stubs(:to_a).returns(@affected_vis_records)
      vis_mock.stubs(:with_sql).returns(records)
      db = { visualizations: vis_mock }
      @table_relator = CartoDB::TableRelator.new(db, table)
    end

    describe 'given there are no dependent visualizations' do
      before :each do
        @dependents = @table_relator.serialize_dependent_visualizations
      end

      it 'should return an empty list' do
        @dependents.should eq []
      end
    end

    describe 'given there are at least one dependent visualization' do
      before :each do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

        CartoDB::Visualization::Member.any_instance.stubs(:dependent?).returns(true, false, true)
        @dependents = @table_relator.serialize_dependent_visualizations
      end

      it 'should return a list with dependent visualizations' do
        @dependents.size.should eq 2
      end

      it 'should contain expected datapoints required for dashboard' do
        @dependents[0][:id].should eq '1'
        @dependents[0][:name].should eq '1st'
        @dependents[0][:updated_at].should eq @affected_vis_records[0][:updated_at]

        @dependents[1][:id].should eq '3'
        @dependents[1][:name].should eq '3rd'
        @dependents[1][:updated_at].should eq @affected_vis_records[2][:updated_at]
      end
    end
  end

  describe '.serialize_non_dependent_visualizations' do
    before :each do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      table = mock('Table')
      table.stubs(:id).returns(2)
      @affected_vis_records = [
        { id: 1, name: '1st', updated_at: Time.now },
        { id: 2, name: '2nd', updated_at: Time.now },
        { id: 3, name: '3rd', updated_at: Time.now },
      ]

      vis_mock = mock('DB Visualizations')
      records = mock('records')
      records.stubs(:to_a).returns(@affected_vis_records)
      vis_mock.stubs(:with_sql).returns(records)
      db = { visualizations: vis_mock }
      @table_relator = CartoDB::TableRelator.new(db, table)
    end

    describe 'given there are no dependent visualizations' do
      before :each do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

        @non_dependents = @table_relator.serialize_non_dependent_visualizations
      end

      it 'should return an empty list' do
        @non_dependents.should eq []
      end
    end

    describe 'given there are at least one non_dependent visualization' do
      before :each do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

        CartoDB::Visualization::Member.any_instance.stubs(:non_dependent?).returns(true, false, false)
        @non_dependents = @table_relator.serialize_non_dependent_visualizations
      end

      it 'should return a list with dependent visualizations' do
        @non_dependents.size.should eq 1
      end

      it 'should contain expected datapoints required for dashboard' do
        @non_dependents[0][:id].should eq '1'
        @non_dependents[0][:name].should eq '1st'
        @non_dependents[0][:updated_at].should eq @affected_vis_records[0][:updated_at]
      end
    end
  end
end
