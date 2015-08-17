# encoding: utf-8

require 'active_record'

module Carto
  class Group < ActiveRecord::Base

    belongs_to :organization, class_name: Carto::Organization
    has_many :users_group, dependent: :destroy, class_name: Carto::UsersGroup
    has_many :users, :through => :users_group

    private_class_method :new

    validates :name, :database_role, :organization_id, :presence => true

    def self.new_instance(database_name, name, database_role, display_name = name)
      organization = Organization.find_by_database_name(database_name)

      raise "Organization not found for database #{database_name}" unless organization

      new(name: name, database_role: database_role, display_name: display_name, organization: organization)
    end

    def rename(new_name, new_database_role)
      self.name = new_name
      self.database_role = new_database_role
    end

    def add_member(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      users_group << Carto::UsersGroup.new(user: user, group: self)
      user
    end

    def remove_member(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      # users_group.delete(Carto::UsersGroup.find_by_user_id_and_group_id(user.id, self.id))
      users.destroy(user)
      user
    end

    def database_name
      organization.database_name
    end

  end
end
