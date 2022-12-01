# frozen_string_literal:true

class PatternsController < ApplicationController
  def show
    pattern = Pattern.find(params[:id])
    render json: {
      polygons: pattern.points_by_polygons_shape,
      solved: pattern.solved?(current_user)
    }
  end

  def revealed_svg
    pattern = Pattern.find(params[:id])

    if pattern.solved?(current_user)
      render html: helpers.svg("patterns/#{pattern.name}_revealed.svg")
    else
      head :unauthorized
    end
  end
end
