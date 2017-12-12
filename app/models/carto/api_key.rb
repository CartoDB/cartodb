require 'securerandom'

class Carto::ApiKey < ActiveRecord::Base

  TOKEN_LENGTH = 40.freeze

  TYPE_REGULAR = 'regular'.freeze
  TYPE_MASTER = 'master'.freeze
  TYPE_DEFAULT_PUBLIC = 'default_public'.freeze

  VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC].freeze

  belongs_to :user

  before_create :create_token

  before_save :update_modification_times

  validates :api_type, inclusion: { in: VALID_TYPES }


  alias_attribute :type, :api_type
  alias_attribute :type=, :api_type=

  def create_token
    self.token = SecureRandom.hex(TOKEN_LENGTH/2) unless token
  end

  def update_modification_times
    now = DateTime.now
    self.created_at = now unless created_at
    self.updated_at = now
  end
end