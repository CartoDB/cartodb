class Fixnum
  def success?; self == 200; end
end

module HelperMethods

  def log_in_as(user)
    visit login_path
    fill_in 'email', :with => user.email
    fill_in 'password', :with => user.password || user.email.split('@').first
    click_link_or_button 'Sign in'
  end

  def authenticate_api(user)
    post '/sessions/create', {:email => user.email, :password => user.email.split('@').first}
  end

  def get_json(path, params = {}, headers ={}, &block)
    get path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def put_json(path, params = {}, headers ={}, &block)
    put path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def post_json(path, params = {}, headers ={}, &block)
    post path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def delete_json(path, headers ={}, &block)
    delete path, {}, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def click(*args)
    click_link_or_button(*args)
  end

  def parse_json(response, &block)
    response_parsed = response.body.blank? ? {} : JSON.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status)
  end

  def disable_confirm_dialogs
    # Disables confirm dialogs in selenium
    page.execute_script('window.confirm = function() { return true; }')
  end

  def peich
    save_and_open_page
  end

  def default_schema
    [
      ["cartodb_id", "number"], ["name", "string"], ["description", "string"], 
      ["the_geom", "geometry", "geometry", "geometry"], ["created_at", "date"], ["updated_at", "date"]
    ]
  end

end

RSpec.configuration.include HelperMethods, :type => :acceptance
