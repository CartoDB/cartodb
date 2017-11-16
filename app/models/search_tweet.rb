# encoding: UTF-8

class SearchTweet < Sequel::Model

  # @param id
  # @param user_id
  # @param table_id
  # @param data_import_id
  # @param service_item_id
  # @param retrieved_items
  # @param state
  # @param created_at
  # @param updated_at

  many_to_one :user
  many_to_one :table, class: :UserTable

  STATE_IMPORTING = 'importing'
  STATE_COMPLETE  = 'complete'
  STATE_FAILED  = 'failed'

  def self.get_twitter_imports_count(dataset, date_from, date_to)
    dataset
      .where('search_tweets.state = ?', ::SearchTweet::STATE_COMPLETE)
      .where('search_tweets.created_at >= ? AND search_tweets.created_at <= ?', date_from, date_to + 1.days)
      .sum("retrieved_items".lit).to_i
  end

  def set_importing_state
    @state = STATE_IMPORTING
    # For persisting into db
    self.state = @state
  end

  def set_complete_state
    @state = STATE_COMPLETE
    self.state = @state
  end

  def set_failed_state
    @state = STATE_FAILED
    self.state = @state
  end

  def before_save
    super
    self.updated_at = Time.now
  end

  def calculate_used_credits
    return 0 unless self.state == STATE_COMPLETE

    total_rows = self.retrieved_items
    quota = user.effective_twitter_total_quota

    # ::User#get_twitter_imports_count includes this run, so we discount it
    remaining_quota  = quota + total_rows - user.effective_get_twitter_imports_count
    remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
    used_credits     = total_rows - remaining_quota
    (used_credits > 0 ? used_credits : 0)
  end

  def price
    return 0 unless self.retrieved_items > 0

    if user.effective_twitter_block_price.nil? || calculate_used_credits.nil? \
       || user.effective_twitter_datasource_block_size.nil?
      CartoDB::Logger.error('Looks like user/org has not set all twitter block or price params', user: user)
      # As the import itself went well don't break execution, just return something
      0
    else
      (user.effective_twitter_block_price * calculate_used_credits) / user.effective_twitter_datasource_block_size.to_f
    end
  end

end
