# encoding: utf-8

require 'active_record'
require_dependency 'cartodb/errors'
require_relative 'paged_model'

module Carto
  class Group < ActiveRecord::Base
    include PagedModel

    belongs_to :organization, class_name: Carto::Organization
    has_many :users_group, dependent: :destroy, class_name: Carto::UsersGroup
    has_many :users, :through => :users_group

    private_class_method :new

    validates :name, :database_role, :organization_id, :presence => true

    # Constructor for groups already existing in the database
    def self.new_instance(database_name, name, database_role, display_name = name)
      organization = Organization.find_by_database_name(database_name)

      raise "Organization not found for database #{database_name}" unless organization

      raise CartoDB::ModelAlreadyExistsError if Group.find_by_organization_id_and_name_and_database_role(organization.id, name, database_role)

      new(name: name, database_role: database_role, display_name: display_name, organization: organization)
    end

    # Creation of brand-new group with the extension
    def self.create_group(organization, display_name)
      name = valid_group_name(display_name)
      organization.owner.in_database do |conn|
        create_group_with_extension(conn, name)
      end
      # Extension triggers a request to the editor databases endpoint which actually creates the group
      group = Carto::Group.find_by_organization_id_and_name(organization.id, name)
      group.display_name = display_name
      group.save
      group
    end

    def rename(new_name, new_database_role)
      self.name = new_name
      self.database_role = new_database_role
    end

    def add_member(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      raise CartoDB::ModelAlreadyExistsError unless users_group.where(user_id: user.id, group_id: self.id).first.nil?

      user_group = Carto::UsersGroup.new(user: user, group: self)
      users_group << user_group
      user_group
    end

    def remove_member(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      users.include?(user) ? users.destroy(user) : nil
    end

    def database_name
      organization.database_name
    end

    private

    # TODO: PG Format("%I", strvar); ?
    def self.valid_group_name(display_name)
      name = display_name.squish
      name = "g_#{name}" unless name[/^[a-z_]{1}/]
      name.gsub(/[^a-z0-9_]/,'_').gsub(/_{2,}/, '_')
    end

    def self.create_group_with_extension(conn, name)
      conn.execute(%Q{ select cartodb.CDB_Group_CreateGroup('#{name}') })
    end

  end
end
