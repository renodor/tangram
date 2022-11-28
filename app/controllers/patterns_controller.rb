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

  def revealed_svg
    pattern = Pattern.find(params[:id])
    render html: helpers.svg("patterns/#{pattern.name}_revealed.svg")
  end
end
