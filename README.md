# CityGML Validate Ring

Validate a CityGML ring against the [QIE suite](https://github.com/tudelft3d/CityGML-QIE-3Dvalidation/blob/master/errors/errors.md#ring)

## Usage

```javascript
var citygmlBoundaries = require("citygml-boundaries");
var citygmlValidateRing = require("citygml-validate-ring");

var xml = "..."; // Some CityGML
var boundaries = citygmlBoundaries(xml);

// Validate exterior ring
citygmlValidateRing(boundaries.exterior[0], function(err, results) {
  if (err) {
    console.log("Exterior ring not valid:", err, results);
  } else {
    console.log("Exterior ring valid");
  }
});
```
