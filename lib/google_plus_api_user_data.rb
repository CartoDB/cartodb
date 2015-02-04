class GooglePlusAPIUserData

  def initialize(parsed_response)
    @parsed_response = parsed_response
  end

  def email
    @parsed_response['emails'].select { |mail| mail['type'] == 'account' }.first['value']
  rescue
    nil
  end

  def id
    @parsed_response['id']
  end

end

