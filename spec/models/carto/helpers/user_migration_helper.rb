require 'spec_helper_unit'

module UserMigrationHelper
  records =
    [
      { name: 'carto', description: 'awesome' },
      { name: 'user-mover', description: 'insanity' }
    ]

  agg_ds_config =
    {
      aggregation_tables: {
        'host' => 'localhost',
        'port' => '5432',
        'dbname' => 'test_migration',
        'username' => 'geocoder_api',
        'password' => '',
        'tables' => {
          'admin0' => 'ne_admin0_v3',
          'admin1' => 'global_province_polygons'
        }
      },
      geocoder: {
        'api' => {
          'host' => 'localhost',
          'port' => '5432',
          'dbname' => 'test_migration',
          'user' => 'geocoder_api'
        }
      }
    }

  shared_examples_for 'migrating metadata' do |migrate_metadata|
    before do
      @user = build(:valid_user).save
      @carto_user = Carto::User.find(@user.id)
      @user_attributes = @carto_user.attributes

      @table1 = create_table(user_id: @user.id)
      records.each { |row| @table1.insert_row!(row) }
      create_database('test_migration', @user) if migrate_metadata
    end

    it "exports and reimports a user #{migrate_metadata ? 'with' : 'without'} metadata" do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

      export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: migrate_metadata
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      @carto_user.client_application.destroy
      @table1.table_visualization.layers.each(&:destroy)
      @table1.destroy
      expect { @table1.records }.to raise_error

      migrate_metadata ? @user.destroy : drop_user_database(@user)

      Cartodb.with_config(agg_ds_config) do
        # Do not depend on dataservices_client to be installed
        CartoDB::UserModule::DBService.any_instance.stubs(:install_geocoder_api_extension)

        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: @user_attributes['database_host'],
          org_import: false,
          json_file: export.json_file,
          import_metadata: migrate_metadata
        )
        import.run_import

        puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
        expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

        @carto_user = Carto::User.find(@user_attributes['id'])

        if migrate_metadata
          attributes_to_test(@user_attributes).each do |attribute|
            expect(@carto_user.attributes[attribute]).to eq(@user_attributes[attribute])
          end
          @user.in_database(as: :superuser) do |db|
            ds_config = db.fetch("SELECT * from cdb_conf where key = 'geocoder_server_config'").first[:value]
            fdws_config = db.fetch("SELECT * from cdb_conf where key = 'fdws'").first[:value]
            expect(ds_config).to match /dbname=test_migration/
            expect(fdws_config).to match /\"dbname\":\"test_migration\"/
          end
        else
          expect(@carto_user.attributes).to eq(@user_attributes)
        end

        records.each.with_index { |row, index| @table1.record(index + 1).should include(row) }

      end
    end
  end

  def drop_user_database(user)
    user = user.sequel_user
    conn = user.in_database(as: :cluster_admin)
    user.db_service.drop_database_and_user(conn)
    user.db_service.drop_user(conn)
  end

  def create_database(name, user)
    conn = user.in_database(as: :cluster_admin)
    sql = "CREATE DATABASE \"#{name}\"
    WITH TEMPLATE = template_postgis
    ENCODING = 'UTF8'
    CONNECTION LIMIT=-1"
    conn.run(sql) rescue conn.exec_query(sql)
  end

  def drop_database(name, user)
    conn = user.in_database(as: :cluster_admin)
    sql = "DROP DATABASE \"#{name}\""
    conn.run(sql) rescue conn.exec_query(sql)
  end

  def attributes_to_test(user_attributes)
    user_attributes.keys - %w(created_at updated_at period_end_date)
  end

  def create_user_with_visualizations
    user = build(:valid_user).save

    filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_two_tables.carto"
    data_import = DataImport.create(
      user_id: user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    data_import.success.should eq true
    user
  end

  def org_import
    imp = Carto::UserMigrationImport.create(
      exported_file: @export.exported_file,
      database_host: @carto_organization.owner.attributes['database_host'],
      org_import: true,
      json_file: @export.json_file,
      import_metadata: true,
      dry: false
    )

    imp.stubs(:assert_organization_does_not_exist)
    imp.stubs(:assert_user_does_not_exist)
    imp
  end

  def import
    imp = Carto::UserMigrationImport.create(
      exported_file: @export.exported_file,
      database_host: @user_attributes['database_host'],
      org_import: false,
      json_file: @export.json_file,
      import_metadata: true,
      dry: false
    )
    imp.stubs(:assert_organization_does_not_exist)
    imp.stubs(:assert_user_does_not_exist)
    imp
  end

  def destroy_user
    @carto_user.client_application&.destroy
    @user.destroy
  end

end
