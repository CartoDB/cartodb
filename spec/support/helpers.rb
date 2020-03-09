require_relative '../../app/models/visualization/member'
require_relative '../helpers/file_server_helper'
require 'json'

class Integer
  def success?; self == 200; end
end

module HelperMethods
  include FileServerHelper

  def prepare_oauth_request(consumer, url, options={})
    url = URI.parse(url)
    http = Net::HTTP.new(url.host, url.port)
    if options[:form_data]
      req = Net::HTTP::Post.new(url.request_uri)
      req.set_form_data(options[:form_data])
    else
      req = Net::HTTP::Get.new(url.request_uri)
    end
    req.oauth!(http, consumer, options[:token])
    req
  end

  def upload_file(file_path, mime_type)
    fixture_file_upload(Rails.root.join(file_path), mime_type)
  end

  def http_json_headers
    { "CONTENT_TYPE" => "application/json", :format => "json", 'HTTP_ACCEPT' => 'application/json' }
  end

  def get_json(path, params = {}, headers = http_json_headers)
    get path, params, headers
    the_response = response || get_last_response
    response_parsed = the_response.body.blank? ? {} : ::JSON.parse(the_response.body)
    yield OpenStruct.new(
      body: (response_parsed.is_a?(Hash) ? response_parsed.deep_symbolize_keys : response_parsed),
      status: the_response.status,
      headers: the_response.headers
    ) if block_given?
  end

  def put_json(path, params = {}, headers = http_json_headers)
    headers = headers.merge("CONTENT_TYPE" => "application/json", 'HTTP_ACCEPT' => 'application/json')
    put path, JSON.dump(params), headers
    the_response = response || get_last_response
    response_parsed = the_response.body.blank? ? {} : ::JSON.parse(the_response.body)
    yield OpenStruct.new(
      body: (response_parsed.is_a?(Hash) ? response_parsed.deep_symbolize_keys : response_parsed),
      status: the_response.status,
      headers: the_response.headers
    ) if block_given?
  end

  def post_json(path, params = {}, headers = http_json_headers)
    headers = headers.merge("CONTENT_TYPE" => "application/json", 'HTTP_ACCEPT' => 'application/json')
    post path, JSON.dump(params), headers
    the_response = response || get_last_response
    response_parsed = the_response.body.blank? ? {} : ::JSON.parse(the_response.body)
    yield OpenStruct.new(
      body: (response_parsed.is_a?(Hash) ? response_parsed.deep_symbolize_keys : response_parsed),
      status: the_response.status,
      headers: the_response.headers
    ) if block_given?
  end

  def delete_json(path, params = {}, headers = http_json_headers)
    headers = headers.merge("CONTENT_TYPE" => "application/json", 'HTTP_ACCEPT' => 'application/json')
    delete path, JSON.dump(params), headers
    the_response = response || get_last_response
    response_parsed = (the_response.body.blank? || the_response.body.to_s.length < 2) ? {} : ::JSON.parse(the_response.body)
    yield OpenStruct.new(
      body: (response_parsed.is_a?(Hash) ? response_parsed.deep_symbolize_keys : response_parsed),
      status: the_response.status,
      headers: the_response.headers
    ) if block_given?
  end

  def get_last_response
    (defined? last_response) ? last_response : OpenStruct.new(:body => '')
  end

  def parse_json(response, &block)
    response_parsed = response.body.blank? ? {} : JSON.parse(response.body)
    yield OpenStruct.new(
      body: (response_parsed.is_a?(Hash) ? response_parsed.deep_symbolize_keys : response_parsed),
      status: response.statu
    )
  end

  def default_schema
    [
      ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
      ["the_geom", "geometry", "geometry", "geometry"]
    ]
  end

  def random_attributes_for_vis_member(attributes={})
    random = UUIDTools::UUID.timestamp_create.to_s
    {
      name:               attributes.fetch(:name, "name #{random}"),
      display_name:       attributes.fetch(:display_name, "display name #{random}"),
      description:        attributes.fetch(:description, "description #{random}"),
      privacy:            attributes.fetch(:privacy, Visualization::Member::PRIVACY_PUBLIC),
      tags:               attributes.fetch(:tags, ['tag 1']),
      type:               attributes.fetch(:type, Visualization::Member::TYPE_CANONICAL),
      user_id:            attributes.fetch(:user_id),   # Mandatory
      active_layer_id:    random,
      title:              attributes.fetch(:title, ''),
      source:             attributes.fetch(:source, ''),
      license:            attributes.fetch(:license, ''),
      attributions:       attributes.fetch(:attributions, ''),
      parent_id:          attributes.fetch(:parent_id, nil),
      kind:               attributes.fetch(:kind, Visualization::Member::KIND_GEOM),
      prev_id:            attributes.fetch(:prev_id, nil),
      next_id:            attributes.fetch(:next_id, nil),
      transition_options: attributes.fetch(:transition_options, {}),
      active_child:       attributes.fetch(:active_child, nil),
      locked:             attributes.fetch(:locked, false)
    }
  end
end
