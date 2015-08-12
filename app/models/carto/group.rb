# encoding: utf-8

require 'active_record'

module Carto
  class Group < ActiveRecord::Base

    belongs_to :organization, class_name: Carto::Organization
    has_many :users_group, class_name: Carto::UsersGroup
    has_many :users, :through => :users_group

    private_class_method :new

    validates :name, :database_role, :organization_id, :presence => true

    def self.new_instance(database_name, database_role)
      organization = Carto::Organization
          .joins('INNER JOIN users ON organizations.owner_id = users.id')
          .where('users.database_name = ?', database_name).first

      raise "Organization not found for database #{database_name}" unless organization

      group = new(name: database_role, database_role: database_role, organization: organization)
    end

    def database_name
      organization.database_name
    end

  end
end
