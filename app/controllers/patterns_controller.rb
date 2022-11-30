# frozen_string_literal:true

class PatternsController < ApplicationController
  def points_by_polygons_shape
    pattern = Pattern.find(params[:id])
    render json: pattern.points_by_polygons_shape
  end

  def revealed_svg
    pattern = Pattern.find(params[:id])
    render html: helpers.svg("patterns/#{pattern.name}_revealed.svg")
  end
end
