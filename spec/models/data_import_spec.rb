require 'spec_helper'

describe DataImport do
  before(:each) do
    User.all.each(&:destroy)
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @table = create_table :user_id => @user.id
  end

  it 'should allow to append data to an existing table' do
    expect do
      DataImport.create(
        :user_id       => @user.id,
        :table_id      => @table.id,
        :data_source   => '/../db/fake_data/column_string_to_boolean.csv',
        :updated_at    => Time.now,
        :append        => true )
    end.to change{@table.reload.records[:total_rows]}.by(11)
  end

  it 'should allow to duplicate an existing table' do
    data_import = DataImport.create(
      :user_id       => @user.id,
      :table_name    => 'duplicated_table',
      :updated_at    => Time.now,
      :table_copy    => @table.name )
    duplicated_table = Table[data_import.table_id]
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'duplicated_table'
  end

  it 'should allow to create a table from a query' do
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => '/../db/fake_data/clubbing.csv',
      :updated_at    => Time.now )

    data_import = DataImport.create(
      :user_id       => @user.id,
      :table_name    => 'from_query',
      :updated_at    => Time.now,
      :from_query    => "SELECT * FROM #{data_import.table_name} LIMIT 5" )
    data_import.state.should be == 'complete'

    duplicated_table = Table[data_import.table_id]
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'from_query'
    duplicated_table.records[:rows].should have(5).items
  end

  it 'should allow to create a table from a url' do
    data_import = nil
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      data_import = DataImport.create(
        :user_id       => @user.id,
        :data_source   => url,
        :updated_at    => Time.now )
    end

    table = Table[data_import.table_id]
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.records[:rows].should have(10).items
  end

  it 'should allow to create a table from a url with params' do
    data_import = nil
    serve_file Rails.root.join('db/fake_data/clubbing.csv?param=wadus') do |url|
      data_import = DataImport.create(
        :user_id       => @user.id,
        :data_source   => url,
        :updated_at    => Time.now )
    end

    table = Table[data_import.table_id]
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.records[:rows].should have(10).items
  end

  it 'should allow to reimport a previously exported as sql table' do
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => '/../db/fake_data/clubbing.csv',
      :updated_at    => Time.now )

    table = Table.filter(:name => 'clubbing').first
    table.records.count.should be == 4

    file = File.new(Rails.root.join('tmp/clubbing.sql.zip', ), 'w+')
    file.write table.to_sql
    file.close

    table.destroy

    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => '/../tmp/clubbing.sql.zip',
      :updated_at    => Time.now )

    File.delete(file.path)

    table = Table.filter(:name => 'clubbing').first
    table.records.count.should be == 4
  end

  it "don't touch created_at/updated_at fields if already present in the imported file" do
    DataImport.create(
      :user_id       => @user.id,
      :data_source   => '/../db/fake_data/created_at_update_at_fields_present.csv',
      :updated_at    => Time.now )

    table = Table.all.last

    table.records[:rows].first[:created_at].to_s.should == Time.at(1351698386234 / 1000).to_s
    table.records[:rows].first[:updated_at].to_s.should == Time.at(1351698386234 / 1000).to_s
    table.records[:rows].last[:created_at].to_s.should  == Time.at(1351698390354 / 1000).to_s
    table.records[:rows].last[:updated_at].to_s.should  == Time.at(1351698390354 / 1000).to_s

  end
end
