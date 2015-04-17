class Carto::Admin::UserTablePublicMapAdapter
  extend Forwardable

  delegate [] => :user_table

  attr_reader :user_table

  def initialize(user_table)
    @user_table = user_table
  end

end
