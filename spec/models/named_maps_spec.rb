# coding: UTF-8

require_relative '../spec_helper'
require_relative '../../services/named-maps-api-wrapper/lib/named_maps_wrapper'

include CartoDB

# Specs for /services/named-maps-api-wrapper
# Does not check responses from the windshaft API endpoint
describe CartoDB::NamedMapsWrapper::NamedMaps do

  SPEC_NAME = 'named_maps_spec'

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    # Hook new backend to Sequel current connection
    Visualization.repository = DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :visualizations)

    puts "\n[rspec][#{SPEC_NAME}] Creating test user database..."
    @user = create_user( :quota_in_bytes => 524288000, :table_quota => 100 )

    puts "[rspec][#{SPEC_NAME}] Running..."
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
  end

  describe 'public_table' do
    it 'public map with public visualization does not create a named map' do
      table = create_table( user_id: @user.id )
      table.privacy = Table::PUBLIC
      table.save()
      table.should be_public
      table.table_visualization.privacy.should eq 'public'

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()

      # Only this method should be called
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      table.affected_visualizations.size.should eq 2
      table.affected_visualizations[0].id.should eq table.table_visualization.id
      table.affected_visualizations[1].id.should eq derived_vis.id
      table.affected_visualizations[0].id.should_not eq table.affected_visualizations[1].id
    end
  end #public_table_public_vis

  describe 'private_table' do
    it 'private map with public visualization should create a named map' do
      pending
      
      table = create_table( user_id: @user.id )

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()
      derived_vis.privacy = CartoDB::Visualization::Member::PUBLIC

      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

    end
  end #private_table

end
