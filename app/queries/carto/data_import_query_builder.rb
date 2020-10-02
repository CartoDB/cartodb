require 'active_record'

class Carto::DataImportQueryBuilder

  def initialize
    @order = {}
  end

  def with_user(user)
    @user_id = user.id
    self
  end

  def with_state_not_in(states)
    @excluded_states = states
    self
  end

  def with_created_at_after(date)
    @created_at_after = date
    self
  end

  def with_order(order, asc_desc = :asc)
    @order[order] = asc_desc
    self
  end

  def build
    query = Carto::DataImport.all

    query = query.where(user_id: @user_id) if @user_id

    query = query.where('state not in (?)', @excluded_states) if @excluded_states

    query = query.where('created_at >= ?', @created_at_after) if @created_at_after

    @order.each do |k, v|
      query = query.order(k)
      query = query.reverse_order if v == :desc
    end

    query
  end

end
