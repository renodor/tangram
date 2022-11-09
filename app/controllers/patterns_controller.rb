# frozen_string_literal:true

class PatternsController < ApplicationController
  def show
    pattern = Pattern.find(params[:id])
    render json: {
      id: pattern.id,
      name: pattern.name,
      polygons: pattern.points_by_polygons_shape
    }
  end
end
