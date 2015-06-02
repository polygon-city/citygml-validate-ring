// Validate a CityGML LinearRing against QIE spec
// See: https://github.com/tudelft3d/CityGML-QIE-3Dvalidation/blob/master/errors/errors.md#ring

// TODO: Test against a CityGML dataset containing valid and invalid geometry
// TODO: Implement test for GE_R_COLLAPSED_TO_LINE
// TODO: Support gml:pos for all tests (support needed in citygml-points)

var _ = require("lodash");
var async = require("async");
var polygonjs = require("polygon");
var isects = require("2d-polygon-self-intersections");

// Custom modules
var citygmlPoints = require("citygml-points");
var points3dto2d = require("points-3d-to-2d");

var citygmlValidateRing = function(ringXML, callback) {
  var points = citygmlPoints(ringXML);

  // Validate ring
  // Validation errors are stored within results array
  async.series([
    GE_R_TOO_FEW_POINTS(points),
    GE_R_CONSECUTIVE_POINTS_SAME(points),
    GE_R_NOT_CLOSED(points),
    GE_R_SELF_INTERSECTION(points)
    // GE_R_COLLAPSED_TO_LINE(points)
  ], function(err, results) {
    // Remove passes (undefined)
    var failures = _.filter(results, function(result) {
      return (result && result[0]);
    });

    callback(err, failures);
  });
};

// TODO: Support gml:pos
var GE_R_TOO_FEW_POINTS = function(points) {
  // A ring should have at least 3 points. For GML rings, this error ignores
  // the fact that the first and the last point of a ring are the same
  // (see GE_R_NOT_CLOSED), ie a GML ring should have at least 4 points.

  // Async pattern as per Pro JavaScript Frameworks book
  // Missing process.nextTick trick inside the function
  return function(callback) {
    // Minus 1 as duplicated last point isn't counted
    var pointCount = points.length - 1;

    if (pointCount > 2) {
      callback(null);
    } else {
      callback(null, [new Error("GE_R_TOO_FEW_POINTS: A ring should have at least 3 points."), points]);
    }
  };
};

var GE_R_CONSECUTIVE_POINTS_SAME = function(points) {
  // Points in a ring should not be repeated (except first-last in case of GML,
  // see GE_R_NOT_CLOSED). This error is for the common error where 2
  // consecutive points are at the same location. Error GE_R_SELF_INTERSECTION
  // is for points in a ring that are repeated, but not consecutive.

  return function(callback) {
    var duplicate = false;
    var lastPoint;

    _.each(points, function(point) {
      if (!duplicate && lastPoint) {
        if (_.isEqual(lastPoint, point)) {
          duplicate = true;
          duplicatedPoints = [lastPoint, point];
        }
      }

      lastPoint = point;
    });

    if (!duplicate) {
      callback(null);
    } else {
      callback(null, [new Error("GE_R_CONSECUTIVE_POINTS_SAME: Consecutive points in a ring should not be the same"), duplicatedPoints]);
    }
  };
};

var GE_R_NOT_CLOSED = function(points) {
  // This applies only to GML rings. The first and last points have to be
  // identical (at the same location).

  return function(callback) {
    var firstPoint = points[0];
    var lastPoint = points[points.length - 1];

    if (_.isEqual(firstPoint, lastPoint)) {
      callback(null);
    } else {
      callback(null, [new Error("GE_R_NOT_CLOSED: The first and last points have to be identical"), [firstPoint, lastPoint]]);
    }
  };
};

var GE_R_SELF_INTERSECTION = function(points) {
  // A ring should be simple, ie. it should not self-intersect. The
  // self-intersection can be at the location of an explicit point, or not.
  //
  // Example: https://github.com/tudelft3d/CityGML-QIE-3Dvalidation/raw/master/errors/figs/104.png

  return function(callback) {
    // Project 3D points onto a 2D plane for intersection testing
    // - Using 3D points would mask 2D intersection errors
    // - Doesn't check for or require planarity
    // - Ring will fail GE_P_NON_PLANAR_POLYGON_DISTANCE_PLANE if not planar
    var points2d = points3dto2d(points, false);

    // Use special intersection library to look for 2D self-intersections
    // See: https://github.com/tmpvar/polygon.js/issues/4
    // Returned intersection Y coordinates are currently incorrect
    // See: https://github.com/tmpvar/2d-polygon-self-intersections/issues/1
    var selfIntersections = isects(points2d.points);

    if (!selfIntersections || selfIntersections.length === 0) {
      callback(null);
    } else {
      callback(null, [new Error("GE_R_SELF_INTERSECTION: A ring should be simple, ie. it should not self-intersect"), selfIntersections]);
    }
  };
};

var GE_R_COLLAPSED_TO_LINE = function(points) {
  // A special case of self-intersection (GE_R_SELF_INTERSECTION): the ring is
  // collapsed to a line. If the geometry is collapsed to a point, then
  // GE_R_TOO_FEW_POINTS / GE_R_CONSECUTIVE_POINTS_SAME should be used.
  //
  // Example: https://github.com/tudelft3d/CityGML-QIE-3Dvalidation/raw/master/errors/figs/105.png
};

module.exports = citygmlValidateRing;
