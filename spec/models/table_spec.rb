# coding: UTF-8

# NOTE that these tests are very sensitive to precisce versions of GDAL (1.9.0)
# 747 # Table post import processing tests should add a point the_geom column after importing a CSV
# 1210 # Table merging two+ tables should import and then export file twitters.csv
# 1235 # Table merging two+ tables should import and then export file SHP1.zip
# 1256 # Table merging two+ tables should import and then export file SHP1.zip as kml
# 1275 # Table merging two+ tables should import and then export file SHP1.zip as sql

require_relative '../spec_helper'
def check_schema(table, expected_schema, options={})
  table_schema = table.schema(:cartodb_types => options[:cartodb_types] || false)
  schema_differences = (expected_schema - table_schema) + (table_schema - expected_schema)
  schema_differences.should be_empty, "difference: #{schema_differences.inspect}"
end

def create_import(user, file_name, name=nil)
  @data_import  = DataImport.create(
    user_id:      @user.id,
    data_source:  file_name,
    table_name:   name
  )
  def @data_import.data_source=(filepath)
    self.values[:data_type] = 'file'
    self.values[:data_source] = filepath
  end

  @data_import.data_source =  file_name
  @data_import.send :new_importer
  @data_import
end

describe Table do
  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    puts "\n[rspec][table_spec] Creating test user database..."
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
    puts "[rspec][table_spec] Running..."
  end
  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)

    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

    CartoDB::Overlay::Member.any_instance.stubs(:can_store).returns(true)
  end

  after(:all) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    @user.destroy
  end


  context "table setups" do
    it "should set a default name different than the previous" do
      table = UserTable.new
      table.user_id = @user.id
      table.save.reload
      table.name.should == "untitled_table"

      table2 = UserTable.new
      table2.user_id = @user.id
      table2.save.reload
      table2.name.should == "untitled_table_1"
    end

    it 'is renames "layergroup" to "layergroup_t"' do
      table         = UserTable.new
      table.user_id = @user.id
      table.name    = 'layergroup'
      table.valid?.should == true
    end

    it 'renames "all" to "all_t"' do
      table         = UserTable.new
      table.user_id = @user.id
      table.name    = 'all'
      table.name.should eq 'all_t'
      table.valid?.should == true
    end

    it "should set a table_id value" do
      table = create_table(name: 'this_is_a_table', user_id: @user.id)
      table.user_table.table_id.should be_a(Integer)
    end

    it "should return nil on get_table_id when the physical table doesn't exist" do
      table = create_table(name: 'this_is_a_table', user_id: @user.id)
      @user.in_database.drop_table table.user_table.name
      table.get_table_id.should be_nil
    end

    it "should not allow to create tables using system names" do
      table = create_table(name: "cdb_tablemetadata", user_id: @user.id)
      table.user_table.name.should == "cdb_tablemetadata_1"
    end

    it 'propagates name changes to table visualization' do
      table = create_table(name: 'bogus_name', user_id: @user.id)
      table.table_visualization.name.should == table.user_table.name

      table.user_table.name = 'bogus_name_1'
      table.user_table.save

      table.user_table.reload
      table.user_table.name           .should == 'bogus_name_1'
      table.table_visualization.name  .should == table.user_table.name

      table.user_table.name = 'viva la pepa'
      table.user_table.save

      table.user_table.reload
      table.user_table.name           .should == 'viva_la_pepa'
      table.table_visualization.name  .should == table.user_table.name

      table.user_table.name = '     viva el pepe     '
      table.user_table.save

      table.user_table.reload
      table.user_table.name           .should == 'viva_el_pepe'
      table.table_visualization.name  .should == table.user_table.name
    end

    it 'receives a name change if table visualization name changed' do
      table = create_table(name: 'bogus_name', user_id: @user.id)
      table.table_visualization.name.should == table.user_table.name

      table.table_visualization.name = 'bogus_name_2'
      table.table_visualization.store

      table.user_table.reload
      table.table_visualization.name.should == 'bogus_name_2'
      table.user_table.name.should == 'bogus_name_2'
      table.user_table.name.should == table.table_visualization.name

      visualization_id = table.table_visualization.id
      visualization = CartoDB::Visualization::Member.new(id: visualization_id)
        .fetch
      visualization.name = 'bogus name 3'
      visualization.store 
      table.user_table.reload
      table.user_table.name.should == 'bogus_name_3'

      visualization = CartoDB::Visualization::Member.new(id: visualization.id)
        .fetch
      visualization.name.should == 'bogus_name_3'
      table.user_table.reload
      table.user_table.name.should == 'bogus_name_3'
    end
    
    it 'propagates name changes to affected layers' do
      table = create_table(name: 'bogus_name', user_id: @user.id)
      layer = table.user_table.layers.first

      table.user_table.name = 'bogus_name_1'
      table.user_table.save

      table.user_table.reload
      layer.reload
      layer.options.fetch('table_name').should == table.user_table.name
    end

    it "should create default associated map and layers" do
      visualizations = CartoDB::Visualization::Collection.new.fetch.to_a.length
      table = create_table(name: "epaminondas_pantulis", user_id: @user.id)
      CartoDB::Visualization::Collection.new.fetch.to_a.length.should == visualizations + 1

      table.user_table.map.should be_an_instance_of(Map)
      table.user_table.map.values.slice(:zoom, :bounding_box_sw, :bounding_box_ne, :provider).should == { zoom: 3, bounding_box_sw: "[0, 0]", bounding_box_ne: "[0, 0]", provider: 'leaflet'}
      table.user_table.map.layers.count.should == 2
      table.user_table.map.layers.map(&:kind).should == ['tiled', 'carto']
      table.user_table.map.data_layers.first.infowindow["fields"].should == []
      table.user_table.map.data_layers.first.options["table_name"].should == "epaminondas_pantulis"
    end

    it "should return a sequel interface" do
      table = create_table :user_id => @user.id
      table.sequel.class.should == Sequel::Postgres::Dataset
    end

    it "should have a privacy associated and it should be private by default" do
      table = create_table :user_id => @user.id
      table.user_table.should be_private
    end

    it 'changes to and from public-with-link privacy' do
      table = create_table :user_id => @user.id

      table.user_table.privacy = UserTable::PRIVACY_LINK
      table.user_table.save
      table.user_table.reload
      table.user_table.should be_public_with_link_only
      table.table_visualization.should be_public_with_link

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save
      table.user_table.reload
      table.user_table                .should be_public
      table.table_visualization       .should be_public
    end

    it 'propagates privacy changes to the associated visualization' do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      table = create_table(user_id: @user.id)
      table.should be_private
      table.table_visualization.should be_private

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save
      table.reload
      table                           .should be_public
      table.table_visualization       .should be_public

      rehydrated = UserTable.where(id: table.id).first
      rehydrated                      .should be_public
      rehydrated.table_visualization  .should be_public

      table.user_table.privacy = UserTable::PRIVACY_PRIVATE
      table.user_table.save
      table.reload
      table                           .should be_private
      table.table_visualization       .should be_private

      rehydrated = UserTable.where(id: table.id).first
      rehydrated                      .should be_private
      rehydrated.table_visualization  .should be_private
    end

    it 'propagates changes to affected visualizations if privacy set to PRIVATE' do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      table = create_table(user_id: @user.id)
      table.user_table.should be_private
      table.table_visualization.should be_private
      derived_vis = CartoDB::Visualization::Copier.new(
        @user, table.table_visualization
      ).copy

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:create).returns(true)
      derived_vis.store
      table.user_table.reload

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save

      table.affected_visualizations.map { |vis|
        vis.public?.should == vis.table?
      }

      table.user_table.privacy = UserTable::PRIVACY_PRIVATE
      table.user_table.save

      table.affected_visualizations.map { |vis|
        vis.private?.should == true
      }
    end

    it "doesn't propagates changes to affected visualizations if privacy set to public with link" do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      table = create_table(user_id: @user.id)

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save
      derived_vis = CartoDB::Visualization::Copier.new(
          @user, table.table_visualization
      ).copy

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:create).returns(true)
      derived_vis.store
      table.user_table.reload

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
      table.user_table.privacy = UserTable::PRIVACY_LINK
      table.user_table.save
      table.user_table.reload

      table.affected_visualizations.map { |vis|
        vis.public?.should == vis.derived?  # Derived kept public
        vis.private?.should == false  # None changed to private
        vis.password_protected?.should == false  # None changed to password protected
        vis.public_with_link?.should == vis.table?  # Table/canonical changed
      }
    end

    it 'receives privacy changes from the associated visualization' do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      table = create_table(user_id: @user.id)
      table.user_table.should be_private
      table.table_visualization.should be_private

      table.table_visualization.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
      table.table_visualization.store
      table.user_table.reload
      table.user_table                 .should be_public
      table.table_visualization       .should be_public

      rehydrated = Table.new(UserTable.where(id: table.user_table.id).first)
      rehydrated.user_table           .should be_public
      rehydrated.table_visualization  .should be_public

      table.table_visualization.privacy = CartoDB::Visualization::Member::PRIVACY_PRIVATE
      table.table_visualization.store
      table.user_table.reload
      table.user_table                .should be_private
      table.table_visualization       .should be_private

      rehydrated = Table.new(UserTable.where(id: table.user_table.id).first)
      rehydrated.user_table           .should be_private
      rehydrated.table_visualization  .should be_private
    end

    it "should be public if the creating user doesn't have the ability to make private tables" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PUBLIC
    end

    it "should be private if it's creating user has the ability to make private tables" do
      @user.private_tables_enabled = true
      @user.save
      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE
    end

    it "should be able to make private tables if the user gets the ability to do it" do
      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PUBLIC

      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE
    end

    it "should only be able to make public tables if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PUBLIC
    end

    it "should still be able to edit the private table if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.user_table.name = "my_super_test"
      table.user_table.save.should be_true
    end

    it "should be able to convert to public table if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save.should be_true
    end

    it "should not be able to convert to public table if the user has no permissions" do
      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PUBLIC

      table.user_table.privacy = UserTable::PRIVACY_PRIVATE
      expect {
        table.user_table.save
      }.to raise_error(Sequel::ValidationFailed)
    end

    it "should not be able to convert to public table if the user is stripped of " do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.privacy.should == UserTable::PRIVACY_PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save
      table.owner.reload # this is because the ORM is stupid

      table.user_table.privacy = UserTable::PRIVACY_PRIVATE
      expect {
        table.user_table.save
      }.to raise_error(Sequel::ValidationFailed)
    end

    it "should not allow public user access to a table when it is private" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.user_table.should be_private

      expect {
        @user.in_database(:as => :public_user).run("select * from #{table.user_table.name}")
      }.to raise_error(Sequel::DatabaseError)
    end

    it "should allow public user access when the table is public" do
      @user.private_tables_enabled = true
      @user.save
      table = create_table(:user_id => @user.id)

      table.user_table.should be_private

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save

      expect {
        @user.in_database(:as => :public_user).run("select * from #{table.user_table.name}")
      }.to_not raise_error
    end

    it "should be associated to a database table" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table({:name => 'Wadus table', :user_id => @user.id})

      Rails::Sequel.connection.table_exists?(table.user_table.name.to_sym).should be_false

      @user.in_database do |user_database|
        user_database.table_exists?(table.user_table.name.to_sym).should be_true
      end
    end

    it "should store the name of its database" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table(:user_id => @user.id)

      table.owner.database_name.should == @user.database_name
    end

    it "should rename a database table when the attribute name is modified" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'Wadus table', :user_id => @user.id})

      Rails::Sequel.connection.table_exists?(table.user_table.name.to_sym).should be_false
      @user.in_database do |user_database|
        user_database.table_exists?(table.user_table.name.to_sym).should be_true
      end

      table.user_table.name = 'Wadus table #23'
      table.user_table.save
      table.user_table.reload
      table.user_table.name.should == "Wadus table #23".sanitize
      @user.in_database do |user_database|
        user_database.table_exists?('wadus_table'.to_sym).should be_false
        user_database.table_exists?('wadus_table_23'.to_sym).should be_true
      end

      table.user_table.name = ''
      table.user_table.save
      table.user_table.reload
      table.user_table.name.should == "Wadus table #23".sanitize
      @user.in_database do |user_database|
        user_database.table_exists?('wadus_table_23'.to_sym).should be_true
      end
    end

    it 'converts all names to downcase' do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'Wadus table', :user_id => @user.id})
      table.user_table.name.should == 'wadus_table'

      Rails::Sequel.connection.table_exists?(table.user_table.name.to_sym).should be_false
      @user.in_database do |user_database|
        user_database.table_exists?(table.user_table.name.to_sym).should be_true
      end

      table.user_table.name = 'Wadus_table'
      table.user_table.name.should == 'wadus_table'
    end

    it "should remove varnish cache when the table is renamed" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'Wadus table', :user_id => @user.id})
      CartoDB::TablePrivacyManager.any_instance
      table.expects(:invalidate_varnish_cache)
      table.name = 'Wadus table #23'
      table.user_table.save
    end

    it "should rename the pk sequence when renaming the table" do
      table1 = new_table :name => 'table 1', :user_id => @user.id
      table1.save.reload
      table1.name.should == 'table_1'

      table1.name = 'table 2'
      table1.save.reload
      table1.name.should == 'table_2'

      table2 = new_table :name => 'table 1', :user_id => @user.id
      table2.save.reload
      table2.name.should == 'table_1'

      lambda {
        table2.destroy
      }.should_not raise_error
    end

    it "can create a table called using a reserved postgresql word as its name" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'as', :user_id => @user.id})

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end

      table.user_table.name = 'where'
      table.user_table.save
      table.reload
      @user.in_database do |user_database|
        user_database.table_exists?('where'.to_sym).should be_true
      end
    end

    it 'raises QuotaExceeded when trying to create a table while over quota' do
      pending "Deactivated until table creation paths are unified - Issue 2974"
      quota_in_bytes  = 524288000
      table_quota     = 5
      new_user        = new_user
      user            = create_user(quota_in_bytes: quota_in_bytes, table_quota: table_quota)

      5.times { |t| create_table(name: "table #{t}", user_id: user.id) }

      expect { 
        create_table(name: "table 6", user_id: user.id) 
      }.to raise_error(CartoDB::QuotaExceeded)

      user.destroy
    end
  end

  it "should remove varnish cache when updating the table privacy" do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    @user.private_tables_enabled = true
    @user.save
    table = create_table(user_id: @user.id, name: "varnish_privacy", privacy: UserTable::PRIVACY_PRIVATE)

    id = table.table_visualization.id
    CartoDB::Varnish.any_instance.expects(:purge)
      .times(3)
      .with(".*#{id}:vizjson")
      .returns(true)

    CartoDB::TablePrivacyManager.any_instance
      .expects(:propagate_to_varnish)
    table.user_table.privacy = UserTable::PRIVACY_PUBLIC
    table.user_table.save
  end

  context "when removing the table" do
    before(:all) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      @doomed_table = create_table(user_id: @user.id)
      @automatic_geocoding = FactoryGirl.create(:automatic_geocoding, table: @doomed_table.user_table)
      @doomed_table.destroy
    end

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    end

    it "should remove the automatic_geocoding" do
      expect { @automatic_geocoding.reload }.to raise_error
    end
    
    it "should remove the table from the user database" do
      expect {
        @user.in_database["select * from #{@doomed_table.name}"].all
      }.to raise_error
    end

    it "should not remove the table from the user database if specified" do
      table = create_table(user_id: @user.id)
      table.keep_user_database_table = true
      table.destroy
      @user.in_database["select * from #{table.name}"].all.should == []
    end

    it "should update denormalized counters" do
      @user.reload
      @user.tables_count.should == 0
      Tag.count.should == 0
      UserTable.count == 0
    end

    it "should remove varnish cache" do
      table = create_table(user_id: @user.id)
      table.expects(:invalidate_varnish_cache)
      table.destroy
    end

    it "should remove the metadata table even when the physical table does not exist" do
      table = create_table(user_id: @user.id)
      @user.in_database.drop_table(table.name.to_sym)

      table.destroy
      UserTable[table.id].should be_nil
    end

    it 'deletes derived visualizations that depend on this table' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:create).returns(true)
      table   = create_table(name: 'bogus_name', user_id: @user.id)
      source  = table.table_visualization
      derived = CartoDB::Visualization::Copier.new(@user, source).copy
      derived.store

      rehydrated = CartoDB::Visualization::Member.new(id: derived.id).fetch
      table.reload

      table.destroy
      expect {
        CartoDB::Visualization::Member.new(id: derived.id).fetch
      }.to raise_error KeyError
    end
  end

  context 'schema and columns' do
    it 'has a default schema' do
      table = create_table(:user_id => @user.id)
      table.reload
      table.schema(:cartodb_types => false).should be_equal_to_default_db_schema
      table.schema.should be_equal_to_default_cartodb_schema
    end

    it "can be associated to many tags" do
      delete_user_data @user
      table = create_table :user_id => @user.id, :tags => "tag 1, tag 2,tag 3, tag 3"

      Tag.count.should == 3

      tag1 = Tag[:name => 'tag 1']
      tag1.user_id.should  == @user.id
      tag1.table_id.should == table.id

      tag2 = Tag[:name => 'tag 2']
      tag2.user_id.should  == @user.id
      tag2.table_id.should == table.id

      tag3 = Tag[:name => 'tag 3']
      tag3.user_id.should  == @user.id
      tag3.table_id.should == table.id

      table.user_table.tags = "tag 1"
      table.user_table.save_changes

      Tag.count.should == 1
      tag1 = Tag[:name => 'tag 1']
      tag1.user_id.should  == @user.id
      tag1.table_id.should == table.id

      table.user_table.tags = "    "
      table.user_table.save_changes
      Tag.count.should == 0
    end

    it "can add a column of a CartoDB::TYPE type" do
      table = create_table(:user_id => @user.id)
      table.schema(:cartodb_types => false).should be_equal_to_default_db_schema

      resp = table.add_column!(:name => "my new column", :type => "number")
      resp.should == {:name => "my_new_column", :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "double precision"])
    end

    it "can modify a column using a CartoDB::TYPE type" do
      table = create_table(user_id: @user.id)

      resp = table.modify_column!(name: "name", type: "number")
      resp.should == { name: "name", type: "double precision", cartodb_type: "number" }
    end

    it "can modify a column using a CartoDB::TYPE type" do
      table = create_table(:user_id => @user.id)

      resp = table.modify_column!(:name => "name", :type => "number")
      resp.should == {:name => "name", :type => "double precision", :cartodb_type => "number"}
    end

    it "should not modify the name of a column to a number, sanitizing it to make it valid" do
      table = create_table(:user_id => @user.id)
      resp = table.modify_column!(:name => "name", :new_name => "1")
      resp.should == {:name => "_1", :type => "text", :cartodb_type => "string"}
    end

    it "can modify its schema" do
      table = create_table(user_id: @user.id)
      table.schema(cartodb_types: false).should be_equal_to_default_db_schema

      lambda {
        table.add_column!(name: "my column with bad type", type: "textttt")
      }.should raise_error(CartoDB::InvalidType)

      resp = table.add_column!(name: "my new column", type: "integer")
      resp.should == { name: 'my_new_column', type: 'integer', cartodb_type: 'number'}
      table.reload
      table.schema(cartodb_types: false).should include([:my_new_column, "integer"])

      resp = table.modify_column!(name: "my_new_column", new_name: "my new column new name", type: "text")
      resp.should == { name: 'my_new_column_new_name', type: 'text', cartodb_type: 'string' }
      table.reload
      table.schema(cartodb_types: false).should include([:my_new_column_new_name, "text"])

      resp = table.modify_column!(name: "my_new_column_new_name", new_name: "my new column")
      resp.should == { name: 'my_new_column', type: "text", cartodb_type: "string"}
      table.reload
      table.schema(cartodb_types: false).should include([:my_new_column, "text"])

      resp = table.modify_column!(:name => "my_new_column", :type => "text")
      resp.should == {:name => 'my_new_column', :type => 'text', :cartodb_type => 'string'}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

      table.drop_column!(:name => "description")
      table.reload
      table.schema(:cartodb_types => false).should_not include([:description, "text"])

      lambda {
        table.drop_column!(:name => "description")
      }.should raise_error
    end

    it "cannot modify :cartodb_id column" do
      table = create_table(:user_id => @user.id)
      original_schema = table.schema(:cartodb_types => false)

      lambda {
        table.modify_column!(:name => "cartodb_id", :new_name => "new_id", :type => "integer")
      }.should raise_error
      table.reload
      table.schema(:cartodb_types => false).should == original_schema

      lambda {
        table.modify_column!(:name => "cartodb_id", :new_name => "cartodb_id", :type => "float")
      }.should raise_error
      table.reload
      table.schema(:cartodb_types => false).should == original_schema

      lambda {
        table.drop_column!(:name => "cartodb_id")
      }.should raise_error
      table.reload
      table.schema(:cartodb_types => false).should == original_schema
    end

    it "should be able to modify it's schema with castings
    the DB engine doesn't support" do
      table = create_table(user_id: @user.id)
      table.add_column!(name: "my new column", type: "text")
      table.reload

      table.schema(:cartodb_types => false)
        .should include([:my_new_column, "text"])

      pk = table.insert_row!(name: "Text", my_new_column: "1")
      table.modify_column!(
        name:     "my_new_column",
        new_name:     "my new column new name",
        type:         "integer",
        force_value:  "NULL"
      )
      table.reload

      table.schema(cartodb_types: false)
        .should include([:my_new_column_new_name, "integer"])

      rows = table.records
      rows[:rows][0][:my_new_column_new_name].should == 1
    end

    it "can be created with a given schema if it is valid" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
      table.user_table.save
      check_schema(table, [
        [:updated_at, "timestamp with time zone"], [:created_at, "timestamp with time zone"], [:cartodb_id, "integer"],
        [:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"],
        [:kind, "character varying(10)"], [:the_geom, "geometry", "geometry", "geometry"]
      ])
    end

    it "should sanitize columns from a given schema" do
      delete_user_data @user
      table = new_table(:user_id => @user.id)
      table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
      table.user_table.save
      check_schema(table, [
        [:updated_at, "timestamp with time zone"], [:created_at, "timestamp with time zone"], [:cartodb_id, "integer"],
        [:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"],
        [:kind, "character varying(10)"], [:the_geom, "geometry", "geometry", "geometry"]
      ])
    end

    it "should alter the schema automatically to a a wide range of numbers when inserting" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.user_table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.4")
      table.rows_counted.should == 2

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    it "should alter the schema automatically to a a wide range of numbers when inserting a number with 0" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.user_table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.0")
      table.rows_counted.should == 2

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    it "should alter the schema automatically to a a wide range of numbers when updating" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.user_table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.update_row!(pk_row1, :name => 'Javi Jam', :age => "25.4")
      table.rows_counted.should == 1

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    pending "should alter the schema automatically when trying to insert a big string (greater than 200 chars)" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar(40)"
      table.user_table.save

      table.schema(:cartodb_types => false).should_not include([:name, "text"])

      pk_row1 = table.insert_row!(:name => 'f'*201)
      table.rows_counted.should == 1

      table.reload
      table.schema(:cartodb_types => false).should include([:name, "text"])
    end

    it "should not remove an existing table when the creation of a new table with default schema and the same name has raised an exception" do
      table = new_table({:name => 'table1', :user_id => @user.id})
      table.user_table.save
      pk = table.insert_row!({:name => "name #1", :description => "description #1"})

      Table.any_instance.stubs(:the_geom_type=).raises(CartoDB::InvalidGeomType)

      table = new_table({:name => 'table1', :user_id => @user.id})
      lambda {
        table.user_table.save
      }.should raise_error(CartoDB::InvalidGeomType)

      table.run_query("select name from table1 where cartodb_id = '#{pk}'")[:rows].first[:name].should == "name #1"
    end

    it "should not remove an existing table when the creation of a new table from a file with the same name has raised an exception" do
      table = new_table({:name => 'table1', :user_id => @user.id})
      table.user_table.save

      pk = table.insert_row!({:name => "name #1", :description => "description #1"})

      Table.any_instance.stubs(:schema).raises(CartoDB::QueryNotAllowed)

      data_import = DataImport.create( :user_id       => @user.id,
                                    :table_name    => 'rescol',
                                    :data_source   => '/../db/fake_data/reserved_columns.csv' )
      data_import.run_import!
      table.run_query("select name from table1 where cartodb_id = '#{pk}'")[:rows].first[:name].should == "name #1"
    end

    it "can add a column called 'action' but gets renamed" do
      column_name = "action"
      sanitized_column_name = "_action"

      table = create_table(:user_id => @user.id)

      resp = table.add_column!(:name => column_name, :type => "number")
      resp.should == {:name => sanitized_column_name, :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([sanitized_column_name.to_sym, "double precision"])
    end

    it "can have a column with a reserved psql word as its name" do
      column_name = "where"
      sanitized_column_name = "_where"

      table = create_table(:user_id => @user.id)

      resp = table.add_column!(:name => column_name, :type => "number")
      resp.should == {:name => sanitized_column_name, :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([sanitized_column_name.to_sym, "double precision"])
    end

    it 'nullifies the collumn when converting from boolean to date' do
      column_name = "new"
      sanitized_column_name = "_new"
      table = create_table(user_id: @user.id)

      table.add_column!(name: column_name, type: 'boolean')
      table.insert_row!(sanitized_column_name.to_sym => 't')
      table.modify_column!(name: sanitized_column_name, type: 'date')
      
      table.records[:rows][0][sanitized_column_name.to_sym].should be_nil

      table = create_table(user_id: @user.id)
      table.add_column!(name: sanitized_column_name, type: 'boolean')
      table.insert_row!(sanitized_column_name.to_sym => 'f')
      table.modify_column!(name: sanitized_column_name, type: 'date')
      
      table.records[:rows][0][sanitized_column_name.to_sym].should be_nil
    end

    it 'nullifies the collumn when converting from number to date' do
      table = create_table(user_id: @user.id)
      table.add_column!(name: 'numeric_col', type: 'double precision')
      table.insert_row!(numeric_col: 12345.67)
      table.modify_column!(name: 'numeric_col', type: 'date')
      
      table.records[:rows][0][:numeric_col].should be_nil

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'numeric_col', type: 'double precision')
      table.insert_row!(numeric_col: 12345)
      table.modify_column!(name: 'numeric_col', type: 'date')
      
      table.records[:rows][0][:numeric_col].should be_nil
    end

    it 'normalizes digit separators when converting from string to number' do
      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '1.234,56')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 1234.56

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '123.456,789')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 123456.789

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '9.123.456,789')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 9123456.789

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '1,234.56')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 1234.56

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '123,456.789')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 123456.789

      table = create_table(user_id: @user.id)
      table.add_column!(name: 'balance', type: 'text')
      table.insert_row!(balance: '9,123,456.789')
      table.modify_column!(name: 'balance', type: 'double precision')
      table.records[:rows][0][:balance].should == 9123456.789
    end

    it 'does not raise error when tables with the same name exist on separate schemas' do
      @user.in_database.run("CREATE TABLE cdb_importer.repeated_table (id integer)")
      expect { create_table(user_id: @user.id, name: 'repeated_table') }.to_not raise_error
    end
  end

  context "insert and update rows" do
    it "should be able to insert a row with correct created_at and updated_at values" do
      table = create_table(:user_id => @user.id)
      pk1 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      sleep(0.2)
      pk2 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      first_created_at  = table.records[:rows].first[:created_at]
      second_created_at = table.records[:rows].last[:created_at]
      first_updated_at  = table.records[:rows].first[:updated_at]
      second_updated_at = table.records[:rows].last[:updated_at]

      first_created_at.should  == first_updated_at
      second_created_at.should == second_updated_at

      first_created_at.should_not == second_created_at
      first_updated_at.should_not == second_updated_at

      table.update_row!(pk1, :description => "Description 123")
      first_updated_at_2 = table.records[:rows].first[:updated_at]
      first_updated_at_2.should_not == table.records[:rows].first[:created_at]
      first_updated_at_2.should_not == first_updated_at
    end

    it "should be able to insert a new row" do
      table = create_table(:user_id => @user.id)
      table.rows_counted.should == 0
      primary_key = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      table.reload
      table.rows_counted.should == 1
      primary_key.should == table.records(:rows_per_page => 1)[:rows].first[:cartodb_id]

      lambda {
        table.insert_row!({})
      }.should_not raise_error(CartoDB::EmptyAttributes)

      lambda {
        table.insert_row!({:non_existing => "bad value"})
      }.should raise_error(CartoDB::InvalidAttributes)
    end

    it "updates data_last_modified when changing data" do
      table = create_table(:user_id => @user.id)

      table.insert_row!({})
      time1 = table.data_last_modified.to_f

      sleep(0.5)
      table.insert_row!({})
      time2 = table.data_last_modified.to_f

      (time2 > time1).should be_true
    end

    it "should be able to insert a row with a geometry value" do
      table = new_table(:user_id => @user.id)
      table.user_table.save.reload

      lat = -43.941
      lon = 3.429
      the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
      pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

      query_result = @user.run_pg_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should update null value to nil when inserting and updating" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "valid boolean"
      table.user_table.save.reload

      pk = table.insert_row!({:valid => "null"})
      table.record(pk)[:valid].should be_nil

      pk = table.insert_row!({:valid => true})
      table.update_row!(pk, {:valid => "null"})
      table.record(pk)[:valid].should be_nil
    end

    it "should be able to update a row" do
      table = create_table(:user_id => @user.id)

      pk = table.insert_row!({:name => String.random(10), :description => ""})
      table.update_row!(pk, :description => "Description 123")

      row = table.records(:rows_per_page => 1, :page => 0)[:rows].first
      row[:description].should == "Description 123"

      lambda {
        table.update_row!(pk, :non_existing => 'ignore it, please', :description => "Description 123")
      }.should raise_error(CartoDB::InvalidAttributes)
    end

    it "should be able to update a row with a geometry value" do
      table = new_table(:user_id => @user.id)
      table.user_table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_pg_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should be able to update data in rows with column names with multiple underscores" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :table_name    => 'elecciones2008',
                                       :data_source   => '/../spec/support/data/elecciones2008.csv')
      data_import.run_import!

      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log}"
      update_data = {:upo___nombre_partido=>"PSOEE"}
      id = 5

      lambda {
        table.update_row!(id, update_data)
      }.should_not raise_error

      res = table.sequel.where(:cartodb_id => 5).first
      res[:upo___nombre_partido].should == "PSOEE"
    end

    it "should be able to insert data in rows with column names with multiple underscores" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../spec/support/data/elecciones2008.csv')
      data_import.run_import!

      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log}"

      pk = nil
      insert_data = {:upo___nombre_partido=>"PSOEE"}

      lambda {
        pk = table.insert_row!(insert_data)
      }.should_not raise_error

      res = table.sequel.where(:cartodb_id => pk).first
      res[:upo___nombre_partido].should == "PSOEE"
    end

    it "can insert and update records in a table with a reserved word as its name" do
      table = create_table(:name => 'where', :user_id => @user.id)
      pk1 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      pk2 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})

      table.records[:rows].should have(2).rows

      table.update_row!(pk1, :description => "Description 123")
      table.records[:rows].first[:description].should be == "Description 123"
    end

    # No longer used, now we automatically rename reserved word columns
    #it "can insert and update records in a table which one of its columns uses a reserved word as its name" do
      #table = create_table(:name => 'where', :user_id => @user.id)
      #table.add_column!(:name => 'where', :type => 'string')

      #pk1 = table.insert_row!({:_where => 'random string'})

      #table.records[:rows].should have(1).rows
      #table.records[:rows].first[:_where].should be == 'random string'
    #end
  end

  context "preimport tests" do
    it "rename a table to a name that exists should add a _1 to the new name" do
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.user_table.save.reload
      table.name.should == 'empty_file'

      table2 = new_table :name => 'empty_file', :user_id => @user.id
      table2.save.reload
      table2.name.should == 'empty_file_1'
    end

    it "should escape table names starting with numbers" do
      table = new_table :user_id => @user.id, :name => '123_table_name'
      table.user_table.save.reload

      table.name.should == "table_123_table_name"
    end

    it "should get a valid name when a table when a name containing the current name exists" do
      table = create_table :name => 'Table #20', :user_id => @user.id
      table2 = create_table :name => 'Table #2', :user_id => @user.id
      table2.reload
      table2.name.should == 'table_2'

      table3 = create_table :name => nil, :user_id => @user.id
      table4 = create_table :name => nil, :user_id => @user.id
      table5 = create_table :name => nil, :user_id => @user.id
      table6 = create_table :name => nil, :user_id => @user.id
    end

    it "should allow creating multiple tables with the same name by adding a number at the and and incrementing it" do
      table = create_table :name => 'Wadus The Table', :user_id => @user.id
      table.name.should == "wadus_the_table"

      # Renaming starts at 1
      1.upto(25) do |n|
        table = create_table :name => 'Wadus The Table', :user_id => @user.id
        table.should_not be_nil
        table.name.should == "wadus_the_table_#{n}"
      end
    end
  end

  context "post import processing tests" do
    it "should optimize the table" do
      fixture     = "#{Rails.root}/db/fake_data/SHP1.zip"
      Table.any_instance.expects(:optimize).once
      data_import = create_import(@user, fixture)
    end

    it "should assign table_id" do
      fixture     =  "#{Rails.root}/db/fake_data/SHP1.zip"
      data_import = create_import(@user, fixture)
      data_import.table.table_id.should_not be_nil
    end

    it "should add a the_geom column after importing a CSV" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/twitters.csv' )
      data_import.run_import!

      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log}"
      table.name.should match(/^twitters/)
      table.rows_counted.should == 7

      table.schema.should include([:the_geom, "geometry", "geometry", "geometry"])
    end

    it "should not drop a table that exists when upload fails" do
      delete_user_data @user
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.should_not be_nil
      table.user_table.save.reload
      table.name.should == 'empty_file'

      fixture     = "#{Rails.root}/db/fake_data/empty_file.csv"
      data_import = create_import(@user, fixture, table.name)

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end
    end

    it "should not drop a table that exists when upload does not fail" do
      delete_user_data @user
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.user_table.save.reload
      table.name.should == 'empty_file'

      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/csv_no_quotes.csv' )
      data_import.run_import!

      table2 = Table.new(user_table: UserTable[data_import.table_id])
      table2.should_not be_nil, "Import failure: #{data_import.log}"
      table2.name.should == 'csv_no_quotes'

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
        user_database.table_exists?(table2.name.to_sym).should be_true
      end
    end

    it "should raise an error when creating a column with reserved name" do
      table = create_table(:user_id => @user.id)
      lambda {
        table.add_column!(:name => "xmin", :type => "number")
      }.should raise_error(CartoDB::InvalidColumnName)
    end

    it "should not raise an error when renaming a column with reserved name" do
      table = create_table(:user_id => @user.id)
      resp = table.modify_column!(:name => "name", :new_name => "xmin")
      resp.should == {:name => "_xmin", :type => "text", :cartodb_type => "string"}
    end

    it "should add a cartodb_id serial column as primary key when importing a
    file without a column with name cartodb_id" do
      fixture       = "#{Rails.root}/db/fake_data/gadm4_export.csv"
      data_import   = create_import(@user, fixture)
      table         = data_import.table
      table.should_not be_nil, "Import failure: #{data_import.log.inspect}"
      table_schema  = @user.in_database.schema(table.name)

      cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
      cartodb_id_schema.should be_present
      cartodb_id_schema = cartodb_id_schema[1]
      cartodb_id_schema[:db_type].should == "integer"
      cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
      cartodb_id_schema[:primary_key].should == true
      cartodb_id_schema[:allow_null].should == false
    end

    it "should add a '_cartodb_id' column when importing a file with invalid data on the cartodb_id column" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   =>  '/../db/fake_data/duplicated_cartodb_id.zip')
      data_import.run_import!
      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log}"

      table_schema = @user.in_database.schema(table.name)

      cartodb_id_schema = table_schema.detect {|s| s[0].to_s == 'cartodb_id'}
      cartodb_id_schema.should be_present
      cartodb_id_schema = cartodb_id_schema[1]
      cartodb_id_schema[:db_type].should == 'integer'
      cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
      cartodb_id_schema[:primary_key].should == true
      cartodb_id_schema[:allow_null].should == false
      invalid_cartodb_id_schema = table_schema.detect {|s| s[0].to_s == '_cartodb_id0'}
      invalid_cartodb_id_schema.should be_present
    end

    it "should return geometry types" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/gadm4_export.csv' )
      data_import.run_import!

      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log.inspect}"

      table.geometry_types.should == ['ST_Point']

      # Now remove the_geom and should not break
      @user.in_database.run(%Q{
                                ALTER TABLE #{table.name} DROP COLUMN the_geom CASCADE;
                              })
      # Schema gets cached, force reload
      table.reload
      table.schema(reload:true)
      table.geometry_types.should == []

      table.destroy
    end

    it "returns null values at the end when ordering desc" do
      table = create_table(user_id: @user.id)
      resp = table.add_column!(name: "numbercolumn", type: "number")
      table.insert_row!(numbercolumn: 1)
      table.insert_row!(numbercolumn: nil)
      table.insert_row!(numbercolumn: 2)
      rows = table.records(order_by: 'numbercolumn', mode: 'desc')[:rows]
      rows.last[:numbercolumn].should eq nil
      rows.first[:numbercolumn].should eq 2
    end

    it "should make sure it converts created_at and updated at to date types when importing from CSV" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/gadm4_export.csv' )
      data_import.run_import!
      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log.inspect}"

      schema = table.schema(:cartodb_types => true)
      schema.include?([:updated_at, "date"]).should == true
      schema.include?([:created_at, "date"]).should == true
    end

    it "should normalize strings if there is a non-convertible entry when converting string to number" do
      fixture     = "#{Rails.root}/db/fake_data/short_clubbing.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table

      table.modify_column! :name=> "club_id", :type=>"number"

      table.sequel.where(:cartodb_id => '1').first[:club_id].should == 709
      table.sequel.where(:cartodb_id => '2').first[:club_id].should == 892
      table.sequel.where(:cartodb_id => '3').first[:club_id].should == 992
      table.sequel.where(:cartodb_id => '4').first[:club_id].should == nil
      table.sequel.where(:cartodb_id => '5').first[:club_id].should == 941
    end

    it "should normalize string if there is a non-convertible entry when converting string to boolean" do
      fixture     = "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table

      # configure nil column
      table.sequel.where(:test_id => '4').update(:f1 => '0')

      # configure nil column
      table.sequel.where(:test_id => '11').update(:f1 => nil)

      # configure blank column
      table.sequel.insert(:test_id => '12', :f1 => "")

      # update datatype
      table.modify_column! :name=>"f1", :type=>"boolean", :name=>"f1", :new_name=>nil

      # test
      table.sequel.where(:cartodb_id => '1').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '2').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '3').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '4').first[:f1].should == false
      table.sequel.select(:f1).where(:cartodb_id => '5').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '6').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '7').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '9').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '10').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '11').first[:f1].should == nil
      table.sequel.select(:f1).where(:test_id => '12').first[:f1].should == nil
    end

    it "should normalize boolean if there is a non-convertible entry when converting boolean to string" do
      fixture     = "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table
      table.modify_column! :name=>"f1", :type=>"boolean"
      table.modify_column! :name=>"f1", :type=>"string"

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 'true'
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == 'false'
    end

    it "should normalize boolean if there is a non-convertible entry when converting boolean to number" do
      fixture     = "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table
      table.modify_column! :name=>"f1", :type=>"boolean"
      table.modify_column! :name=>"f1", :type=>"number"

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 1
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == 0
    end

    it "should normalize number if there is a non-convertible entry when
    converting number to boolean" do
      fixture     = "#{Rails.root}/db/fake_data/column_number_to_boolean.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table

      table.modify_column! :name=>"f1", :type=>"number"
      table.modify_column! :name=>"f1", :type=>"boolean"

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '3').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '4').first[:f1].should == true
    end
  end

  context "geoms and projections" do
    it "should set valid geometry types" do
      table = new_table :user_id => @user.id
      table.force_schema = "address varchar, the_geom geometry"
      table.the_geom_type = "line"
      table.user_table.save
      table.reload
      table.the_geom_type.should == "multilinestring"
    end

    it "should create a the_geom_webmercator column with the_geom projected to 3785" do
      table = new_table :user_id => @user.id
      table.user_table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_pg_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should create a the_geom_webmercator column with the_geom projected to 3785 even when schema is forced" do
      table = new_table :user_id => @user.id
      table.force_schema = "name varchar, the_geom geometry"
      table.user_table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_pg_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should be able to set a the_geom column from numeric latitude column and a longitude column" do
      table = Table.new
      table.user_id = @user.id
      table.name = 'Madrid Bars'
      table.force_schema = "name varchar, address varchar, latitude float, longitude float"
      table.user_table.save
      table.insert_row!({:name => "Hawai",
                         :address => "Calle de Pérez Galdós 9, Madrid, Spain",
                         :latitude => 40.423012,
                         :longitude => -3.699732})

      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)

      # Check if the schema stored in memory is fresh and contains latitude and longitude still
      check_schema(table, [
        [:cartodb_id, "number"], [:name, "string"], [:address, "string"],
        [:the_geom, "geometry", "geometry", "point"], 
        [:created_at, "date"], [:updated_at, "date"],
        [:latitude, "number"], [:longitude, "number"]
      ], :cartodb_types => true)

      # confirm coords are correct
      res = table.sequel.select{[st_x(the_geom),st_y(the_geom)]}.first
      res.should == {:st_x=>-3.699732, :st_y=>40.423012}
    end

    it "should be able to set a the_geom column from dirty string latitude and longitude columns" do
      table = Table.new
      table.user_id = @user.id
      table.name = 'Madrid Bars'
      table.force_schema = "name varchar, address varchar, latitude varchar, longitude varchar"
      table.user_table.save

      table.insert_row!({:name => "Hawai",
                         :address => "Calle de Pérez Galdós 9, Madrid, Spain",
                         :latitude => "40.423012",
                         :longitude => " -3.699732 "})

      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)

      # Check if the schema stored in memory is fresh and contains latitude and longitude still
      check_schema(table, [
        [:cartodb_id, "number"], [:name, "string"], [:address, "string"],
        [:the_geom, "geometry", "geometry", "point"], [:created_at, "date"], 
        [:updated_at, "date"],
        [:latitude, "string"], [:longitude, "string"]
      ], :cartodb_types => true)

      # confirm coords are correct
      res = table.sequel.select{[st_x(the_geom),st_y(the_geom)]}.first
      res.should == {:st_x=>-3.699732, :st_y=>40.423012}
    end

    context "geojson tests" do
      it "should return a geojson for the_geom if it is a point" do
        table = new_table :user_id => @user.id
        table.the_geom_type = "point"
        table.user_table.save.reload

        lat = -43.941
        lon = 3.429
        the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
        pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})



        #update
        the_geom = %Q{{"type":"Point","coordinates":[0,0]}}
        table.send :update_the_geom!, { :the_geom => the_geom }, 1

        records = table.records(:page => 0, :rows_per_page => 1)
        records[:rows][0][:the_geom].should == "{\"type\":\"Point\",\"coordinates\":[0,0]}"
      end

      it "should raise an error when the geojson provided is invalid" do
        table = new_table :user_id => @user.id
        table.user_table.save.reload

        lat = -43.941
        lon = 3.429
        the_geom = %Q{{"type":""""Point","coordinates":[#{lon},#{lat}]I}}
        lambda {
          table.insert_row!({:name => "First check_in", :the_geom => the_geom})
        }.should raise_error(CartoDB::InvalidGeoJSONFormat)
      end

      it "should return new geojson even if geojson provided had other projection" do
        table = new_table :user_id => @user.id
        table.the_geom_type = "point"
        table.user_table.save.reload

        lat = -43.941
        lon = 3.429
        the_geom = %Q{{"type":"Point","coordinates":[#{lon},#{lat}]}}
        pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})


        #update
        the_geom = %Q{{"type":"Point","coordinates":[0,0], "crs":{"type":"name","properties":{"name":"EPSG:232323"}} }}
        table.send :update_the_geom!, { :the_geom => the_geom }, 1

        records = table.records(:page => 0, :rows_per_page => 1)
        records[:rows][0][:the_geom].should == "{\"type\":\"Point\",\"coordinates\":[0,0]}"
      end

    end
  end

  context "migrate existing postgresql tables into cartodb" do
    it "create table via SQL statement and then migrate table into CartoDB" do
      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = "exttable"

      @user.run_pg_query("CREATE TABLE exttable (go VARCHAR, ttoo INT, bed VARCHAR)")
      @user.run_pg_query("INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 1, 'p');
                          INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 2, 'p')")
      table.user_table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end

    it "create and migrate a table containing a the_geom and cartodb_id" do
      delete_user_data @user
      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = "exttable"

      @user.run_pg_query("CREATE TABLE exttable (the_geom VARCHAR, cartodb_id INT, bed VARCHAR)")
      @user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 2, 'p')")
      table.user_table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end

    it "create and migrate a table containing a valid the_geom" do
      delete_user_data @user
      @user.run_pg_query("CREATE TABLE exttable (cartodb_id INT, bed VARCHAR)")
      @user.run_pg_query("SELECT public.AddGeometryColumn ('#{@user.database_schema}','exttable','the_geom',4326,'POINT',2);")
      @user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( ST_GEOMETRYFROMTEXT('POINT(10 14)',4326), 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( ST_GEOMETRYFROMTEXT('POINT(22 34)',4326), 2, 'p')")

      data_import = DataImport.create( :user_id       => @user.id,
                                       :migrate_table => 'exttable')
      data_import.run_import!

      table = Table.new(user_table: UserTable[data_import.table_id])
      table.should_not be_nil, "Import failure: #{data_import.log}"
      table.name.should == 'exttable'
      table.rows_counted.should == 2
      check_schema(table, [[:cartodb_id, "integer"], [:bed, "text"], [:created_at, "timestamp with time zone"], [:updated_at, "timestamp with time zone"], [:the_geom, "geometry", "geometry", "point"]])
    end
  end

  context "merging two+ tables" do
    it "should merge two twitters.csv" do
      # load a table to treat as our 'existing' table
      table = new_table :user_id => @user.id
      table.name  = 'twitters'
      fixture     = "#{Rails.root}/db/fake_data/twitters.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table

      #create a second table from a file to treat as the data we want to append
      #append_this = new_table :user_id => @user.id
      data_import = create_import(@user,
      "#{Rails.root}/db/fake_data/clubbing.csv")

      append_this = data_import.table
      append_this.migrate_existing_table = data_import.table.name
      append_this.save.reload

      # envoke the append_to_table method
      table.append_to_table(:from_table => append_this)
      table.save.reload
      # append_to_table doesn't automatically destroy the table
      append_this.destroy

      UserTable[append_this.id].should == nil
      table.name.should match(/^twitters/)
      table.rows_counted.should == 2005
    end
  end

  context "imports" do
    it "file twitters.csv" do
      delete_user_data @user

      fixture     =  "#{Rails.root}/db/fake_data/twitters.csv"
      data_import = create_import(@user, fixture)

      data_import.table.name.should match(/^twitters/)
      data_import.table.rows_counted.should == 7
    end

    it "file SHP1.zip" do
      delete_user_data @user

      fixture     = "#{Rails.root}/db/fake_data/SHP1.zip"
      data_import = create_import(@user, fixture)

      data_import.table.name.should == "esp_adm1"
      data_import.table.rows_counted.should == 18
    end
  end

  context "search" do

    it "should find tables by description" do
      table = Table.new
      table.user_id = @user.id
      table.name = "clubbing_spain_1_copy"
      table.user_table.description = "A world borders shapefile suitable for thematic mapping applications. Contains polygon borders in two resolutions as well as longitude/latitude values and various country codes. Camión"
      table.save.reload

      ['borders', 'polygons', 'spain', 'countries'].each do |query|
        tables = UserTable.search(query)
        tables.should_not be_empty
        tables.first.id.should == table.id
      end
      tables = UserTable.search("wadus")
      tables.should be_empty
    end

    it "should find tables by name" do
      table = Table.new
      table.user_id = @user.id
      table.name = "european_countries_1"
      table.user_table.description = "A world borders shapefile suitable for thematic mapping applications. Contains polygon borders in two resolutions as well as longitude/latitude values and various country codes"
      table.save.reload

      tables = UserTable.search("eur")
      tables.should_not be_empty
      tables.first.id.should == table.id
    end
  end

  describe 'UserTable.multiple_order' do
    it 'returns sorted records' do
      table_1 = create_table(name: "bogus_table_1", user_id: @user.id)
      table_2 = create_table(name: "bogus_table_2", user_id: @user.id)

      UserTable.search('bogus').multiple_order(name: 'asc')
        .to_a.first.name.should == 'bogus_table_1'
      UserTable.search('bogus').multiple_order(name: 'desc')
        .to_a.first.name.should == 'bogus_table_2'
    end
  end # Table.multiple_order

  context "retrieving tables from ids" do
    it "should be able to find a table by name or by identifier" do
      table = new_table :user_id => @user.id
      table.name = 'awesome name'
      table.save.reload

      UserTable.find_by_identifier(@user.id, table.name).id.should == table.id
      lambda {
        UserTable.find_by_identifier(666, table.name)
      }.should raise_error
    end
  end

  describe '#has_index?' do
    let(:table) { create_table name: 'table_with_indexes', user_id: @user.id }

    it 'returns true when the index exists' do
      table.has_index?('cartodb_id').should be_true
      table.has_index?('the_geom').should be_true
      table.has_index?('the_geom_webmercator').should be_true
    end

    it 'returns false when the index does not exist' do
      table.has_index?('cartodb_id2').should be_false
      table.has_index?('the_geom_wadus').should be_false
    end
  end

  describe '#name=' do
    it 'does not change the name if it is equivalent to the current one' do
      table = Table.new
      table.name = 'new name'
      table.name.should == 'new_name'
      table.name = 'new name'
      table.name.should == 'new_name'
    end
  end #name=

  describe '#validation_for_link_privacy' do
    it 'checks that only users with private tables enabled can set LINK privacy' do
      table_id = UUIDTools::UUID.timestamp_create.to_s

      user_mock = mock
      user_mock.stubs(:private_tables_enabled).returns(true)
      user_mock.stubs(:database_name).returns(nil)
      user_mock.stubs(:over_table_quota?).returns(false)
      user_mock.stubs(:database_schema).returns('public')

      ::Table.any_instance.stubs(:get_valid_name).returns('test')
      ::Table.any_instance.stubs(:owner).returns(user_mock)
      ::Table.any_instance.stubs(:create_table_in_database!)
      ::Table.any_instance.stubs(:set_table_id).returns(table_id)
      ::Table.any_instance.stubs(:set_the_geom_column!).returns(true)
      ::Table.any_instance.stubs(:after_create)
      ::Table.any_instance.stubs(:after_save)
      CartoDB::TablePrivacyManager.any_instance.stubs(:owner).returns(user_mock)
      table = Table.new

      # A user who can create private tables has by default private tables
      table.default_privacy_value.should eq ::UserTable::PRIVACY_PRIVATE

      table.user_id = UUIDTools::UUID.timestamp_create.to_s
      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.name = 'test'
      table.validate
      table.user_table.errors.size.should eq 0

      table.user_table.privacy = UserTable::PRIVACY_PRIVATE
      table.validate
      table.user_table.errors.size.should eq 0

      table.user_table.privacy = UserTable::PRIVACY_LINK
      table.validate
      table.user_table.errors.size.should eq 0

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      user_mock.stubs(:private_tables_enabled).returns(false)

      # Anybody can "keep" a table being type link if it is new or hasn't changed (changed meaning had a previous privacy value)
      table.user_table.privacy = UserTable::PRIVACY_LINK
      table.validate
      table.user_table.errors.size.should eq 0

      # Save so privacy changes instead of being "new"
      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.save

      table.user_table.privacy = UserTable::PRIVACY_LINK
      table.validate
      table.user_table.errors.size.should eq 1
      expected_errors_hash = { privacy: ['unauthorized to modify privacy status to pubic with link'] }
      table.user_table.errors.should eq expected_errors_hash

      table = Table.new
      # A user who cannot create private tables has by default public
      table.default_privacy_value.should eq ::UserTable::PRIVACY_PUBLIC

    end
  end #validation_for_link_privacy

  describe '#validation_for_link_privacy' do
    it 'tests the_geom conversions and expected results' do
      # Empty table/default schema (no conversion)
      table = new_table(:name => 'one', :user_id => @user.id)
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:description, 'text'], [:name, 'text'],
          [:the_geom, 'geometry', 'geometry', 'geometry']
      ])

      # latlong projection
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'two'
      @user.run_pg_query('
        CREATE TABLE two AS SELECT CDB_LatLng(0,0) AS the_geom
      ')
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'point']
      ])

      # single multipoint, without srid
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'three'
      @user.run_pg_query('
        CREATE TABLE three AS SELECT ST_Collect(ST_MakePoint(0,0),ST_MakePoint(1,1)) AS the_geom;
      ')
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'],
          [:invalid_the_geom, 'geometry', 'geometry', 'geometry']
      ])

      # same as above (single multipoint), but with a SRID=4326 (latlong)
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'four'
      @user.run_pg_query('
        CREATE TABLE four AS SELECT ST_SetSRID(ST_Collect(ST_MakePoint(0,0),ST_MakePoint(1,1)),4326) AS the_geom
      ')
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'point']
      ])

      # single polygon
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'five'
      @user.run_pg_query('
        CREATE TABLE five AS SELECT ST_SetSRID(ST_Buffer(ST_MakePoint(0,0),10), 4326) AS the_geom
      ')
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'multipolygon']
      ])

      # single line
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'six'
      @user.run_pg_query('
        CREATE TABLE six AS SELECT ST_SetSRID(ST_Boundary(ST_Buffer(ST_MakePoint(0,0),10,1)), 4326) AS the_geom
      ')
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'multilinestring']
      ])

      # field named "the_geom" being _not_ of type geometry
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'seven'
      @user.run_pg_query(%Q{
        CREATE TABLE seven AS SELECT 'wadus' AS the_geom;
      })
      table.save
      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'],
          [:invalid_the_geom, 'unknown']
      ])

      # geometrycollection (concrete type) Unsupported
      table = new_table(:name => nil, :user_id => @user.id)
      table.migrate_existing_table = 'eight'
      @user.run_pg_query('
        CREATE TABLE eight AS SELECT ST_SetSRID(ST_Collect(ST_MakePoint(0,0), ST_Buffer(ST_MakePoint(10,0),1)), 4326) AS the_geom
      ')
      expect {
        table.save
      }.to raise_exception
    end
  end

  describe '#test_import_cleanup' do
    it 'tests correct removal of some fields upon importing a table' do
      ogc_fid_field = 'ogc_fid'
      gid_field = 'gid'
      # Assumptions: imported_id_2 > imported_id_1   and   cartodb_id_2 > cartodb_id_1
      cartodb_id_1 = 1
      cartodb_id_2 = 2
      imported_id_1 = 3
      imported_id_2 = 4
      description_1 = 'blabla'
      description_2 = 'blablabla'

      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = 'only_ogc_fid'
      @user.run_pg_query(%Q{
        CREATE TABLE #{table.migrate_existing_table} (#{ogc_fid_field} INT, description VARCHAR)
      })
      @user.run_pg_query(%Q{
        INSERT INTO #{table.migrate_existing_table} (#{ogc_fid_field}, description)
        VALUES  (#{imported_id_1}, '#{description_1}'),
                (#{imported_id_2}, '#{description_2}')
      })
      table.save

      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'], [:description, 'text']
      ])

      rows = table.records
      rows[:rows][0][:cartodb_id].should eq imported_id_1
      rows[:rows][1][:cartodb_id].should eq imported_id_2
      rows[:rows][0][:description].should eq description_1
      rows[:rows][1][:description].should eq description_2


      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = 'only_gid'
      @user.run_pg_query(%Q{
        CREATE TABLE #{table.migrate_existing_table} (#{gid_field} INT, description VARCHAR)
      })
      @user.run_pg_query(%Q{
        INSERT INTO #{table.migrate_existing_table} (#{gid_field}, description)
        VALUES  (#{imported_id_1}, '#{description_1}'),
                (#{imported_id_2}, '#{description_2}')
      })
      table.save

      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'], [:description, 'text']
      ])

      rows = table.records
      rows[:rows][0][:cartodb_id].should eq imported_id_1
      rows[:rows][1][:cartodb_id].should eq imported_id_2
      rows[:rows][0][:description].should eq description_1
      rows[:rows][1][:description].should eq description_2


      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = 'cartodb_id_and_ogc_fid'
      @user.run_pg_query(%Q{
        CREATE TABLE #{table.migrate_existing_table} (cartodb_id INT, #{ogc_fid_field} INT, description VARCHAR)
      })
      @user.run_pg_query(%Q{
        INSERT INTO #{table.migrate_existing_table} (cartodb_id, #{ogc_fid_field}, description)
        VALUES  (#{cartodb_id_1}, #{imported_id_1}, '#{description_1}'),
                (#{cartodb_id_2}, #{imported_id_2}, '#{description_2}')
      })
      table.save

      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'], [:description, 'text']
      ])

      rows = table.records
      rows[:rows][0][:cartodb_id].should eq cartodb_id_1
      rows[:rows][1][:cartodb_id].should eq cartodb_id_2
      rows[:rows][0][:description].should eq description_1
      rows[:rows][1][:description].should eq description_2


      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = 'cartodb_id_and_gid'
      @user.run_pg_query(%Q{
        CREATE TABLE #{table.migrate_existing_table} (cartodb_id INT, #{gid_field} INT, description VARCHAR)
      })
      @user.run_pg_query(%Q{
        INSERT INTO #{table.migrate_existing_table} (cartodb_id, #{gid_field}, description)
        VALUES  (#{cartodb_id_1}, #{imported_id_1}, '#{description_1}'),
                (#{cartodb_id_2}, #{imported_id_2}, '#{description_2}')
      })
      table.save

      check_schema(table, [
          [:updated_at, 'timestamp with time zone'], [:created_at, 'timestamp with time zone'], [:cartodb_id, 'integer'],
          [:the_geom, 'geometry', 'geometry', 'geometry'], [:description, 'text']
      ])

      rows = table.records
      rows[:rows][0][:cartodb_id].should eq cartodb_id_1
      rows[:rows][1][:cartodb_id].should eq cartodb_id_2
      rows[:rows][0][:description].should eq description_1
      rows[:rows][1][:description].should eq description_2
    end
  end

  describe 'Valid names for new table' do
    it 'Regression for CDB-3446' do
      new_name = 'table_'
      Table.get_valid_table_name(new_name, {
        name_candidates: %w(table_ table_1)
      }).should_not == 'table_1'
    end
  end

  describe '#key' do
    it 'computes a suitable key for a table' do
      table = create_table(name: "any_name", user_id: @user.id)
      table.key.should == "rails:#{@user.database_name}:public.any_name"
    end

    it 'computes different keys for different tables' do
      table_1 = create_table(user_id: @user.id)
      table_2 = create_table(user_id: @user.id)

      table_1.key.should_not == table_2.key
    end
  end

  describe '#geometry_types_key' do
    it 'computes a suitable key' do
      table = create_table(name: 'any_other_name', user_id: @user.id)
      table.geometry_types_key.should == "rails:#{@user.database_name}:public.any_other_name:geometry_types"
    end
  end

  describe '#geometry_types' do
    it "returns an empty array and does not cache if there's no column the_geom" do
      table = create_table(user_id: @user.id)

      cache = mock()
      cache.expects(:get).never
      cache.expects(:setex).never

      table.stubs(:cache).returns(cache)

      # A bit extreme way of getting a table without the_geom
      table.owner.in_database.run(%Q{ALTER TABLE #{table.name} DROP COLUMN "the_geom" CASCADE})
      table.schema(reload: true)

      table.geometry_types.should == []
    end

    it "returns an empty array and does not cache if there are no geometries in the query" do
      table = create_table(user_id: @user.id)

      cache = mock()
      cache.expects(:get).once.returns(nil)
      cache.expects(:setex).never

      table.stubs(:cache).returns(cache)

      table.geometry_types.should == []
    end

    it "caches if there are geometries" do
      table = create_table(user_id: @user.id)

      cache = mock()
      cache.expects(:get).once
      cache.expects(:setex).once

      table.stubs(:cache).returns(cache)
      table.owner.in_database.run(%Q{
        INSERT INTO #{table.name}(the_geom)
        VALUES(ST_GeomFromText('POINT(-71.060316 48.432044)', 4326))
      })

      table.geometry_types.should == ['ST_Point']
    end

    it "returns the value from the cache if it is there" do
      table = create_table(user_id: @user.id)
      any_types = ['ST_Any_Type', 'ST_Any_Other_Type']
      table.expects(:query_geometry_types).once.returns(any_types)

      table.geometry_types.should eq(any_types), "cache miss failure"
      table.geometry_types.should eq(any_types), "cache hit failure"
      $tables_metadata.get(table.geometry_types_key).should eq(any_types.to_s), "it should be actually cached"
    end
  end

  describe '#destroy' do
    it "invalidates geometry_types cache entry" do
      table = create_table(user_id: @user.id)
      any_types = ['ST_Any_Type', 'ST_Any_Other_Type']
      table.expects(:query_geometry_types).once.returns(any_types)
      table.geometry_types.should eq(any_types)

      key = table.geometry_types_key
      table.destroy

      $tables_metadata.get(key).should eq(nil), "the geometry types cache should be invalidated upon table removal"
    end
  end

  describe '#after_save' do
    it 'invalidates derived visualization cache if there are changes in table privacy' do
      @user.private_tables_enabled = true
      @user.save
      table = create_table(user_id: @user.id)
      table.user_table.save
      table.user_table.should be_private

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:create).returns(true)
      source  = table.table_visualization
      derived = CartoDB::Visualization::Copier.new(@user, source).copy
      derived.store
      derived.type.should eq(CartoDB::Visualization::Member::TYPE_DERIVED)

      # Do not create all member objects anew to be able to set expectations
      CartoDB::Visualization::Member.stubs(:new).with(has_entry(:id => derived.id)).returns(derived)
      CartoDB::Visualization::Member.stubs(:new).with(has_entry(:type => 'table')).returns(table.table_visualization)

      derived.expects(:invalidate_cache).once()

      table.user_table.privacy = UserTable::PRIVACY_PUBLIC
      table.user_table.save
    end
  end

end
