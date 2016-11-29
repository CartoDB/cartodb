# encoding: utf-8

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user,
               class_name: Carto::User,
               dependent: :destroy

    belongs_to :organization,
               class_name: Carto::Organization,
               dependent: :destroy
  end
end
