Number.prototype.mapRange = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

class Map {
    constructor(parentElement, mapPosition = { x: -1393.4, y: -227.027 }, mapZoom = 1.0, mapSize = { width: 6193, height: 1713 }) {
        this.parentElement = parentElement;
        this.mapZoom;
        this.mapContainer;
        this.mapCanvas;
        this.currentPosition = mapPosition;
        this.currentZoom = mapZoom;
        this.allMaps = {};
        this.isDraggingMap = false;
        this.mapImage = new Image(mapSize.width, mapSize.height);
        this.mapCanvasCtx;

        if (this.parentElement) {
            this.createMapElements();
        }

        this.mapImage.crossOrigin = "Anonymous";
        this.mapImage.src = 'oriwotwmap.0.1.6.webp';
        this.mapImage.addEventListener('load', this, false);
    }

    /*
    Checks if a point is inside a polygon
    */
    isInside(p, polygon) {
        if (p && polygon) {
            var isInside = false;

            var i = 0, j = polygon.length - 1;
            for (i, j; i < polygon.length; j = i++) {
                if ((polygon[i].y > p.y) != (polygon[j].y > p.y) &&
                    p.x < (polygon[j].x - polygon[i].x) * (p.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x) {
                    isInside = !isInside;
                }
            }

            return isInside;
        } else {
            return false;
        }
    }

    /*
    Setups all the HTML required for the map class to work.
    appends it all to the parentElement that was set when
    creating the class.
    */
    createMapElements() {
        this.mapZoom = document.createElement('div');
        this.mapContainer = document.createElement('div');
        this.mapCanvas = document.createElement('canvas');

        this.mapZoom.style.transform = "scale(1.0)";
        this.mapContainer.id = "orimap-container";
        this.mapContainer.style.transform = "translate(-1393.4px, -227.027px)";
        this.mapContainer.style.transformOrigin = "left top";
        this.mapCanvas.id = "orimap";
        this.mapCanvas.height = 1713;
        this.mapCanvas.width = 6193;

        this.mapCanvasCtx = this.mapCanvas.getContext('2d');
        this.mapCanvasCtx.webkitImageSmoothingEnabled = false;
        this.mapCanvasCtx.msImageSmoothingEnabled = false;
        this.mapCanvasCtx.imageSmoothingEnabled = false;

        this.mapContainer.appendChild(this.mapCanvas);
        this.mapZoom.appendChild(this.mapContainer);

        if (this.parentElement.children.length > 0) {
            this.parentElement.insertBefore(this.mapZoom, this.parentElement.children[0]);
        } else {
            this.parentElement.appendChild(this.mapZoom);
        }
    }

    getMapLocation(pos) {
        var mapIntersections = -1;

        if (this.allMaps) {
            mapIntersections = this.isInside(pos, this.allMaps['Midnight Burrows']);
            if (mapIntersections) {
                return 'Midnight Burrows';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Inkwater Marsh']);
            if (mapIntersections) {
                return 'Inkwater Marsh';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Kwoloks Hollow']);
            if (mapIntersections) {
                return 'Kwoloks Hollow';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Mouldwood Depths']);
            if (mapIntersections) {
                return 'Mouldwood Depths';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Silent Woods']);
            if (mapIntersections) {
                return 'Silent Woods';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Windswept Wastes']);
            if (mapIntersections) {
                return 'Windswept Wastes';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Windtorn Ruins']);
            if (mapIntersections) {
                return 'Windtorn Ruins';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Weeping Ridge']);
            if (mapIntersections) {
                return 'Weeping Ridge';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Willows End']);
            if (mapIntersections) {
                return 'Willows End';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Baurs Reach']);
            if (mapIntersections) {
                return 'Baurs Reach';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Luma Pools']);
            if (mapIntersections) {
                return 'Luma Pools';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Wellspring']);
            if (mapIntersections) {
                return 'Wellspring';
            }

            mapIntersections = this.isInside(pos, this.allMaps['Wellspring Glades']);
            if (mapIntersections) {
                return 'Wellspring Glades';
            }
        }
    }

    moveMap(event) {
        var oldTransform = this.currentPosition,
            oriMapSize = this.mapCanvas.getBoundingClientRect(),
            oriMapContRect = this.parentElement.getBoundingClientRect(),
            fixedMovX = event.movementX / this.currentZoom,
            fixedMovY = event.movementY / this.currentZoom,
            newX,
            newY;

        if (oriMapSize.x + fixedMovX > (oriMapSize.width - oriMapContRect.width / 2) * -1 && oriMapSize.x + fixedMovX < oriMapContRect.width / 2) {
            newX = parseFloat((oldTransform.x) + fixedMovX);
        } else if (oriMapSize.x > 0 && oriMapSize.x + fixedMovX < oldTransform.x && oriMapSize.x + fixedMovX > oldTransform.x) {
            newX = parseFloat((oldTransform.x) + fixedMovX);
        } else {
            newX = parseFloat(oldTransform.x);
        }
        if (oriMapSize.y + fixedMovY > (oriMapSize.height - oriMapContRect.height / 2) * -1 && oriMapSize.y + fixedMovY < oriMapContRect.height / 2) {
            newY = parseFloat((oldTransform.y) + fixedMovY);
        } else if (oriMapSize.y > 0 && oriMapSize.y + fixedMovY < oldTransform.y) {
            newY = parseFloat((oldTransform.y) + fixedMovY);
        } else if (parseFloat(oldTransform.y) < 0 && parseFloat(oldTransform.y) + fixedMovY > parseFloat(oldTransform.y)) {
            newY = parseFloat(oldTransform.y) + fixedMovY;
        } else {
            newY = parseFloat(oldTransform.y);
        }

        newX = Math.max(newX, (oriMapSize.width * -1 + parseFloat(this.parentElement.style.width)));
        newY = Math.max(newY, (oriMapSize.height * -1 + parseFloat(this.parentElement.style.height)));
        this.currentPosition = { x: newX, y: newY };
        this.mapContainer.style.transformOrigin = newX + 'px ' + newY + 'px';
        this.mapContainer.style.transform = 'translate(' + newX + 'px, ' + newY + 'px)';
    }

    setMap(pos) {
        var oriMapSize = this.mapCanvas.getBoundingClientRect(),
            mapRect = this.parentElement.getBoundingClientRect(),
            newX = pos.x,
            newY = pos.y;

        newX = Math.max(Math.min(newX, 0), (oriMapSize.width * -1));
        newY = Math.max(Math.min(newY, 0), (oriMapSize.height * -1));
        this.currentPosition = { x: (newX + (mapRect.width / 2)), y: (newY + (mapRect.height / 2)) };
        this.mapContainer.style.transformOrigin = newX + 'px ' + newY + 'px';
        this.mapContainer.style.transform = 'translate(' + (newX + (mapRect.width / 2)) + 'px, ' + (newY + (mapRect.height / 2)) + 'px)';
    }

    zoomMap(event) {
        var fixedDeltaY = event.deltaMode === 1 ? event.deltaY : Math.round(event.deltaY / 33),
            zoomValue = (fixedDeltaY / -50) * this.currentZoom,
            mapRect = this.parentElement.getBoundingClientRect();

        this.currentZoom += zoomValue;
        this.mapZoom.style.transform = 'scale(' + this.currentZoom + ')';
        this.mapZoom.style.transformOrigin = '50% ' + mapRect.height / 2 + 'px';
    }

    setMapZoomLevel(value) {
        var mapRect = this.parentElement.getBoundingClientRect();

        this.currentZoom = value;
        this.mapZoom.style.transform = 'scale(' + this.currentZoom + ')';
        this.mapZoom.style.transformOrigin = '50% ' + mapRect.height / 2 + 'px';
    }

    getMapData(event) {
        var mapContainerRect = this.mapContainer.getBoundingClientRect(),
            mapCanvasRect = this.mapCanvas.getBoundingClientRect(),
            left = (event.clientX - mapContainerRect.left) / this.currentZoom + 'px',
            top = (event.clientY - mapContainerRect.top) / this.currentZoom + 'px',
            gameMapTop = ((4796.8700000000003 - (parseFloat(top) * -1)) * -1) * 0.72, //4860.870000000000
            gameMapLeft = (2440.73 - (parseFloat(left).mapRange(0, Math.abs(mapCanvasRect.width) / this.currentZoom, Math.abs(mapCanvasRect.width) / this.currentZoom, 0) * 0.726));

        return {
            left: left,
            top: top,
            mapX: (+parseFloat(left).toFixed(2) * -1),
            mapY: (+parseFloat(top).toFixed(2) * -1),
            gameX: +gameMapLeft.toFixed(2),
            gameY: +gameMapTop.toFixed(2),
            mapLocation: this.getMapLocation({ x: parseFloat(left), y: parseFloat(top) })
        };
    }

    inGameToMapCoord(pos) {
        var mapCoords = {x:0,y:0},
            mapCanvasRect = this.mapCanvas.getBoundingClientRect();

        mapCoords.y = (4796.8700000000003 + (((parseFloat(pos.y) * -1)) * -1) / 0.72) * -1;
        mapCoords.x = (((parseFloat(pos.x) - 2440.73) / 0.726) * -1).mapRange(0, Math.abs(mapCanvasRect.width) / this.currentZoom, Math.abs(mapCanvasRect.width) / this.currentZoom, 0);

        return mapCoords;
    }

    showMapLocationNodes() {
        wotw.drawer.clearMap();
        ctxPaint.beginPath();
        ctxPaint.strokeStyle = 'red';
        ctxPaint.globalAlpha = 1;

        var keys = Object.keys(this.allMaps);
        for (var i = 0; i < keys.length; i++) {
            for (var i2 = 0; i2 < this.allMaps[keys[i]].length; i2++) {
                var pos = this.allMaps[keys[i]][i2];
                var button = document.createElement('button');

                button.dataset.index = i2;
                button.dataset.map = keys[i];
                button.dataset.pos = pos.x + ' ' + pos.y;
                button.style.left = pos.x + 'px';
                button.style.top = pos.y + 'px';
                button.style.position = 'absolute';
                button.className = 'map-elements-map-node';
                button.textContent = i2;
                button.addEventListener('mousedown', function () { activeMapBorderNode = this; });
                button.addEventListener('mouseup', function () { wotw.map.showMapLocationNodes(); });
                document.getElementById('orimap-container').appendChild(button);

                if (i2 === 0) {
                    ctxPaint.strokeStyle = 'red';
                    ctxPaint.moveTo(pos.x, pos.y);
                } else {
                    ctxPaint.lineTo(pos.x, pos.y);
                }
            }
        }
        ctxPaint.stroke();
    }

    setMapBorderNodePos(x, y) {
        if (activeMapBorderNode) {
            activeMapBorderNode.dataset.pos = x + ' ' + y;
            this.allMaps[activeMapBorderNode.dataset.map][activeMapBorderNode.dataset.index].x = x;
            this.allMaps[activeMapBorderNode.dataset.map][activeMapBorderNode.dataset.index].y = y;
            this.allMaps[activeMapBorderNode.dataset.map][activeMapBorderNode.dataset.index].hasChanged = true;
            activeMapBorderNode.style.left = x + 'px';
            activeMapBorderNode.style.top = y + 'px';
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case 'load':
                this.mapCanvasCtx.drawImage(this.mapImage, 0, 0);
                this.mapCanvasCtx.drawImage(this.mapImage, 0, 0);
                this.parentElement.addEventListener('mousemove', this, false);
                break;

            case 'mousemove':
                if (this.isDraggingMap) {
                    this.getMapData(event);
                    this.moveMap(event);    
                }
                break;
        }
    }
}

export default Map;