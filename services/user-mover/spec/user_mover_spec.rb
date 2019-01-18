require_relative '../../../spec/spec_helper.rb'
require_relative '../import_user'
require_relative '../export_user'
require_relative '../../../lib/carto/ghost_tables_manager'

RSpec.configure do |c|
  c.include Helpers
end
describe CartoDB::DataMover::ExportJob do
  def stub_api_keys
    CartoDB::DataMover::ImportJob.any_instance.stubs(:create_org_api_key_roles)
    CartoDB::DataMover::ImportJob.any_instance.stubs(:create_user_api_key_roles)
    CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_org_api_key_roles)
    CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_user_api_key_roles)
    CartoDB::DataMover::ImportJob.any_instance.stubs(:create_user_oauth_app_user_roles)
    CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_user_oauth_app_user_roles)
  end

  before :each do
    bypass_named_maps
    @tmp_path = Dir.mktmpdir("mover-test") + '/'
  end

  let(:first_user) do
    create_user(
      quota_in_bytes: 100.megabyte,
      private_tables_enabled: true,
      database_timeout: 123450,
      user_timeout: 456780,
      table_quota: nil
    )
  end

  shared_examples "a migrated user" do
    it "has expected statement_timeout" do
      expect(subject.in_database['SHOW statement_timeout'].to_a[0][:statement_timeout]).to eq("456780ms")
      expect(subject.in_database(as: :public_db_user)['SHOW statement_timeout']
        .to_a[0][:statement_timeout]).to eq("123450ms")
    end

    it "keeps proper table privacy" do
      check_tables(subject)
    end
  end

  describe "a migrated user" do
    before(:each) do
      stub_api_keys
    end

    subject do
      create_tables(first_user)
      first_user.save
      first_user.reload
      carto_user = Carto::User.find(first_user.id)
      Carto::UserNotification.create!(user: carto_user, notifications: { builder: { onboarding: true } })
      move_user(first_user)
    end

    it_behaves_like "a migrated user"
    it "matches old and new user" do
      expect((first_user.as_json.reject { |x| [:updated_at, :database_host].include?(x.to_sym) }))
        .to eq((subject.as_json.reject { |x| [:updated_at, :database_host].include?(x.to_sym) }))
    end
  end

  describe "a standalone user which has moved to an organization" do
    before(:all) do
      @org = create_user_mover_test_organization
    end

    subject do
      create_tables(first_user)
      first_user.db_service.move_to_own_schema

      CartoDB::DataMover::ExportJob.new(id: first_user.username, path: @tmp_path, schema_mode: true)
      CartoDB::UserModule::DBService.terminate_database_connections(first_user.database_name, first_user.database_host)
      CartoDB::DataMover::ImportJob.new(
        file: @tmp_path + "user_#{first_user.id}.json", mode: :rollback, drop_database: true, drop_roles: true).run!
      CartoDB::DataMover::ImportJob.new(
        file: @tmp_path + "user_#{first_user.id}.json", mode: :import, host: '127.0.0.2', target_org: @org.name).run!

      moved_user = ::User[first_user.id]
      moved_user.reload # Clean user sequel cache

      Carto::GhostTablesManager.new(moved_user.id).link_ghost_tables_synchronously
      moved_user
    end

    it_behaves_like "a migrated user"

    it "matches old and new user except database_name and database_host" do
      IGNORED_KEYS = [:updated_at, :database_name, :database_host, :organization_id, :database_schema].freeze
      expect(first_user.as_json.reject { |x| IGNORED_KEYS.include? x.to_sym })
        .to eq(subject.as_json.reject { |x| IGNORED_KEYS.include? x.to_sym })
      expect(subject.database_name).to eq(@org.owner.database_name)
      expect(subject.database_schema).to eq(subject.username)
      expect(subject.database_host).to eq('127.0.0.2')
      expect(subject.organization_id).to eq(@org.id)
    end

    it "has granted the org role" do
      authed_roles = subject
                      .in_database["select s.rolname from pg_roles r
                        join pg_catalog.pg_auth_members m on r.oid=m.member join pg_catalog.pg_roles
                        s on m.roleid=s.oid where r.rolname='#{subject.database_username}'"].to_a
      authed_roles.should be_any { |m| m[:rolname] == subject.db_service.organization_member_group_role_member_name }
    end
  end

  it "should move a user from an organization to its own account" do
    org = create_user_mover_test_organization
    user = create_user(
      quota_in_bytes: 100.megabyte, table_quota: 400, organization: org, account_type: 'ORGANIZATION USER'
    )
    org.reload
    create_tables(user)

    CartoDB::DataMover::ExportJob.new(id: user.username, path: @tmp_path, schema_mode: true)
    CartoDB::UserModule::DBService.terminate_database_connections(user.database_name, user.database_host)
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "user_#{user.id}.json", mode: :rollback).run!
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "user_#{user.id}.json", mode: :import, host: '127.0.0.2').run!

    moved_user = ::User.find(username: user.username)
    moved_user.reload
    Carto::GhostTablesManager.new(moved_user.id).link_ghost_tables_synchronously
    check_tables(moved_user)
    moved_user.organization_id.should eq nil
  end

  it "should move a whole organization" do
    port = find_available_port
    run_test_server(port)

    test_config = Cartodb.get_config(:org_metadata_api).merge('host' => '127.0.0.1', 'port' => port)
    Cartodb.with_config(org_metadata_api: test_config) do
      org = create_user_mover_test_organization
      user = create_user(
        quota_in_bytes: 100.megabyte, table_quota: 400, organization: org, account_type: 'ORGANIZATION USER'
      )
      user.save
      org.reload

      create_tables(org.owner)
      share_tables(org.owner, user)
      share_tables(user, org.owner)
      create_tables(user)

      carto_org = Carto::Organization.find(org.id)
      group_1 = carto_org.create_group(String.random(5))
      group_2 = carto_org.create_group(String.random(5))

      group_1.add_user(org.owner.username)
      group_2.add_user(org.owner.username)
      group_1.add_user(user.username)
      group_2.add_user(user.username)

      share_group_tables(org.owner, group_1)
      share_group_tables(user, group_2)

      CartoDB::DataMover::ExportJob.new(organization_name: org.name, path: @tmp_path, split_user_schemas: false)
      CartoDB::UserModule::DBService.terminate_database_connections(org.owner.database_name, org.owner.database_host)
      CartoDB::DataMover::ImportJob.new(file: @tmp_path + "org_#{org.id}.json", mode: :rollback, drop_database: true, drop_roles: true).run!
      CartoDB::DataMover::ImportJob.new(file: @tmp_path + "org_#{org.id}.json", mode: :import, host: '127.0.0.2').run!

      moved_user = ::User.find(username: user.username)
      moved_user.reload
      moved_user.database_host.should eq '127.0.0.2'
      Carto::GhostTablesManager.new(moved_user.id).link_ghost_tables_synchronously
      check_tables(moved_user)
      moved_user.in_database['SELECT * FROM cdb_tablemetadata']
      moved_user.organization_id.should_not eq nil
    end

    @server_thread.terminate
  end

  it "should move a whole organization without splitting user schemas" do

    org = create_user_mover_test_organization
    user = create_user(
      quota_in_bytes: 100.megabyte, table_quota: 400, organization: org, account_type: 'ORGANIZATION USER'
    )
    user.save
    org.reload

    create_tables(org.owner)
    share_tables(org.owner, user)
    share_tables(user, org.owner)
    create_tables(user)

    CartoDB::DataMover::ExportJob.new(organization_name: org.name, path: @tmp_path)
    CartoDB::UserModule::DBService.terminate_database_connections(org.owner.database_name, org.owner.database_host)
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "org_#{org.id}.json", mode: :rollback, drop_database: true, drop_roles: true).run!
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "org_#{org.id}.json", mode: :import, host: '127.0.0.2').run!

    moved_user = ::User.find(username: user.username)
    moved_user.reload
    moved_user.database_host.should eq '127.0.0.2'
    Carto::GhostTablesManager.new(moved_user.id).link_ghost_tables_synchronously
    check_tables(moved_user)
    moved_user.in_database['SELECT * FROM cdb_tablemetadata']
    moved_user.organization_id.should_not eq nil

  end

  it "should not touch an user metadata nor update its oids when update_metadata is not set" do
    stub_api_keys
    user = create_user(
      quota_in_bytes: 100.megabyte, table_quota: 50, private_tables_enabled: true, sync_tables_enabled: true
    )
    create_tables(user)

    old_user_data = user.as_json
    old_user_tables = user.real_tables
    old_user_oids = user.tables.map(&:table_id).sort
    CartoDB::DataMover::ExportJob.new(id: user.username, path: @tmp_path)
    CartoDB::UserModule::DBService.terminate_database_connections(user.database_name, user.database_host)
    CartoDB::DataMover::ImportJob.new(
      file: @tmp_path + "user_#{user.id}.json", mode: :rollback, host: '127.0.0.2',
      drop_database: true, drop_roles: true).run!
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "user_#{user.id}.json", mode: :import, host: '127.0.0.2',
                                      update_metadata: false).run!

    new_user = ::User.find(username: user.username)

    new_user.as_json.should eq old_user_data
    new_user.real_tables.should_not eq old_user_tables
    new_user.tables.map(&:table_id).sort.should eq old_user_oids
  end
end

module Helpers
  def move_user(user)
    CartoDB::DataMover::ExportJob.new(id: user.username, path: @tmp_path)
    CartoDB::UserModule::DBService.terminate_database_connections(user.database_name, user.database_host)
    CartoDB::DataMover::ImportJob.new(
      file: @tmp_path + "user_#{user.id}.json", mode: :rollback,
      drop_database: true, drop_roles: true).run!
    CartoDB::DataMover::ImportJob.new(file: @tmp_path + "user_#{user.id}.json", mode: :import, host: '127.0.0.2').run!
    ::User.find(username: user.username)
  end

  def create_tables(user)
    create_table(user_id: user.id, name: "with_link_table", privacy: UserTable::PRIVACY_LINK)
    create_table(user_id: user.id, name: "public_table",    privacy: UserTable::PRIVACY_PUBLIC)
    create_table(user_id: user.id, name: "private_table",   privacy: UserTable::PRIVACY_PRIVATE)
  end

  def share_tables(user1, user2)
    table_ro = create_table(user_id: user1.id, name: "shared_ro_by_#{user1.username}_to_#{user2.id}",
      privacy: UserTable::PRIVACY_PRIVATE)
    give_permission(table_ro.table_visualization, user2, CartoDB::Permission::ACCESS_READONLY)
    table_rw = create_table(user_id: user1.id, name: "shared_rw_by_#{user1.username}_to_#{user2.id}",
      privacy: UserTable::PRIVACY_PRIVATE)
    give_permission(table_rw.table_visualization, user2, CartoDB::Permission::ACCESS_READWRITE)
  end

  def share_group_tables(user, group)
    table_ro = create_table(user_id: user.id, name: "shared_ro_by_#{user.username}_to_#{group.name}", privacy: UserTable::PRIVACY_PRIVATE)
    group.grant_db_permission(table_ro, CartoDB::Permission::ACCESS_READONLY)
    table_rw = create_table(user_id: user.id, name: "shared_rw_by_#{user.username}_to_#{group.name}", privacy: UserTable::PRIVACY_PRIVATE)
    group.grant_db_permission(table_rw, CartoDB::Permission::ACCESS_READWRITE)
  end

  def check_tables(moved_user)
    Table.new(user_table: moved_user.tables.where(name: "private_table").first).privacy.should eq UserTable::PRIVACY_PRIVATE
    Table.new(user_table: moved_user.tables.where(name: "public_table").first).privacy.should eq UserTable::PRIVACY_PUBLIC
    Table.new(user_table: moved_user.tables.where(name: "with_link_table").first).privacy.should eq UserTable::PRIVACY_LINK
  end

  def create_user_mover_test_organization
    org = create_organization(name: String.random(5).downcase, quota_in_bytes: 2500.megabytes)

    owner = create_user(quota_in_bytes: 500.megabytes, table_quota: 200, private_tables_enabled: true)
    uo = CartoDB::UserOrganization.new(org.id, owner.id)
    uo.promote_user_to_admin
    owner.db_service.setup_organization_owner
    org.reload
    org
  end

  def give_permission(vis, user, access)
    per = ::Permission[vis.permission.id]
    per.set_user_permission(user, access)
    per.save
    per.reload
  end

  def run_test_server(port)
    @server_thread = Thread.new do
      Rack::Handler::Thin.run Rails.application, Port: port
    end
  end

  def find_available_port
    server = TCPServer.new('127.0.0.1', 0)
    server.addr[1]
  ensure
    server.close if server
  end
end
