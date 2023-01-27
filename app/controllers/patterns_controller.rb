# frozen_string_literal:true

class PatternsController < ApplicationController
  def show
    pattern = Pattern.find(params[:id])
    render json: {
      solutions: pattern.solutions.map(&:points_by_polygons_shape),
      solved: pattern.solved?(current_user)
    }
  end

  def filled_svg
    pattern = Pattern.find(params[:id])
    render html: helpers.svg("patterns/#{pattern.name}_filled.svg")
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
