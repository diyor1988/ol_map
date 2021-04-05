var urlPath;
var zzz;
var count = 0;

//* Global Variable for Storing Draw Shape Type
var shapeType;

//* Global Variable for Lucking Screen Movement
var lock = true;

//* Global Variable for dash line state
var isDashLine;

//* Global Variable for Drawing Action
var drawAction;

//* Global Variable for Transform Action
var transformAction;

//* Global Variable for current selected item.
var selectedLayer = {};
var selectedFeature = {}; 

//* Zone Geo Json
var zoneGeoJson = {
    type: "FeatureCollection",
    features: []
};
// cable 
var cableArray = {};

var addedCable = [];

var tooltipContainer = document.getElementById('tooltip');
var tooltipContent = document.getElementById('tooltip-content');

var tooltip = new ol.Overlay({
    element: tooltipContainer,
    autoPan: true,
    autoPanAnimation: {
      duration: 500
    }
});

/********* upload external geojson file and display **********/

/*** vector source ***/
var extVector = function makeVector() {
  new ol.layer.Vector({
    source: new ol.source.Vector({
        url:'C:\Users\1\Downloads/openLayer.geojson',
        format: new ol.format.GeoJSON({
            featureProjection: 'EPSG:3857'
        }),
    }),
  })
}

function getfeatures(){
  var writer = new ol.format.GeoJSON();
  var geojsonStr = writer.writeFeatures(vectorSource.getFeatures());

  document.getElementById("demo").innerHTML = geojsonStr;
}

//* Upload Image
document
    .querySelector('input[type="file"]')
    .addEventListener("change", function () {
        if (this.files && this.files[0]) {
            urlPath = URL.createObjectURL(this.files[0]);
            count++;
            removeDivs();
            init(urlPath, null);
        }
    });

//* Remove Extra Divs
function removeDivs() {
    $("div.ol-viewport").remove();
}

//* Set Draw Shape Type as "None"
function initShapeType() {
    setShapeType("None")
}

//* Set Current Selected Layer and Feature to empty Object
function initSelectedZone() {
    selectedLayer = {};
    selectedFeature = {};
}

//* Set Shape Type as type
function setShapeType(type) {
    shapeType = type;
}

//* Get Current Shape Type
function getShapeType() {
    return shapeType;
}

//* Set as DashLine
function setDashSize(size) {
    isDashLine = size;
}

//* ******************************** *//
initShapeType();
init("assets/images/map-image.png", null);
var map, vector;

function init(imgUrl, source) {
    var ImgPath = imgUrl;

    var extent = [0, 0, 1024, 968];

    var projection = new ol.proj.Projection({
        code: "xkcd-image",
        units: "pixels",
        extent: extent,
    });

    var view = new ol.View({
        projection: projection,
        center: ol.extent.getCenter(extent),
        zoom: 0,
        maxZoom: 5
    });

    var imgLayer = new ol.layer.Image({
        source: new ol.source.ImageStatic({
            attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
            url: ImgPath,
            projection: projection,
            imageExtent: extent,
        }),
    });

    var raster = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });



    if(source == null) {
        source = new ol.source.Vector({ wrapX: false, title: "source" });
        vector = new ol.layer.Vector({
            className: 'draw-layer',
            source: source,
            title: "default",
            style: function (f) {
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            width: 1.5,
                            color: f.get("color") || [255, 128, 0],
                        }),
                        fill: new ol.style.Fill({
                            color: (f.get("color") || [255, 128, 0]).concat([0.3]),
                        }),
                    }),
                    fill: new ol.style.Fill({
                        color: f.get("color") || "rgba(255, 255, 255, 0.2)",
                    }),
                    stroke: new ol.style.Stroke({
                        width: 2,
                        lineDash: [isDashLine],
                        color: f.get("color") || [255, 128, 0],
                    }),
                });
            },
        });
        map = new ol.Map({
            layers: [imgLayer, vector],
            target: "map",
            interactions: ol.interaction.defaults({
                dragPan: lock,
            }),
            loadTilesWhileAnimating: true,
            view: view,
        });
    }
    else {
        clearMapLayers(map);
        vector = new ol.layer.Vector({
            className: 'draw-layer',
            source: source,
            title: "default",
            style: function (f) {
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            width: 1.5,
                            color: f.get("color") || [255, 128, 0],
                        }),
                        fill: new ol.style.Fill({
                            color: (f.get("color") || [255, 128, 0]).concat([0.3]),
                        }),
                    }),
                    fill: new ol.style.Fill({
                        color: f.get("color") || "rgba(255, 255, 255, 0.2)",
                    }),
                    stroke: new ol.style.Stroke({
                        width: 2,
                        lineDash: [isDashLine],
                        color: f.get("color") || [255, 128, 0],
                    }),
                });
            },
        });
        map = new ol.Map({
            layers: [imgLayer, vector],
            target: "map",
            interactions: ol.interaction.defaults({
                dragPan: lock,
            }),
            loadTilesWhileAnimating: true,
            view: view,
        });
    }
    
    function addDrawAction() {
        removeTransformAction();

        var value = getShapeType();

        if (value !== "None") {
            var geometryFunction;

            if (value === "Square") {
                value = "Circle";
                geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
            }
            else if (value === "Box") {
                value = "Circle";
                geometryFunction = ol.interaction.Draw.createBox();
            }
            else if (value === 'Star') {
                value = 'Circle';
                geometryFunction = function (coordinates, geometry) {
                    var center = coordinates[0];
                    var last = coordinates[coordinates.length - 1];
                    var dx = center[0] - last[0];
                    var dy = center[1] - last[1];
                    var radius = Math.sqrt(dx * dx + dy * dy);
                    var rotation = Math.atan2(dy, dx);
                    var newCoordinates = [];
                    var numPoints = 12;
                    for (var i = 0; i < numPoints; ++i) {
                        var angle = rotation + (i * 2 * Math.PI) / numPoints;
                        var fraction = i % 2 === 0 ? 1 : 0.5;
                        var offsetX = radius * fraction * Math.cos(angle);
                        var offsetY = radius * fraction * Math.sin(angle);
                        newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                    }
                    newCoordinates.push(newCoordinates[0].slice());
                    if (!geometry) {
                        geometry = new ol.geom.Polygon([newCoordinates]);
                    } else {
                        geometry.setCoordinates([newCoordinates]);
                    }
                    return geometry;
                };
            }

            /** @type {ol.geom.GeometryType} */
            drawAction = new ol.interaction.Draw({
                source,
                type: value,
                geometryFunction,
            });

            drawAction.on('drawend', function(event) {
              var geometry = event.feature.getGeometry();
              var coord = [];
              
              if(shapeType =="Circle") {
                var circle = event.feature.getGeometry();
                value = "Point"
                coord = [circle.getCenter(), circle.getRadius()]
                insertPolygonDataIntoGeoJson ("Point", coord)
              }
              else if(shapeType == "LineString") {
                  value = "LineString";
                  coord = geometry.getCoordinates();
                  insertPolygonDataIntoGeoJson ("LineString", coord)
              }
              else {
                coord = geometry.getCoordinates()[geometry.getCoordinates().length-1];
                insertPolygonDataIntoGeoJson ("Polygon", coord)
              }
            });

            map.addInteraction(drawAction);
        }
    }

    function addTransformAction() {
        initShapeType();
        initInteractions();

        if (transformAction != undefined) {
            transformAction = undefined
        }

        transformAction = new ol.interaction.Transform({
            enableRotatedTransform: false,
            addCondition: ol.events.condition.shiftKeyOnly,
            hitTolerance: 2,
            translateFeature: true,
            scale: true,
            translate: true,
            stretch: true,
        });

        map.addInteraction(transformAction);
    }

    //* ******************** Lock or Unlock Screen ******************** *//
    $(document).on("click", "#lock", null, function () {
        lock = !lock;

        var dragPan;
        map.getInteractions().forEach(function (interaction) {
            if (interaction instanceof ol.interaction.DragPan) {

                dragPan = interaction;
            }
        }, this);
        zzz = dragPan;
        map.removeInteraction(dragPan);
    });

    $(document).on("click", "#unlock", null, function () {
        if (zzz) map.addInteraction(zzz);
    });

    //* ******************** Rotate ******************** *//
    $(document).on("click", "#rotate-left", null, function () {
        view.animate({
            rotation: view.getRotation() + Math.PI / 2,
        });
    });

    $(document).on("click", "#rotate-right", null, function () {
        view.animate({
            rotation: view.getRotation() - Math.PI / 2,
        });
    });

    //* ******************** Create Zone ******************** *//
    $(document).on("click", "#btn_add_zone", null, function () {
        var $zoneElem = $("#zone_list");
        var selectedZone = {
            type: "Feature",
            properties: {
                id: Number($zoneElem.val()),
                text: $('#zone_list option:selected').html(),
            },
            geometry: {
                type: "Polygon",
                coordinates: [[[0, 800], [500, 800], [500, 0], [0, -0]]]
            }
        }

        var isAdded = zoneGeoJson.features.find(function (item) {
            return item.properties.id === selectedZone.properties.id;
        });

        if (isAdded) {
            alert(`${selectedZone.properties.text} Already Added`);
            return;
        }

        zoneGeoJson.features.push(selectedZone);

        drawZone(selectedZone);

        $("#translateFeature").trigger('click');
    });

    //* ******************** Create Cable ******************** *//
    $(document).on("click", "#btn_add_cable", null, function () {
        initInteractions();
        // Data to draw on the map
        var $cableElem = $("#cable_list");
        var sizeofDots = $cableElem.val().split("#")[0] * 1;
        var maxLength = $cableElem.val().split("#")[1] * 1;
        var unitLength = maxLength / (sizeofDots - 1);
        var coordinatesArray = [];
        for (var i = 0; i < sizeofDots; i++) {
            coordinatesArray.push([unitLength * i, 500]);
        }

        var currentCable = {
            type: "Feature",
            properties: {
                id: $cableElem.val(),
                text: $('#cable_list option:selected').html(),
            },
            geometry: {
                type: "LineString",
                coordinates: coordinatesArray
            }
        }
        var isAdded = zoneGeoJson.features.find(function (item) {
            return item.properties.id === currentCable.properties.id;
        });

        if (isAdded) {
            alert(`${currentCable.properties.text} Already Added`);
            return;
        }

        zoneGeoJson.features.push(currentCable);
        cableArray[$cableElem.val()] = coordinatesArray;

        drawCable(currentCable);
    });

    //* ******************** Create Menu Scaling Handler ******************** *//
    $(document).on("click", "#displayScaling", null, function () {

        var $dist = $("#distUnit");
        var $distance = $("#distance").val();

        if (!$distance) {
            alert("DISTANCE value is empty!");
            return false;
        }
        // var width;

        // if ($dist.val() == 0) {
        //     width = 700 * $distance / 20;
        // } else {
        //     width = 1000 * $distance / 20;
        // }

        var selectedUnit = {
            type: "Feature",
            properties: {
                id: Number($dist.val()),
                text: $('#distUnit option:selected').html(),
            },
            geometry: {
                type: "LineString",
                coordinates: [[500, 900], [1300, 900]]
            }
        }

        zoneGeoJson.features.push(selectedUnit);

        initInteractions();
        // Data to draw on the map
        var lstring = selectedUnit.geometry.coordinates;
        var features = new ol.Collection();
        features.push (new ol.Feature( new ol.geom.LineString(lstring)));

        var vector = new ol.layer.Vector({
          name: 'addDottedLinesLayers',
          source: new ol.source.Vector({ features: features }),
          style: function(f) {  
            return [ 
            new ol.style.Style({
              stroke: new ol.style.Stroke({ color:"green", width:3 }),
              text: new ol.style.Text({
                text:  $distance + "  " +selectedUnit.properties.text,
                offsetY: -10,
                scale: 1.5,
                fill: new ol.style.Fill({
                  color: 'green'
                }),
                stroke: new ol.style.Stroke({
                  color: 'green',
                  width: 0.5
                })
              })
            }),
            ]
          }
        })
        map.addLayer(vector);

        var mod = new ol.interaction.Modify({
            features: features,
            deleteCondition: evt => { return false },
            insertVertexCondition: e => { return false }
        });
        map.addInteraction(mod);

        $("#distance").val('');
    });

    //* ******************** Create Menu Click Handler ******************** *//
    $(document).on("click", "#rectangle-click", null, function () {
        setDashSize(0);
        setShapeType("Box")
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#square-click", null, function () {
        setDashSize(0);
        setShapeType("Square");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#star-click", null, function () {
        setDashSize(0);
        setShapeType("Star");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#line-click", null, function () {
        setDashSize(0);
        setShapeType("LineString");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#dotted-click", null, function () {
        setDashSize(4);
        setShapeType("LineString");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#polygon-click", null, function () {
        setDashSize(0);
        setShapeType("Polygon");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#circle-click", null, function () {
        setDashSize(0);
        setShapeType("Circle");
        initInteractions();
        addDrawAction();
    });

    $(document).on("click", "#none-click", null, function () {
        initShapeType();
        initInteractions();
        addTransformAction();
    });

    function initInteractions() {
        map.removeInteraction(drawAction);
    }

    function removeTransformAction() {
        map.removeInteraction(transformAction);
    }

    //* Event Handler when single click occurs
    function onSingleClick(browserEvent) {
        var coordinate = browserEvent.coordinate;
        var pixel = map.getPixelFromCoordinate(coordinate);

        //* Init as unselected every click
        initSelectedZone();
        var isTopZone = true;

        map.forEachFeatureAtPixel(pixel, function (feature, layer) {
            if (layer && isTopZone) {
                selectedFeature = feature;
                selectedLayer = layer;
                isTopZone = false;
            }
        });
    }
    map.on('singleclick', onSingleClick);

    // Event Handler when hover
    map.addOverlay(tooltip);
    map.on("pointermove", function (evt) {
        var featureText = '';
        var featureID = '';
        var coordinates;
        var hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            var selectedZone = feature.getProperties();
            if(selectedZone.features != undefined && selectedZone.features[0].getProperties().text.search('Cable') > -1) {
                featureText = selectedZone.features[0].getProperties().text;
                featureID = selectedZone.features[0].getProperties().id;
                coordinates = feature.getGeometry().getCoordinates();
                return true;
            } else {
                return false;
            }
        }); 
        if (hit) {
            var length = 0;
            var lineString = [];
            for (var i = 0; i < cableArray[featureID].length; i++) {
                var is_same = cableArray[featureID][i].every(function(element, index) {
                    return element === coordinates[index]; 
                });
                lineString.push(cableArray[featureID][i]);
                if (is_same) break;
            }
            var features = new ol.Collection();
            features.push(new ol.Feature({
                geometry: new ol.geom.LineString(lineString)
            }));

            length = features.array_[0].getGeometry().getLength();
            
            tooltipContent.innerHTML = '<p>' + length.toFixed(0) + '</p>';
            tooltip.setPosition(coordinates);
        } else {
            tooltip.setPosition(undefined);
        }
    });

    //* ******************** Create for Delete and Move Event ******************** *//
    $(document).on("click", "#translateFeature", null, function () {
        removeTransformAction();
        addTransformAction()
    });

    $(document).on("click", "#btnDelete", null, function () {
        initShapeType();
        initInteractions();

        if (Object.values(selectedLayer).length && Object.values(selectedFeature).length) {
            var selectedZone = selectedFeature.getProperties();

            var newFeatures = [];
            //* Remove deleted item from zoneGeoJson feature list
            if (Object.values(selectedZone).length !== 0) {
                var isSelected = zoneGeoJson.features.find(function (item) {
                    return item.properties.text === selectedZone.text;
                });

                zoneGeoJson.features.map((feature, index) => {
                    if (feature !== isSelected) {
                        newFeatures.push(feature)
                    }
                })

                zoneGeoJson.features = newFeatures;
            };


            if (selectedZone.text) {
                removeLayersFromMap(getSelectedLayer(selectedZone));
            } else {
                removeFeaturesFromDrawingLayer(selectedFeature, selectedLayer.getSource());
            }
        }
    });

    // Style
    function getStyle(feature) {
        return [new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({ color: [0, 0, 255, 0.4] }),
                stroke: new ol.style.Stroke({ color: [0, 0, 255, 1], width: 1 }),
                radius: 10,
                points: 3,
                angle: feature.get('angle') || 0
            }),
            fill: new ol.style.Fill({ color: '#FFE4B290' }),
            stroke: new ol.style.Stroke({ color: '#F7BD90', width: 2 }),
            text: new ol.style.Text({ text: feature.get('text'), fill: new ol.style.Fill({ color: '#7358B2' }) })
        })];
    }

    function drawZone(zone) {
        var geojsonObject = {};

        if (zone.type.toLowerCase() === 'feature') {
            geojsonObject = {
                type: "FeatureCollection",
                features: [zone]
            };
        }
        if (zone.type.toLowerCase() === 'featurecollection') {
            geojsonObject = zone;
        }

        var features = (new ol.format.GeoJSON()).readFeatures(geojsonObject);
        // New vector layer
        vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                features,
                wrapX: false
            }),
            style: getStyle,
            title: "zoneLayer"
        });

        map.addLayer(vector);
    }

    function drawCable(currentCable) {        
        initInteractions();
        // Data to draw on the map
        var lineString = currentCable.geometry.coordinates;
        var features = new ol.Collection();
        features.push(new ol.Feature({
            geometry: new ol.geom.LineString(lineString),
            text: currentCable.properties.text,
            id: currentCable.properties.id
        }));


        var vector = new ol.layer.Vector({
            name: 'addDottedLinesLayers',
            source: new ol.source.Vector({ features : features }),
            title: "cableLayer",
            style: function (f) {
                var opt = {
                    tension: Number($("#tension").val()),
                    pointsPerSeg: 2,
                    normalize: $("#normalize").prop("checked")
                };
                var csp = f.getGeometry().cspline(opt);
                return [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({ color: "red", width: 1 }),
                        geometry: $("#cspline").prop("checked") ? csp : null,
                        text: new ol.style.Text({
                            text: currentCable.properties.text,
                            offsetY: -10,
                            scale: 1.3,
                            fill: new ol.style.Fill({
                                color: 'blue'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#FFFF99',
                                width: 3.5
                            })
                        })
                    }),
                    new ol.style.Style({
                        image: new ol.style.Circle({ stroke: new ol.style.Stroke({ color: "blue", width: 1 }), radius: 1 }),
                        geometry: ($("#dpt").prop("checked") && $("#cspline").prop("checked")) ? new ol.geom.MultiPoint(csp.getCoordinates()) : null
                    }),
                    new ol.style.Style({
                        image: new ol.style.Circle({ stroke: new ol.style.Stroke({ color: "red", width: 4 }), radius: 2 }),
                        geometry: new ol.geom.MultiPoint(f.getGeometry().getCoordinates())
                    })
                ]
            }
        })
        map.addLayer(vector);

        var mod = new ol.interaction.Modify({
            features: features,
            deleteCondition: evt => { return false },
            insertVertexCondition: e => { return false }
        });
        mod.on('modifyend', function(event) {
            var featureID = features.array_[0].getProperties().id;
            cableArray[featureID] = features.array_[0].getGeometry().getCoordinates();
        });
        map.addInteraction(mod);
    }

    function getSelectedLayer(selectedZone) {
        var selectedLayer;

        map.getLayers().forEach(layer => {
            const zoneValue = layer.getProperties().source.uidIndex_;
            if (zoneValue && Object.values(zoneValue).length !== 0) {
                for (value in zoneValue) {
                    if (selectedZone.text && zoneValue[value].values_.text === selectedZone.text) {
                        selectedLayer = layer;
                    }
                }
            }
        });

        return selectedLayer;
    }

    function removeFeaturesFromDrawingLayer(feature, layer) {
        layer.removeFeature(feature)
    }

    function removeLayersFromMap(layer) {
        map.removeLayer(layer);
    }

    /*****select polygon***/
    $("#colorPicker").change(function () {
        let userColor = $(this).val();

        initShapeType();
        initInteractions();

        var fill = new ol.interaction.FillAttribute({}, { color: userColor });
        map.addInteraction(fill);
    });

    const download = $('#btnSave')[0];

    $(document).on("click", "#btnSave", null, function(){
        updateCoords()

        download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(zoneGeoJson)));
        download.setAttribute('download', "openLayer.geojson");
    })

    /****** make image geojson data ******/
    var insertPolygonDataIntoGeoJson = function (type, coordinates) {
        var newPolygon = {
          type: "Feature",
          properties: {
            id: 'CD' + Date.now(),
            text: "Custom Drawing"
          },
          geometry: {
            type: type,
            coordinates: coordinates
          } 
        }
        zoneGeoJson.features.push(newPolygon);
    }

    var insertPolygonDataIntoGeoJsonWithProperty = function (type, coordinates, title) {
      var newPolygon = {
        type: "Feature",
        properties: {
          id: 'CD' + Date.now(),
          text: title
        },
        geometry: {
          type: type,
          coordinates: coordinates
        } 
      }
      zoneGeoJson.features.push(newPolygon);
    }

    /****** get last coordinates ******/
    function updateCoords () {    
        zoneGeoJson = {
          type: "FeatureCollection",
          features: []
        }; 

        var this_ = this, layer_, layersToLookFor = [];  //layer.get('title')

        var check = function(layer)
        {
          var source = layer.getSource();
          if(source instanceof ol.source.Vector)
          {
            var features = source.getFeatures();
            if(features.length > 0)
            {
              features.forEach(feature => {
                console.log('type = ', feature.getGeometry().getType());
                console.log('title = ', layer.get('title'));
                
                if(feature.getGeometry().getType() == "Circle") {
                  insertPolygonDataIntoGeoJsonWithProperty("Point", {"center":feature.getGeometry().getCenter(), "radius":feature.getGeometry().getRadius()}, "circleLayer")
                }
                else if(feature.getGeometry().getType() == "LineString") {
                  insertPolygonDataIntoGeoJsonWithProperty("LineString", feature.getGeometry().getCoordinates())
                }
                else {
                  insertPolygonDataIntoGeoJsonWithProperty("Polygon", feature.getGeometry().getCoordinates(), layer.get('title'))
                }
              });
              
              layersToLookFor.push({
                layer: layer,
                features: features
              });
            }
          }
        };

        //loop through map layers
        map.getLayers().forEach(function(layer){
          if (layer instanceof ol.layer.Group) {
              layer.getLayers().forEach(check);
          } else {
              check(layer);
          }
        });

        layersToLookFor.forEach(function(obj)
        {
          var found = obj.features.some(function(feature){
              return this_ === feature;
          });

          if(found){
              //this is the layer we want
              layer_ = obj.layer;
          }
        });

        return layer_;
    }

    /********* clear map *********/ 
    function clearMapLayers (map) {
        const layers = [...map.getLayers().getArray()]
        layers.forEach((layer) => map.removeLayer(layer))
    }
}

document
    .querySelector('input[name="input_json"]')
    .addEventListener("change", function () {
        if (this.files && this.files[0]) {
            urlPath = URL.createObjectURL(this.files[0]);    
            removeDivs();
            // clearMapLayers();
            drawExtGeoJson(urlPath)
        }
        else{
          console.log("GeoJson file dosen't exist!");
        }
    });

function drawExtGeoJson(urlPath) {

  var source = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    loader: function(extent, resolution, projection) {
        var proj = projection.getCode();
        var url = urlPath;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        var onError = function() {
        vectorSource.removeLoadedExtent(extent);
      }

      xhr.onerror = onError;
      xhr.onload = function() {
        if (xhr.status == 200) {
          source.addFeatures(
          source.getFormat().readFeatures(xhr.responseText));
        } 
        else {
          onError();
        }
     }
     xhr.send();
   },
  });

  init("assets/images/map-image.png", source);
}
