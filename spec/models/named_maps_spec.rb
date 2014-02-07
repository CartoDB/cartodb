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

    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    username: db_config.fetch('username')
                  )
    @relation   = "visualizations_#{Time.now.to_i}".to_sym
    @repository = DataRepository::Backend::Sequel.new(@db, @relation)
    Visualization::Migrator.new(@db).migrate(@relation)
    Visualization.repository = @repository

    puts "\n[rspec][#{SPEC_NAME}] Creating test user database..."
    @user = create_user( :quota_in_bytes => 524288000, :table_quota => 100 )

    puts "[rspec][#{SPEC_NAME}] Running..."
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
  end

  describe 'public_table_public_vis' do
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

      debugger

      table.affected_visualizations.size.should eq 1
      table.affected_visualizations.first.should eq derived_vis


    end
  end #public_table_public_vis

end
