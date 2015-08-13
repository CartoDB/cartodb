# encoding: utf-8

require 'active_record'

module Carto
  class Group < ActiveRecord::Base

    belongs_to :organization, class_name: Carto::Organization
    has_many :users_group, class_name: Carto::UsersGroup
    has_many :users, :through => :users_group

    private_class_method :new

    validates :name, :database_role, :organization_id, :presence => true

    def self.new_instance(database_name, name, database_role, display_name = name)
      organization = Organization.find_by_database_name(database_name)

      raise "Organization not found for database #{database_name}" unless organization

      new(name: name, database_role: database_role, display_name: display_name, organization: organization)
    end

    def add_member(username)
      user = Carto::User.find_by_username(username)

      raise "User #{username} not found" unless user

      users_group << Carto::UsersGroup.new(user: user, group: self)
    end

    def database_name
      organization.database_name
    end

  end
end
