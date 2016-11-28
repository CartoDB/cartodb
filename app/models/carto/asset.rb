# encoding: utf-8

module Carto
  class Asset
    belongs_to :user, class_name: User, dependent: :destroy
    belongs_to :organization, class_name: Organization, dependent: :destroy
  end
end
