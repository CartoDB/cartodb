# encoding: utf-8

require 'active_record'
require_dependency 'cartodb/errors'
require_dependency 'carto/helpers/auth_token_generator'
require_relative 'paged_model'

module Carto

  # Groups are created by the editor because of extension requests, so
  # standard Rails operations (creation, destruction, etc) doesn't trigger
  # extension management functions. In order to keep extension and database
  # in sync, there're several methods that do trigger it:
  # - create_group_with_extension
  # - rename_group_with_extension
  # - destroy_group_with_extension
  # - add_users_with_extension
  # - remove_users_with_extension
  class Group < ActiveRecord::Base
    include PagedModel
    include AuthTokenGenerator

    belongs_to :organization, class_name: Carto::Organization
    has_many :users_group, dependent: :destroy, class_name: Carto::UsersGroup
    has_many :users, through: :users_group

    private_class_method :new

    validates :name, :database_role, :organization, presence: true

    # In order to avoid locks between CDB_Organization_Remove_Organization_Access_Permission and CDB_Group_DropGroup
    # the "shared with" deletion must be performed outside the transaction, on deletion.
    after_commit :destroy_shared_with

    # Constructor for groups already existing in the database
    def self.new_instance(database_name, name, database_role, display_name = name)
      organization = Organization.find_by_database_name(database_name)

      raise "Organization not found for database #{database_name}" unless organization

      raise CartoDB::ModelAlreadyExistsError if Group.find_by_organization_id_and_name_and_database_role(organization.id, name, database_role)

      new(name: name, database_role: database_role, display_name: display_name, organization: organization)
    end

    # Creation of brand-new group with the extension
    def self.create_group_with_extension(organization, display_name)
      name = valid_group_name(display_name)
      organization.owner.in_database do |conn|
        create_group_extension_query(conn, name)
      end
      # Extension triggers a request to the editor databases endpoint which actually creates the group
      group = Carto::Group.find_by_organization_id_and_name(organization.id, name)
      raise "Group was not created by the extension. Is it installed and configured?" if group.nil?

      group.display_name = display_name
      group.save
      group
    end

    # Constructor for groups metadata, ignores database roles. Should be generally avoided.
    def self.new_instance_without_validation(name:, database_role:, display_name: name, auth_token: nil)
      new(
        name: name,
        display_name: display_name,
        database_role: database_role,
        auth_token: auth_token
      )
    end

    def rename_group_with_extension(new_display_name)
      raise CartoDB::ModelAlreadyExistsError if Group.find_by_organization_id_and_display_name(organization.id, new_display_name)

      new_name = Carto::Group.valid_group_name(new_display_name)
      organization.owner.in_database do |conn|
        Carto::Group.rename_group_extension_query(conn, name, new_name)
      end
      reload
      self.display_name = new_display_name
      save
    end

    # INFO: public because it's called by Organization.
    def destroy_group_with_extension
      # INFO: currently only a superuser can destroy a group. See CartoDB/cartodb-postgresql#114
      organization.owner.in_database(as: :superuser) do |conn|
        Carto::Group.destroy_group_extension_query(conn, name)
      end
    end

    def add_users_with_extension(users)
      organization.owner.in_database do |conn|
        Carto::Group.add_users_group_extension_query(conn, name, users.collect(&:username))
      end
      reload
    end

    def remove_users_with_extension(users)
      organization.owner.in_database do |conn|
        Carto::Group.remove_users_group_extension_query(conn, name, users.collect(&:username))
      end
      reload
    end

    def grant_db_permission(table, access)
      table.owner.in_database do |conn|
        case access
        when CartoDB::Permission::ACCESS_NONE
          Carto::Group.revoke_all(conn, name, table.database_schema, table.name)
        when CartoDB::Permission::ACCESS_READONLY
          Carto::Group.grant_read(conn, name, table.database_schema, table.name)
        when CartoDB::Permission::ACCESS_READWRITE
          Carto::Group.grant_write(conn, name, table.database_schema, table.name)
        else
          raise "Unknown access: #{access}"
        end
      end
    end

    def rename(new_name, new_database_role)
      self.name = new_name
      self.database_role = new_database_role
    end

    def add_user(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      raise CartoDB::ModelAlreadyExistsError unless users_group.where(user_id: user.id, group_id: id).first.nil?

      user_group = Carto::UsersGroup.new(user: user, group: self)
      users_group << user_group
      user_group
    end

    def remove_user(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      if users.include?(user)
        users.destroy(user)
        user
      end
    end

    def database_name
      organization.database_name
    end

    private

    def destroy_shared_with
      if transaction_include_action?(:destroy)
        Carto::SharedEntity.where(recipient_id: id).each do |se|
          viz = Carto::Visualization.find(se.entity_id)
          permission = viz.permission
          permission.remove_group_permission(self)
          permission.save
        end
      end
    end

    # TODO: PG Format("%I", strvar); ?
    def self.valid_group_name(display_name)
      name = display_name.squish
      name = "g_#{name}" unless name[/^[a-zA-Z_]{1}/]
      name.gsub(/[^a-zA-Z0-9_ ]/, '_').gsub(/_{2,}/, '_')
    end

    def self.create_group_extension_query(conn, name)
      conn.execute(%{ select cartodb.CDB_Group_CreateGroup('#{name}') })
    end

    def self.rename_group_extension_query(conn, name, new_name)
      conn.execute(%{ select cartodb.CDB_Group_RenameGroup('#{name}', '#{new_name}') })
    end

    def self.destroy_group_extension_query(conn, name)
      conn.execute(%{ select cartodb.CDB_Group_DropGroup('#{name}') })
    end

    def self.add_users_group_extension_query(conn, name, usernames)
      conn.execute(%{ select cartodb.CDB_Group_AddUsers('#{name}', ARRAY['#{usernames.join("','")}']) })
    end

    def self.remove_users_group_extension_query(conn, name, usernames)
      conn.execute(%{ select cartodb.CDB_Group_RemoveUsers('#{name}', ARRAY['#{usernames.join("','")}']) })
    end

    def self.revoke_all(conn, group_name, table_database_schema, table_name)
      conn.execute(%{ select cartodb._CDB_Group_Table_RevokeAll('#{group_name}', '#{table_database_schema}', '#{table_name}', false) })
    end

    def self.grant_read(conn, group_name, table_database_schema, table_name)
      conn.execute(%{ select cartodb._CDB_Group_Table_GrantRead('#{group_name}', '#{table_database_schema}', '#{table_name}', false) })
    end

    def self.grant_write(conn, group_name, table_database_schema, table_name)
      conn.execute(%{ select cartodb._CDB_Group_Table_GrantReadWrite('#{group_name}', '#{table_database_schema}', '#{table_name}', false) })
    end

  end
end
