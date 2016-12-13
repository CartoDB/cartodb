# encoding: utf-8

require 'carto/storage'

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user, class_name: Carto::User
    belongs_to :organization, class_name: Carto::Organization

    def before_destroy
      if organization_id && path
        location = Carto::OrganizationAssetFile.location
        Carto::Storage.instance.remove(location, path)
      end
    end
  end
end
