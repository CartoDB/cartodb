# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/overlay/member'
require_relative '../../../services/data-repository/repository'

include CartoDB

describe Overlay::Member do
  before do
    Overlay.repository = DataRepository.new
  end

  describe '#initialize' do
    it 'sets the id by default' do
      Overlay::Member.new.id.should_not be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists attributes to the data repository' do
      member = Overlay::Member.new(type: 'bogus')
      vis_mock = mock
      member.stubs(:visualization).returns(vis_mock)
      vis_mock.expects(:invalidate_cache)
      member.store

      member = Overlay::Member.new(id: member.id)
      member.type.should be_nil

      member.fetch
      member.type.should == 'bogus'
    end

    it 'forbids saving 2+ overlays of certain types' do
      # Forbidding is checked at creation time (not updates) so need to always recreate the member to simulate it
      member = Overlay::Member.new(type: 'header')

      logo_overlay_mock = mock
      logo_overlay_mock.stubs(:type).returns('logo')

      header_overlay_mock = mock
      header_overlay_mock.stubs(:type).returns('header')

      text_overlay_mock = mock
      text_overlay_mock.stubs(:type).returns('text')

      vis_mock = mock
      vis_mock.stubs(:invalidate_cache)
      vis_mock.stubs(:overlays).returns([logo_overlay_mock])
      member.stubs(:visualization).returns(vis_mock)
      # ok
      member.store

      member = Overlay::Member.new(type: 'header')
      member.stubs(:visualization).returns(vis_mock)
      vis_mock.stubs(:overlays).returns([header_overlay_mock])
      expect {
        member.store
      }.to raise_error Overlay::DuplicateOverlayError


      member = Overlay::Member.new(type: 'text')
      member.stubs(:visualization).returns(vis_mock)
      vis_mock.stubs(:overlays).returns([text_overlay_mock, text_overlay_mock])
      # ok
      member.store
    end

    it 'allows updating of overlays of restricted-to-unique types' do
      header_overlay_mock = mock
      header_overlay_mock.stubs(:type).returns('header')

      vis_mock = mock
      vis_mock.stubs(:invalidate_cache)
      vis_mock.stubs(:overlays).returns([])

      member = Overlay::Member.new(type: 'header')
      member.stubs(:visualization).returns(vis_mock)
      # first store, all ok
      member.store

      # Updates, should be ok
      member.store
      member.store
      member.store
    end

    it 'allows deletion and re-creation of overlays of restricted-to-unique types' do
      header_overlay_mock = mock
      header_overlay_mock.stubs(:type).returns('header')

      vis_mock = mock
      vis_mock.stubs(:invalidate_cache)
      vis_mock.stubs(:overlays).returns([])

      member = Overlay::Member.new(type: 'header')
      member.stubs(:visualization).returns(vis_mock)
      member.store

      vis_mock.stubs(:overlays).returns([member])

      member.delete
      vis_mock.stubs(:overlays).returns([])

      member = Overlay::Member.new(type: 'header')
      member.stubs(:visualization).returns(vis_mock)
      member.store
    end

  end #store


  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      member = Overlay::Member.new(type: 'bogus')

      vis_mock = mock
      member.stubs(:visualization).returns(vis_mock)
      vis_mock.stubs(:invalidate_cache)

      member.store

      member = Overlay::Member.new(id: member.id)
      member.fetch
      member.type.should == 'bogus'
    end
  end #fetch

  describe '#delete' do
    xit 'deletes this member data from the data repository' do
      member = Overlay::Member.new(type: 'bogus')
      vis_mock = mock
      member.stubs(:visualization).returns(vis_mock)
      vis_mock.expects(:invalidate_cache).twice
      member.store

      member.fetch
      member.type.should_not be_nil

      member.delete
      member.type.should be_nil

      lambda { member.fetch }.should raise_error KeyError
    end
  end #delete

  describe '#hide/show' do
    it 'should change options to visible = false/true' do
      member = Overlay::Member.new({type: 't', options: {'display'=> true }})
      member.is_hidden.should == false
      member.hide
      member.options['display'].should == false
      member.is_hidden.should == true
      member.show
      member.is_hidden.should == false
      member.options['display'].should == true
    end
  end

end # Overlay::Member
