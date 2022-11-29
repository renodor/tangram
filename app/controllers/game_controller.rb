# frozen_string_literal:true

class GameController < ApplicationController
  before_action :authenticate_user!

  def play
    @patterns = Pattern.all
    @current_pattern = @patterns.sample
    @current_pattern_json = {
      id: @current_pattern.id,
      name: @current_pattern.name,
      polygons: @current_pattern.points_by_polygons_shape
    }.to_json
  end
end
