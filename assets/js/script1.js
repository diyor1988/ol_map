var urlPath;
var zzz;
var count = 0;


var intersected = false;

//* Global Variable for Storing Draw Shape Type
var shapeType;

//* Global Variable for Lucking Screen Movement
var lock = true;

//* Global Variable for dash line state
var isDashLine;

//* Global Variables for Actions
var actionOnMap;

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
var cableOriginArray = {};
var cablePointArray = {};
var alertList = {};

var addedCable = [];

// image file name
var tempImageName = "map-image.png";
// image files for copy
var tempImageInfo = {};
// image asset folder url
var imageAssetUrl = "assets/images/"


var tooltipContainer = document.getElementById('tooltip');
var tooltipContent = document.getElementById('tooltip-content');

var tooltip = new ol.Overlay({
    element: tooltipContainer,
    autoPan: true,
    autoPanAnimation: {
        duration: 500
    }
});

var imagePath = ""

/********* upload external geojson file and display **********/

/*** vector source ***/
var extVector = function makeVector() {
    new ol.layer.Vector({
        source: new ol.source.Vector({
            url: 'C:\Users\1\Downloads/openLayer.geojson',
            format: new ol.format.GeoJSON({
                featureProjection: 'EPSG:3857'
            }),
        }),
    })
}

function getfeatures() {
    var writer = new ol.format.GeoJSON();
    var geojsonStr = writer.writeFeatures(vectorSource.getFeatures());

    document.getElementById("demo").innerHTML = geojsonStr;
}

//* Upload Image
document
    .querySelector('input[name="input_file"]')
    .addEventListener("change", function () {
        if (this.files && this.files[0]) {
            imagePath = URL.createObjectURL(this.files[0]);
            count++;
            removeDivs();
            init(imagePath, null);
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
    if(source != null) {
        var features = source.getFeatures();
        var uids = source.getUidIndex;

        $.each( uids, function( key, value ) {
            console.log( key + ": " + value );
        });
        
        // uids.forEach(uid => {
        //     console.log(uid.ol_uid)
        // });

        console.log('data source = ', source);
        console.log('data features = ', features);
        console.log('data uidIndex_ = ', uids);
    }
    

    var raster = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    if (source == null) {
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
        var shape = getShapeType();

        if (shape === "None") {
            return;
        }

        actionOnMap = changeActionAs("Draw", shape);
        actionOnMap.on('drawend', function (event) {
            var geometry = event.feature.getGeometry();
            var coordinates = [];

            if (shapeType == "Circle") {
                var circle = event.feature.getGeometry();
                value = "Point"
                coordinates = [circle.getCenter(), circle.getRadius()]

                insertPolygonDataIntoGeoJson("Point", coordinates)
            }
            else if (shapeType == "LineString") {
                value = "LineString";
                coordinates = geometry.getCoordinates();
                insertPolygonDataIntoGeoJson("LineString", coordinates)
            }
            else {
                coordinates = geometry.getCoordinates()[geometry.getCoordinates().length - 1];
                insertPolygonDataIntoGeoJson("Polygon", coordinates)
            }

            $("#none-click").click();
        });

        setActionOnMap(actionOnMap);
    }


    function addTransformAction() {
        actionOnMap = changeActionAs("Transform");
        setActionOnMap(actionOnMap);
    }

    function addSelectAction() {
        actionOnMap = changeActionAs("Select");
        actionOnMap.on('select', function (event) {
            event.target.getFeatures().forEach(function (feature) {
                selectedFeature = feature;
            });
            event.selected.forEach(function(each) {
                each.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({ color: "red", width: 2 }),
                        text: new ol.style.Text({
                            text: selectedFeature.getProperties().text,
                            fill: new ol.style.Fill({
                                color: 'red'
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'red',
                            })
                        }),
                        fill: new ol.style.Fill({ color: ([255, 0, 0]).concat([0.3])}),
                    }));
            });
            event.deselected.forEach(function(each) {
                each.setStyle(null); // more likely you want to restore the original style
            });
            
            return;
        });

        

        setActionOnMap(actionOnMap);
    }

    //* ******************** Lock or Unlock Screen ******************** *//
    $(document).on("click", "#lock", null, function () {
        lock = !lock;

        resetSideBar();
        $("#lock").parents('li:first').addClass('active')

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
        resetSideBar();
        $("#unlock").parents('li:first').addClass('active')
        if (zzz) map.addInteraction(zzz);
    });

    //* ******************** Rotate ******************** *//
    $(document).on("click", "#rotate-left", null, function () {
        view.animate({
            rotation: view.getRotation() + Math.PI / 2,
        });
        resetSideBar();
        $("#rotate-left").parents('li:first').addClass('active')
    });

    $(document).on("click", "#rotate-right", null, function () {
        view.animate({
            rotation: view.getRotation() - Math.PI / 2,
        });
        resetSideBar();
        $("#rotate-right").parents('li:first').addClass('active')

    });

    $(document).on("click", "#scaling", null, function () {
        resetSideBar();
        $("#scaling").parents('li:first').addClass('active')
        $("#scaleModel").modal();
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
                coordinates: [[[0, 0], [0, 800], [500, 800], [500, 0], [0, -0]]]
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

    $(document).on("click", "#alertTest", null, function () {
        //zone1#cable1#20#30
        var test_alert = "zone1#cable1#200#300";
        var alert_split = test_alert.split("#");
        var sel_cable = alert_split[1];
        var x_pos = alert_split[2] * 1;
        var y_pos = alert_split[3] * 1;
        var cableId = '';
        if (sel_cable.search('cable') > -1) {
            var sel_cable_index = sel_cable[sel_cable.length - 1];
            $("#cable_list option").each(function (index, element) {
                if ($(element).html() === "Cable " + sel_cable_index) {
                    cableId = $(element).val();
                }
            })
        } else {
            return;
        }
        if (cableId != undefined) {
            var selected_index = 0;
            var lineString = [];
            var minLength = 0;
            if (cableArray[cableId] == undefined) return;
            for (var i = 0; i < cableArray[cableId].length; i++) {
                var _length = Math.sqrt(Math.pow((cableArray[cableId][i][0] - x_pos), 2) + Math.pow((cableArray[cableId][i][1] - y_pos), 2));
                if (minLength == 0) minLength = _length;
                if (minLength > _length) {
                    minLength = _length;
                    selected_index = i;
                }
            }
            var alert = showAlertPulse(cableArray[cableId][selected_index][0], cableArray[cableId][selected_index][1]);
        }
    })

    //* ******************** Create Cable ******************** *//
    $(document).on("click", "#btn_add_cable", null, function () {
        // Data to draw on the map
        var $cableElem = $("#cable_list");
        var sizeofDots = $cableElem.val().split("#")[0] * 1;
        var maxLength = $cableElem.val().split("#")[1] * 1;
        var unitLength = maxLength / (sizeofDots - 1);
        var coordinatesArray = [];
        var lengthArray = []
        for (var i = 0; i < sizeofDots; i++) {
            coordinatesArray.push([unitLength * i, 500]);
            lengthArray.push(unitLength * i);
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
        cableOriginArray[$cableElem.val()] = lengthArray;

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

        // Data to draw on the map
        var lstring = selectedUnit.geometry.coordinates;
        var features = new ol.Collection();
        features.push(new ol.Feature({
            geometry: new ol.geom.LineString(lstring),
            text: selectedUnit.properties.text,
            id: selectedUnit.properties.id
        }));

        var vector = new ol.layer.Vector({
            name: 'addDottedLinesLayers',
            source: new ol.source.Vector({ features: features }),
            style: function (f) {
                return [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({ color: "green", width: 3 }),
                        text: new ol.style.Text({
                            text: $distance + "  " + selectedUnit.properties.text,
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
        addDrawAction();
        resetSideBar()
        $("#rectangle-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#square-click", null, function () {
        setDashSize(0);
        setShapeType("Square");
        addDrawAction();
        resetSideBar()
        $("#square-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#star-click", null, function () {
        setDashSize(0);
        setShapeType("Star");
        addDrawAction();
        resetSideBar()
        $("#star-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#line-click", null, function () {
        setDashSize(0);
        setShapeType("LineString");
        addDrawAction();
        resetSideBar()
        $("#line-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#dotted-click", null, function () {
        setDashSize(4);
        setShapeType("LineString");
        addDrawAction();
        resetSideBar()
        $("#dotted-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#polygon-click", null, function () {
        setDashSize(0);
        setShapeType("Polygon");
        addDrawAction();
        resetSideBar()
        $("#polygon-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#circle-click", null, function () {
        setDashSize(0);
        setShapeType("Circle");
        addDrawAction();
        resetSideBar()
        $("#circle-click").parents('li:first').addClass('active')
    });

    $(document).on("click", "#none-click", null, function () {
        // updateCoords();
        addSelectAction();
        resetSideBar()
        $("#none-click").parents('li:first').addClass('active')
    });

    // Event Handler when hover
    map.addOverlay(tooltip);
    map.on("pointermove", function (evt) {
        var featureText = '';
        var featureID = '';
        var coordinates;
        var hit = this.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            var selectedZone = feature.getProperties();
            if (selectedZone.features != undefined && selectedZone.features[0].getProperties() != undefined && selectedZone.features[0].getProperties().text != undefined && selectedZone.features[0].getProperties().text.search('Cable') > -1) {
                featureText = selectedZone.features[0].getProperties().text;
                featureID = selectedZone.features[0].getProperties().id;
                coordinates = feature.getGeometry().getCoordinates();
                return true;
            } else {
                return false;
            }
        });
        if (hit) {
            var selected_index = 0;
            var lineString = [];
            var is_dot_same = false;
            for (var i = 0; i < cableArray[featureID].length; i++) {
                is_dot_same = cableArray[featureID][i].every(function (element, index) {
                    return element === coordinates[index];
                });
                selected_index = i;
                lineString.push(cableArray[featureID][i]);
                if (is_dot_same) {
                    tooltipContent.innerHTML = '<p>' + cableOriginArray[featureID][selected_index] + '</p>';
                    tooltip.setPosition(coordinates);
                    break;
                }
            }
        } else {
            tooltip.setPosition(undefined);
        }
    });

    //* ******************** Create for Delete and Move Event ******************** *//
    $(document).on("click", "#translateFeature", null, function () {
        addTransformAction();
        resetSideBar()
        $("#translateFeature").parents('li:first').addClass('active')
    });

    $(document).on("click", "#btnDelete", null, function () {
        addSelectAction();

        if (Object.values(selectedFeature).length) {
            var selectedZone = selectedFeature.getProperties();
            var newFeatures = [];
            //* Remove deleted item from zoneGeoJson feature list
            if (Object.values(selectedZone).length !== 0) {
                var isSelected;
                if (selectedZone.features) {
                    isSelected = zoneGeoJson.features.find(function (item) {
                        return item.properties.text === selectedZone.features[0].getProperties().text;
                    });
                } else {
                    isSelected = zoneGeoJson.features.find(function (item) {
                        return item.properties.text === selectedZone.text;
                    });
                }

                zoneGeoJson.features.map((feature, index) => {
                    if (feature !== isSelected) {
                        newFeatures.push(feature)
                    }
                })

                zoneGeoJson.features = newFeatures;
            };

            if (isSelected && isSelected.properties && selectedZone.text) {
                removeLayersFromMap(getSelectedLayer(isSelected.properties));
            } else {
                removeDrawingFromLayer(selectedFeature, getDrawingLayer().getSource());
            }

            initSelectedZone();
        }
    });

    function getDrawingLayer() {
        var drawingLayer;
        map.getLayers().forEach(function (layer) {
            if (layer.getClassName() === "draw-layer") {
                drawingLayer = layer;
            }
        })

        return drawingLayer;
    }

    function getSelectedLayer(selectedZone) {
        var selectedLayer = [];

        if (map.getLayers().getLength() > 2) {
            for (let i = 2; i < map.getLayers().getLength(); i++) {
                var layer = map.getLayers().getArray()[i];
                var features = layer.getSource().getFeatures()

                for (var feature of features) {
                    if (feature.getProperties().text && feature.getProperties().text === selectedZone.text) {
                        selectedLayer.push(layer);
                    }
                }
            }
        }

        return selectedLayer;
    }

    function removeDrawingFromLayer(feature, layer) {
        layer.removeFeature(feature)
    }

    function removeLayersFromMap(layers) {
        layers.forEach((layer) => {
            map.removeLayer(layer);
        })
    }

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
        var points = currentCable.geometry.coordinates;
        var features = new ol.Collection();
        features.push(new ol.Feature({
            geometry: new ol.geom.MultiPoint(points),
            text: currentCable.properties.text,
            id: currentCable.properties.id
        }));

        var vector1 = new ol.layer.Vector({
            name: 'addDotsLayers',
            source: new ol.source.Vector({ features: features }),
            title: "pointLayer",
            style: new ol.style.Style({
                image: new ol.style.Circle({ stroke: new ol.style.Stroke({ color: "red", width: 4 }), radius: 2 })
            })
        })

        map.addLayer(vector1);

        features.push(new ol.Feature({
            geometry: new ol.geom.LineString(points),
            text: currentCable.properties.text,
            id: currentCable.properties.id
        }));

        var vector2 = new ol.layer.Vector({
            name: 'addDottedLinesLayers',
            source: new ol.source.Vector({ features: features }),
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
                                color: 'green'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#FFFF99',
                                width: 3.5
                            })
                        })
                    })
                ]
            }
        })
        map.addLayer(vector2);

        var mod = new ol.interaction.Modify({
            features: features,
            deleteCondition: evt => { return false },
            insertVertexCondition: e => { return true }
        });
        mod.on('modifyend', function (event) {
            var featureID = features.array_[0].getProperties().id;
            cableArray[featureID] = features.array_[0].getGeometry().getCoordinates();
        });
        map.addInteraction(mod);
    }

    /*****select polygon***/
    $("#colorPicker").change(function () {
        let userColor = $(this).val();

        addSelectAction();

        var fill = new ol.interaction.FillAttribute({}, { color: userColor });
        map.addInteraction(fill);
    });

    const download = $('#btnSave')[0];

    $(document).on("click", "#btnSave", null, function () {
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
                text: "Polygon"
            },
            geometry: {
                type,
                coordinates,
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
    function updateCoords() {
        zoneGeoJson = {
            type: "FeatureCollection",
            image: tempImageName,
            features: []
        };

        var this_ = this, layer_, layersToLookFor = [];  //layer.get('title')

        var check = function (layer) {
            var source = layer.getSource();
            if (source instanceof ol.source.Vector) {
                var features = source.getFeatures();
                if (features.length > 0) {
                    features.forEach(feature => {
                        if (feature.getGeometry().getType() == "Circle") {
                            insertPolygonDataIntoGeoJson("Point", [feature.getGeometry().getCenter(), feature.getGeometry().getRadius()])
                        }
                        else if (feature.getGeometry().getType() == "LineString") {
                            insertPolygonDataIntoGeoJson("LineString", feature.getGeometry().getCoordinates())
                        }
                        else if (feature.getProperties().text) {
                            insertPolygonDataIntoGeoJson("Polygon", feature.getGeometry().getCoordinates(), feature.getProperties.text)
                        } else {
                            insertPolygonDataIntoGeoJson("Polygon", feature.getGeometry().getCoordinates())
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
        map.getLayers().forEach(function (layer) {
            if (layer instanceof ol.layer.Group) {
                layer.getLayers().forEach(check);
            } else {
                check(layer);
            }
        });

        layersToLookFor.forEach(function (obj) {
            var found = obj.features.some(function (feature) {
                return this_ === feature;
            });

            if (found) {
                //this is the layer we want
                layer_ = obj.layer;
            }
        });

        return layer_;
    }

    function showToolTip(browserEvent) {
        var featureInfo = '';
        var coordinates;
        var hit = this.forEachFeatureAtPixel(browserEvent.pixel, function (feature, layer) {
            var selectedZone = feature.getProperties();
            if (selectedZone.features != undefined && selectedZone.features[0].getProperties().text.search('Cable') > -1) {
                featureInfo = selectedZone.features[0].getProperties().text;
                coordinates = feature.getGeometry().getCoordinates();
                return true;
            } else {
                return false;
            }
        });

        if (hit) {
            tooltipContent.innerHTML = '<p>' + featureInfo + '</p>';
            tooltip.setPosition(coordinates);
        } else {
            tooltip.setPosition(undefined);
        }
    }

    // map.on("pointermove", showToolTip);
    map.on("pointerdrag", function () {
        intersected = false;
    })

    // ! ????????????????????????????????????????????????????????????????? INCARNATION OF BUG!!!!!
    function getIntersectionStatus(sourceFeature, layer) {
        if (layer && sourceFeature.getGeometry().getCoordinates() && sourceFeature.getGeometry().getCoordinates().length) {
            var sourcePolygon = turf.polygon(sourceFeature.getGeometry().getCoordinates())

            map.getLayers().forEach(function (otherLayer) {
                if (layer !== otherLayer && otherLayer.get("title") !== "default") {
                    var source = otherLayer.getSource()
                    if (source instanceof ol.source.Vector) {
                        var features = source.getFeatures();
                        if (features.length > 0) {
                            features.forEach(feature => {
                                // if (feature.getGeometry().getCoordinates().length > 3) {
                                var targetPolygon = turf.polygon(feature.getGeometry().getCoordinates())

                                if (!intersected && turf.booleanIntersects(sourcePolygon, targetPolygon)) {
                                    alert("Zones can not intersect each other!");
                                    intersected = true;
                                }
                                // }
                            })
                        }
                    }
                }
            })
        }
    }

    function TransformFilter(feature, layer) {
        // getIntersectionStatus(feature, layer);
        return true;
    }

    function changeActionAs(actionType, shape = "None") {
        map.removeInteraction(actionOnMap);
        if (actionOnMap) {
            actionOnMap = undefined
        }

        if (actionType !== "Draw") {
            initShapeType();
        }

        var newAction;
        switch (actionType) {
            case "Select":
                newAction = new ol.interaction.Select();
                break;
            case "Draw":
                newAction = new ol.interaction.Draw({
                    source,
                    type: getGeometryFunction(shape)[0],
                    geometryFunction: getGeometryFunction(shape)[1],
                });
                break;
            case "Transform":
                newAction = new ol.interaction.Transform({
                    enableRotatedTransform: false,
                    addCondition: ol.events.condition.shiftKeyOnly,
                    hitTolerance: 2,
                    scale: true,
                    translate: true,
                    stretch: true,
                    filter: TransformFilter,
                });
                break;
            default:
                break;
        }

        return newAction;
    }

    function setActionOnMap(action) {
        map.addInteraction(action);
    }

    function getGeometryFunction(geometryType) {
        var type = geometryType;
        var geometryFunction = undefined;

        if (type === "Square") {
            type = "Circle";
            geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
        }
        else if (type === "Box") {
            type = "Circle";
            geometryFunction = ol.interaction.Draw.createBox();
        }
        else if (type === 'Star') {
            type = "Circle";
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
        else if(type === 'Point') {
            type = "Circle"
            // var wgs84Sphere = new ol.interaction.Sphere(6378137);
            geometryFunction = function (coordinates, geometry) {
                console.log('circle coordinates = ', coordinates[0]);
                if (!geometry) {
                    geometry = new ol.geom.Polygon(null);
                }
                var center = coordinates[0];
                var last = coordinates[1];
                var dx = center[0] - last[0];
                var dy = center[1] - last[1];
                var radius = Math.sqrt(dx * dx + dy * dy);
                // var circle = ol.geom.Polygon.circular(wgs84Sphere, ol.proj.toLonLat(center), radius);
                // circle.transform('EPSG:4326', 'EPSG:3857');
                geometry.setCoordinates(circle.getCoordinates());
                return geometry;
            }
        }

        return [type, geometryFunction];
    }

    /********* clear map *********/
    function clearMapLayers(map) {
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
            drawExtGeoJson(urlPath)

        }
        else {
            console.log("GeoJson file dosen't exist!");
        }
    });

function drawExtGeoJson(urlPath) {
    var imageUrl = ""
    var source = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        loader: function (extent, resolution, projection) {
            var proj = projection.getCode();
            var url = urlPath;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            var onError = function () {
                vectorSource.removeLoadedExtent(extent);
            }

            xhr.onerror = onError;
            xhr.onload = function () {
                if (xhr.status == 200) {
                    source.addFeatures(source.getFormat().readFeatures(xhr.responseText));
                    imageName = JSON.parse(xhr.responseText)['image'];
                    console.log('parse url = ', imageName);
                } 
                else {
                    onError();
                }
            }
            xhr.send();
        },
    });

    $.getJSON( urlPath,  function( data ) {
        imageName =  data.image
        tempImageName = imageName
        init(imageAssetUrl + imageName, source);
    });
}

function resetSideBar() {
    $("ul.components li").removeClass('active')
}

function showAlertPulse(xPos, yPos) {
    let node = createAlertDot();
    let alert = new ol.Overlay({
        element: node,
    })

    map.addOverlay(alert);
    alert.setPosition([xPos, yPos]);

    return alert;
}

function deleteAlertPulse(alert) {
    alert.setPosition(undefined);
}

function createAlertDot() {
    let node = document.createElement('div');
    let attr = document.createAttribute('class');
    attr.value = 'pulse-alert';
    node.setAttributeNode(attr);

    document.getElementById('alert').appendChild(node)

    return node;
}

// var retval1 = showAlertPulse(500, 400);
// var retval2 = showAlertPulse(550, 600);
// var retval3 = showAlertPulse(200, 500);
// var retval4 = showAlertPulse(134, 703);
// var retval5 = showAlertPulse(260, 630);
// var retval6 = showAlertPulse(526, 340);
// var retval7 = showAlertPulse(100, 500);

// deleteAlertPulse(retval7)