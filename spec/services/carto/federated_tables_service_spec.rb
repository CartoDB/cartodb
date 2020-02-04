require 'spec_helper_min'
require 'support/helpers'

describe Carto::FederatedTablesService do
    include_context 'users helper'
    include HelperMethods

  def remote_query(query)
    status = system("PGPASSWORD='#{@remote_password}' #{@psql} -q -U #{@remote_username} -d #{@remote_database} -h #{@remote_host} -p #{@remote_port} -c \"#{query};\"")
    raise "Failed to execute remote query: #{query}" unless status
  end

    def get_federated_server_payload(
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @remote_database,
        host: @remote_host,
        port: @remote_port,
        username: @remote_username,
        password: @remote_username
    )
        {
            federated_server_name: federated_server_name,
            mode: mode,
            dbname: dbname,
            host: host,
            port: port,
            username: username,
            password: password
        }
    end

    def create_federated_server(**attributes)
        @service.register_server(get_federated_server_payload(attributes))
    end

    def update_federated_server(federated_server_name:, **attributes)
        @service.update_server(get_federated_server_payload(federated_server_name: federated_server_name, **attributes))
    end

    FEDERATED_SERVER_ATTRIBUTES = %i(federated_server_name mode dbname host port username password).freeze
    GRANT_SERVER_ACCESS_ATTRIBUTES = %i(federated_server_name db_role).freeze

    def get_grant_access_to_federated_server_payload(
        federated_server_name: @federated_server_name,
        db_role: @user1.database_username
    )
        {
            federated_server_name: federated_server_name,
            db_role: db_role
        }
    end

    def grant_access_to_federated_server(**attributes)
        @service.grant_access_to_federated_server(get_grant_access_to_federated_server_payload(attributes))
    end

    def create_and_grant_federated_server(**attributes)
        server_attributes = attributes.slice(*FEDERATED_SERVER_ATTRIBUTES)
        federated_server = create_federated_server(server_attributes)
        grant_server_attributes = attributes.slice(*GRANT_SERVER_ACCESS_ATTRIBUTES)
        grant_access_to_federated_server(grant_server_attributes)
        return federated_server
    end

    REMOTE_TABLE_ATTRIBUTES = %i(federated_server_name remote_schema_name remote_table_name local_table_name_override id_column_name geom_column_name webmercator_column_name).freeze

    def get_remote_table_server_payload(
        federated_server_name: @federated_server_name,
        remote_schema_name: @remote_schema_name,
        remote_table_name: @remote_table_name,
        local_table_name_override: @remote_table_name,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
    )
        {
            federated_server_name: federated_server_name,
            remote_schema_name: remote_schema_name,
            remote_table_name: remote_table_name,
            local_table_name_override: local_table_name_override,
            id_column_name: id_column_name,
            geom_column_name: geom_column_name,
            webmercator_column_name: webmercator_column_name
        }
    end

    def register_remote_table(**attributes)
        create_and_grant_federated_server(attributes)
        remote_table_attributes = attributes.slice(*REMOTE_TABLE_ATTRIBUTES)
        @service.register_table(get_remote_table_server_payload(remote_table_attributes))
    end

    before(:all) do
        puts "Starting remote server"
        @dir = Cartodb.get_config(:federated_server, 'dir')
        port = Cartodb.get_config(:federated_server, 'port')
        user = Cartodb.get_config(:federated_server, 'test_user')
        pg_bindir = Cartodb.get_config(:federated_server, 'pg_bindir_path')
        unless pg_bindir.present?
          pg_bindir = `pg_config --bindir`.delete!("\n")
        end
        @pg_ctl = "#{pg_bindir}/pg_ctl"
        @psql = "#{pg_bindir}/psql"

        raise "Federated server directory is not configured!" unless @dir.present?
        raise "Federated server port is not configured!" unless port.present?
        raise "Federated server user is not configured!" unless user.present?
        raise "Binary 'psql' could not be found" unless system("which #{@psql}")

        @remote_host = "127.0.0.1"
        @remote_port = "#{port}"
        @remote_database = "#{user}"
        @remote_username = "#{user}"
        @remote_password = "#{user}"
    end

    before(:each) do
        @service = Carto::FederatedTablesService.new(user: @user1)
    end

    after(:each) do
        if @federated_server_name.present?
            @service.unregister_server(federated_server_name: @federated_server_name)
        end
    end

    after(:all) do
    end

    describe 'federated server service' do
        describe 'federated server' do
            it 'should return a empty collection of federated server' do
                pagination = { page: 1, per_page: 10, order: 'federated_server_name', direction: 'asc', offset: 0 }

                federated_server_list = @service.list_servers(pagination)

                expect(federated_server_list).to be_empty
            end

            it 'should return a collection with one federated server' do
                @federated_server_name = "fs_001_from_#{@user1.username}_to_remote"
                federated_server = create_federated_server()

                pagination = { page: 1, per_page: 10, order: 'federated_server_name', direction: 'asc', offset: 0 }
                federated_server_list = @service.list_servers(pagination)

                expect(federated_server_list.length()).to eq(1)
                expect(federated_server_list[0][:federated_server_name]).to eq(federated_server[:federated_server_name])
                expect(federated_server_list[0][:mode]).to eq(federated_server[:mode])
                expect(federated_server_list[0][:dbname]).to eq(federated_server[:dbname])
                expect(federated_server_list[0][:host]).to eq(federated_server[:host])
                expect(federated_server_list[0][:port]).to eq(federated_server[:port])
            end

            it 'should register a federated server' do
                @federated_server_name = "fs_002_from_#{@user1.username}_to_remote"
                expected_federated_server = get_federated_server_payload()
                federated_server = create_federated_server()

                expect(federated_server[:federated_server_name]).to eq(@federated_server_name)
                expect(federated_server[:mode]).to eq(expected_federated_server[:mode])
                expect(federated_server[:dbname]).to eq(expected_federated_server[:dbname])
                expect(federated_server[:host]).to eq(expected_federated_server[:host])
                expect(federated_server[:port]).to eq(expected_federated_server[:port])
            end

            it 'should grant access of a federated server to a role' do
                @federated_server_name = "fs_003_from_#{@user1.username}_to_remote"
                federated_server = create_federated_server()

                expect {
                    @service.grant_access_to_federated_server(
                        federated_server_name: @federated_server_name,
                        db_role: @user1.database_username
                    )
                }.not_to raise_error
            end

            it 'should get a federated server by name' do
                @federated_server_name = "fs_004_from_#{@user1.username}_to_remote"
                expected_federated_server = get_federated_server_payload()
                create_federated_server()

                federated_server = @service.get_server(federated_server_name: @federated_server_name)

                expect(federated_server[:federated_server_name]).to eq(@federated_server_name)
                expect(federated_server[:mode]).to eq(expected_federated_server[:mode])
                expect(federated_server[:dbname]).to eq(expected_federated_server[:dbname])
                expect(federated_server[:host]).to eq(expected_federated_server[:host])
                expect(federated_server[:port]).to eq(expected_federated_server[:port])
            end

            it 'should update a federated server by name' do
                @federated_server_name = "fs_005_from_#{@user1.username}_to_remote"
                expected_federated_server = get_federated_server_payload(
                    federated_server_name: @federated_server_name,
                    dbname: @remote_database,
                    host: @remote_host,
                    username: @remote_username,
                    password: @remote_username
                )
                create_federated_server(
                    federated_server_name: @federated_server_name,
                    dbname: @user1.database_name,
                    host: @user1.database_host,
                    username: @user1.database_username,
                    password: @user1.database_password
                )

                federated_server = update_federated_server(expected_federated_server)

                expect(federated_server[:federated_server_name]).to eq(@federated_server_name)
                expect(federated_server[:mode]).to eq(expected_federated_server[:mode])
                expect(federated_server[:dbname]).to eq(expected_federated_server[:dbname])
                expect(federated_server[:host]).to eq(expected_federated_server[:host])
                expect(federated_server[:port]).to eq(expected_federated_server[:port])
            end

            it 'should unregister a federated server by name' do
                @federated_server_name = "fs_006_from_#{@user1.username}_to_remote"
                expected_federated_server = get_federated_server_payload()
                federated_server = create_federated_server()

                expect {
                    @service.unregister_server(federated_server_name: @federated_server_name)
                    @federated_server_name = nil
                }.not_to raise_error
            end

            it 'should revoke access to a federated server' do
                @federated_server_name = "fs_007_from_#{@user1.username}_to_remote"
                expected_federated_server = get_federated_server_payload()
                create_federated_server(federated_server_name: @federated_server_name)

                expect {
                    @service.revoke_access_to_federated_server(
                        federated_server_name: @federated_server_name,
                        db_role: @user1.database_username
                    )
                }.not_to raise_error
            end
        end

        describe 'remote schemas' do
            it 'should list remote schemas of a federated server' do
                @federated_server_name = "fs_008_from_#{@user1.username}_to_remote"
                create_and_grant_federated_server()
                remote_schemas = @service.list_remote_schemas(
                    federated_server_name: @federated_server_name,
                    page: 1,
                    per_page: 10,
                    order: 'remote_schema_name',
                    direction: 'asc',
                    offset: 0
                )

                expect(remote_schemas).to include(:remote_schema_name => "public")
            end

            it 'should raise "Server [...] does not exist" error when listing remote schemas of a non registered federated server' do
                nonregistered_federated_server_name = "fs_999_from_#{@user1.username}_to_remote"
                expect {
                    @service.list_remote_schemas(
                        federated_server_name: nonregistered_federated_server_name,
                        page: 1,
                        per_page: 10,
                        order: 'remote_schema_name',
                        direction: 'asc',
                        offset: 0
                    )
                }.to raise_error(Sequel::DatabaseError, /Server (.*) does not exist/)
            end
        end

        describe 'remote tables' do
            before(:each) do
                @remote_schema_name = 'aux_schema'
                @remote_table_name = 'my_table'
                remote_query("CREATE SCHEMA IF NOT EXISTS #{@remote_schema_name}")
                remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
            end

            after(:each) do
                remote_query("DROP SCHEMA #{@remote_schema_name} CASCADE")
            end

            it 'should list unregistered remote table of a federated server and schema' do
                @federated_server_name = "fs_010_from_#{@user1.username}_to_remote"
                federated_server = create_and_grant_federated_server()
                pagination = { page: 1, per_page: 10, order: 'remote_table_name', direction: 'asc', offset: 0 }
                remote_tables = @service.list_remote_tables(federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, **pagination)
                expect(remote_tables).to include(
                    :registered=>false,
                    :qualified_name=>nil,
                    :remote_table_name=>@remote_table_name,
                    :remote_schema_name=>@remote_schema_name,
                    :id_column_name=>nil,
                    :geom_column_name=>nil,
                    :webmercator_column_name=>nil,
                    :columns=>[
                        {:Name=>"geom", :Type=>"GEOMETRY,0"},
                        {:Name=>"geom_webmercator", :Type=>"GEOMETRY,0"},
                        {:Name=>"id", :Type=>"integer"}
                    ]
                )
            end

            it 'should list registered remote table of a federated server and schema' do
                @federated_server_name = "fs_011_from_#{@user1.username}_to_remote"
                register_remote_table()
                pagination = { page: 1, per_page: 10, order: 'remote_table_name', direction: 'asc', offset: 0 }
                remote_tables = @service.list_remote_tables(federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, **pagination)
                expect(remote_tables).to include(
                    :registered => true,
                    :qualified_name => "cdb_fs_#{@federated_server_name}.#{@remote_table_name}",
                    :remote_schema_name => @remote_schema_name,
                    :remote_table_name => @remote_table_name,
                    :id_column_name=> "id",
                    :geom_column_name=>"geom",
                    :webmercator_column_name=> "geom_webmercator",
                    :columns => [
                        {:Name=>"geom", :Type=>"GEOMETRY,0"},
                        {:Name=>"geom_webmercator", :Type=>"GEOMETRY,0"},
                        {:Name=>"id", :Type=>"integer"}
                    ]
                )
            end

            it 'should register a remote table of a federated server and schema' do
                @federated_server_name = "fs_012_from_#{@user1.username}_to_remote"
                remote_table = register_remote_table()
                expect(remote_table[:registered]).to eq(true)
                expect(remote_table[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{@remote_table_name}")
                expect(remote_table[:remote_table_name]).to eq(@remote_table_name)
            end

            it 'should raise "non integer id_column (.*)" error when registering a remote table' do
                @federated_server_name = "fs_0121_from_#{@user1.username}_to_remote"

                expect {
                    remote_table = register_remote_table(id_column_name: 'wadus')
                }.to raise_error(Sequel::DatabaseError, /non integer id_column (.*)/)
            end

            it 'should raise "non geometry column (.*)" error when registering a remote table with wrong "geom_column_name"' do
                @federated_server_name = "fs_0121_from_#{@user1.username}_to_remote"

                expect {
                    remote_table = register_remote_table(geom_column_name: 'wadus')
                }.to raise_error(Sequel::DatabaseError, /non geometry column (.*)/)
            end

            it 'should raise "non geometry column (.*)" error when registering a remote table with wrong "webmercator_column_name"' do
                @federated_server_name = "fs_0121_from_#{@user1.username}_to_remote"

                expect {
                    remote_table = register_remote_table(webmercator_column_name: 'wadus')
                }.to raise_error(Sequel::DatabaseError, /non geometry column (.*)/)
            end

            it 'should get a remote table of a federated server and schema' do
                @federated_server_name = "fs_013_from_#{@user1.username}_to_remote"
                register_remote_table()
                remote_table = @service.get_remote_table(
                    federated_server_name: @federated_server_name,
                    remote_schema_name: @remote_schema_name,
                    remote_table_name: @remote_table_name
                )
                expect(remote_table[:registered]).to eq(true)
                expect(remote_table[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{@remote_table_name}")
                expect(remote_table[:remote_table_name]).to eq(@remote_table_name)
            end

            it 'should update a remote table of a federated server and schema' do
                @federated_server_name = "fs_014_from_#{@user1.username}_to_remote"
                new_remote_table_name = 'overwitten_table_name'
                register_remote_table()
                attributes = get_remote_table_server_payload(
                    federated_server_name: @federated_server_name,
                    local_table_name_override: new_remote_table_name
                )
                remote_table = @service.update_table(attributes)
                expect(remote_table[:registered]).to eq(true)
                expect(remote_table[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{new_remote_table_name}")
                expect(remote_table[:remote_table_name]).to eq(@remote_table_name)
            end

            it 'should unregister a registered remote table of a federated server' do
                @federated_server_name = "fs_015_from_#{@user1.username}_to_remote"
                remote_table = register_remote_table()
                expect(remote_table[:registered]).to eq(true)
                @service.unregister_table(
                    federated_server_name: @federated_server_name,
                    remote_schema_name: @remote_schema_name,
                    remote_table_name: @remote_table_name
                )
                remote_table = @service.get_remote_table(
                    federated_server_name: @federated_server_name,
                    remote_schema_name: @remote_schema_name,
                    remote_table_name: @remote_table_name
                )
                expect(remote_table[:registered]).to eq(false)
                expect(remote_table[:remote_table_name]).to eq(@remote_table_name)
                expect(remote_table[:qualified_name]).to eq(nil)
            end
        end
    end
end
