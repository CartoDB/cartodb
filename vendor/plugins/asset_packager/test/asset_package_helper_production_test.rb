$:.unshift(File.dirname(__FILE__) + '/../lib')

require File.dirname(__FILE__) + '/../../../../config/environment'
require 'test/unit'
require 'rubygems'
require 'mocha'

require 'action_controller/test_process'

ActionController::Base.logger = nil
ActionController::Routing::Routes.reload rescue nil

class AssetPackageHelperProductionTest < Test::Unit::TestCase
  include ActionController::Assertions::DomAssertions
  include ActionController::TestCase::Assertions
  include ActionView::Helpers::TagHelper
  include ActionView::Helpers::AssetTagHelper
  include Synthesis::AssetPackageHelper

  cattr_accessor :packages_built

  def setup
    Synthesis::AssetPackage.asset_base_path    = "#{Rails.root}/vendor/plugins/asset_packager/test/assets"
    Synthesis::AssetPackage.asset_packages_yml = YAML.load_file("#{Rails.root}/vendor/plugins/asset_packager/test/asset_packages.yml")

    Synthesis::AssetPackage.any_instance.stubs(:log)
    self.stubs(:should_merge?).returns(true)

    @controller = Class.new do
      def request
        @request ||= ActionController::TestRequest.new
      end
    end.new

    build_packages_once
  end

  def build_packages_once
    unless @@packages_built
      Synthesis::AssetPackage.build_all
      @@packages_built = true
    end
  end
  
  def build_js_expected_string(*sources)
    sources.map {|s| javascript_include_tag(s) }.join("\n")
  end
    
  def build_css_expected_string(*sources)
    sources.map {|s| stylesheet_link_tag(s) }.join("\n")
  end

  def test_js_basic
    current_file = Synthesis::AssetPackage.find_by_source("javascripts", "prototype").current_file
    assert_dom_equal build_js_expected_string(current_file),
      javascript_include_merged("prototype")
  end

  def test_js_multiple_packages
    current_file1 = Synthesis::AssetPackage.find_by_source("javascripts", "prototype").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("javascripts", "foo").current_file

    assert_dom_equal build_js_expected_string(current_file1, current_file2), 
      javascript_include_merged("prototype", "foo")
  end
  
  def test_js_unpackaged_file
    current_file1 = Synthesis::AssetPackage.find_by_source("javascripts", "prototype").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("javascripts", "foo").current_file
    
    assert_dom_equal build_js_expected_string(current_file1, current_file2, "not_part_of_a_package"), 
      javascript_include_merged("prototype", "foo", "not_part_of_a_package")
  end
  
  def test_js_multiple_from_same_package
    current_file1 = Synthesis::AssetPackage.find_by_source("javascripts", "prototype").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("javascripts", "foo").current_file

    assert_dom_equal build_js_expected_string(current_file1, "not_part_of_a_package", current_file2), 
      javascript_include_merged("prototype", "effects", "controls", "not_part_of_a_package", "foo")
  end
  
  def test_js_by_package_name
    package_name = Synthesis::AssetPackage.find_by_target("javascripts", "base").current_file
    assert_dom_equal build_js_expected_string(package_name), 
      javascript_include_merged(:base)
  end
  
  def test_js_multiple_package_names
    package_name1 = Synthesis::AssetPackage.find_by_target("javascripts", "base").current_file
    package_name2 = Synthesis::AssetPackage.find_by_target("javascripts", "secondary").current_file
    assert_dom_equal build_js_expected_string(package_name1, package_name2), 
      javascript_include_merged(:base, :secondary)
  end
  
  def test_css_basic
    current_file = Synthesis::AssetPackage.find_by_source("stylesheets", "screen").current_file
    assert_dom_equal build_css_expected_string(current_file),
      stylesheet_link_merged("screen")
  end

  def test_css_multiple_packages
    current_file1 = Synthesis::AssetPackage.find_by_source("stylesheets", "screen").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("stylesheets", "foo").current_file
    current_file3 = Synthesis::AssetPackage.find_by_source("stylesheets", "subdir/bar").current_file

    assert_dom_equal build_css_expected_string(current_file1, current_file2, current_file3), 
      stylesheet_link_merged("screen", "foo", "subdir/bar")
  end
  
  def test_css_unpackaged_file
    current_file1 = Synthesis::AssetPackage.find_by_source("stylesheets", "screen").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("stylesheets", "foo").current_file
    
    assert_dom_equal build_css_expected_string(current_file1, current_file2, "not_part_of_a_package"), 
      stylesheet_link_merged("screen", "foo", "not_part_of_a_package")
  end
  
  def test_css_multiple_from_same_package
    current_file1 = Synthesis::AssetPackage.find_by_source("stylesheets", "screen").current_file
    current_file2 = Synthesis::AssetPackage.find_by_source("stylesheets", "foo").current_file
    current_file3 = Synthesis::AssetPackage.find_by_source("stylesheets", "subdir/bar").current_file

    assert_dom_equal build_css_expected_string(current_file1, "not_part_of_a_package", current_file2, current_file3), 
      stylesheet_link_merged("screen", "header", "not_part_of_a_package", "foo", "bar", "subdir/foo", "subdir/bar")
  end
  
  def test_css_by_package_name
    package_name = Synthesis::AssetPackage.find_by_target("stylesheets", "base").current_file
    assert_dom_equal build_css_expected_string(package_name), 
      stylesheet_link_merged(:base)
  end
  
  def test_css_multiple_package_names
    package_name1 = Synthesis::AssetPackage.find_by_target("stylesheets", "base").current_file
    package_name2 = Synthesis::AssetPackage.find_by_target("stylesheets", "secondary").current_file
    package_name3 = Synthesis::AssetPackage.find_by_target("stylesheets", "subdir/styles").current_file
    assert_dom_equal build_css_expected_string(package_name1, package_name2, package_name3), 
      stylesheet_link_merged(:base, :secondary, "subdir/styles")
  end
  
end
