import Map from './map.js';
import IconFactory from './iconFactory.js';
import SeedTransform from './seedTransform.js';

class WOTW {
    constructor() {
        this.setupHTML();
        this.map;
        this.drawer;
        this.iconFactory;
        this.timeline;
        this.shop;
        this.seedTransform;

        if (typeof Drawer === 'function') {
            this.drawer = new Drawer();
        }

        if (typeof Map === 'function') {
            this.map = new Map(document.getElementById('map-container'));
            this.map.mapImage.addEventListener('load', this, false);
        }

        if (typeof IconFactory === 'function') {
            this.iconFactory = new IconFactory(this.map);
        }

        if (typeof Timeline === 'function') {
            this.timeline = new Timeline();
        }

        if (typeof Shop === 'function') {
            this.shop = new Shop(this.iconFactory);
        }

        if (typeof SeedTransform === 'function') {
            this.seedTransform = new SeedTransform(this.map, this.iconFactory);
        }

        this.inventory;
        this.allBranches = [];
        this.allRoutes = [];
        this.divContainer;
        this.divControls;
        this.popups;
        this.icons;
        this.anchorBeingDragged = false;
        this.anchorDragging = false;
        this.activeBranchIndex = false;
        this.commentBeingDragged = false;
        this.iconBeingDragged = false;
        this.activeMapBorderNode = false;
        this.isNodeMode = false;
        this.activeBranch = false;
        this.mapLinkerElement = undefined;

        this.map.mapImage.addEventListener('load', this, false);
    }

    setupHTML() {
        var div = document.createElement('div');

        div.id = 'map-container';
        div.style.position = 'relative';
        div.style.width = '80%';
        div.style.height = '100vh';
        div.style.overflow = 'hidden';
        div.style.backgroundColor = 'black';

        div.addEventListener('mouseup', this, false); //clearMouseVars();
        div.addEventListener('click', this, false); //mouseClickEvents(event);
        div.addEventListener('mousedown', this, false); //this.map.isDraggingMap = true;
        div.addEventListener('contextmenu', this, false); //rightMouseClickEvents(event);return false;
        div.addEventListener('mouseout', this, false); //if (this.contains(event.target) === false) {this.map.isDraggingMap = false;}
        div.addEventListener('wheel', this, false); //this.map.zoomMap(event);

        this.divContainer = div;

        document.body.appendChild(this.divContainer);

        var divControls = document.createElement('div'),
            divControlsElements = document.createElement('div');

        divControls.id = 'controls-container';
        divControls.className = 'controls-container';

        divControlsElements.className = 'map-elements';

        divControls.appendChild(divControlsElements);

        this.divControls = divControls;
        document.body.appendChild(divControls);
    }

    clearMouseVars() {
        if (this.timeline) {
            this.timeline.frameDragging = false;
        }
        this.anchorBeingDragged = undefined;
        this.anchorDragging = false;
        this.activeBranchIndex = null;
        this.commentBeingDragged = undefined;
        this.iconBeingDragged = undefined;
        if (this.map) {
            this.map.isDraggingMap = false;
            if (this.activeMapBorderNode !== false) {
                this.activeMapBorderNode = false;
                this.map.showMapLocationNodes();
            }
        }
        this.activeMapBorderNode = false;
    }

    loadBranches() {
        if (typeof Branch === 'function') {
            var tempJson = window.localStorage.getItem('branches3'),
                tempBranches = [];

            if (tempJson) {
                this.allBranches = this.allBranches.concat(JSON.parse(tempJson));
            }

            for (var i = 0; i < this.allBranches.length; i++) {
                var branch = new Branch(this.allBranches[i].mapId, this.allBranches[i].standard, this.allBranches[i].id);
                branch.loadBranch(this.allBranches[i]);
                tempBranches.push(branch);
            }
            this.allBranches = tempBranches;

            this.loadRoutes();
            this.listMapElements('branch', this.allBranches);

            if (activeRoute) {
                activeRoute.showData();
            }
            this.drawer.drawFrames(0);
        }
    }

    loadRoutes() {
        if (typeof Route === 'function') {
            var tempJson = window.localStorage.getItem('routes3'),
                tempRoutes = [];

            if (tempJson) {
                this.allRoutes = this.allRoutes.concat(JSON.parse(tempJson));
            }

            for (var i = 0; i < this.allRoutes.length; i++) {
                var route = new Route(this.allRoutes[i].name, this.allRoutes[i].category, this.allRoutes[i].difficulty, this.allRoutes[i].oob, this.allRoutes[i].branches, this.allRoutes[i].standard, this.allRoutes[i].id);
                if (i === 0) {
                    activeRoute = route;
                }
                tempRoutes.push(route);
            }
            this.allRoutes = tempRoutes;
        }
    }

    loadStratData(newEl, index) {
        var popupCont = document.getElementById('popup-container'),
            children = popupCont.querySelectorAll('*.popup-editable, label[data-type="required"]');

        for (var i2 = 0; i2 < children.length; i2++) {
            var type = children[i2].dataset.type;

            switch (type) {
                case 'name':
                case 'category':
                    if (popupJSON[index] && popupJSON[index][type]) {
                        children[i2].value = popupJSON[index][type];
                    } else {
                        children[i2].value = '';
                    }
                    break;

                case 'required':
                    var inputs = popupCont.querySelectorAll('input[data-type="required"]');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].checked = false;
                    }
                    for (var i = 0; i < popupJSON[index][type].length; i++) {
                        var input = popupCont.querySelector('input[value="' + popupJSON[index][type][i].toString() + '"]');
                        if (input) {
                            input.checked = true;
                        }
                    }
                    popupCont.querySelector('label[data-type="required"').innerText = popupJSON[index][type].toString().replace(/,/g, ', ');
                    break;

                case 'text':
                    if (popupJSON[index] && popupJSON[index][type]) {
                        children[i2].innerText = popupJSON[index][type];
                    } else {
                        children[i2].innerText = '';
                    }
                    break;

                case 'url':
                    if (popupJSON[index] && popupJSON[index][type]) {
                        children[i2].value = popupJSON[index][type];
                        children[i2].nextElementSibling.href = children[i2].nextElementSibling.textContent = popupJSON[index][type];
                    } else {
                        children[i2].value = '';
                        children[i2].nextElementSibling.href = children[i2].nextElementSibling.textContent = '';
                    }
                    break;

            }
        }

        newEl.appendChild(popupCont);
    }

    loadMapElements() {
        var tempPopupJSON = window.localStorage.getItem('popupjsons3');

        if (tempPopupJSON) {
            popupJSON = popupJSON.concat(JSON.parse(tempPopupJSON));
        }

        if (document.getElementById('popup-template')) {
            for (var i = 0; i < popupJSON.length; i++) {
                var pos = { x: popupJSON[i].x, y: popupJSON[i].y },
                    temp = document.getElementById('popup-template'),
                    clon = temp.content.cloneNode(true);

                //fix required
                popupJSON[i].required = popupJSON[i].required.replace('Sword', 'Spirit Edge');
                popupJSON[i].required = popupJSON[i].required.replace('Bow', 'Spirit Arc');
                popupJSON[i].required = popupJSON[i].required.replace('Sentry', 'Spirit Sentry');
                popupJSON[i].required = popupJSON[i].required.replace('Hammer', 'Spirit Smash');
                popupJSON[i].required = popupJSON[i].required.split(', ');

                clon.children[0].style.left = pos.x;
                clon.children[0].style.top = pos.y;
                clon.children[0].id = popupJSON[i].mapId;
                clon.children[0].dataset.popupId = i;
                clon.children[0].dataset.pos = parseFloat(popupJSON[i].x) + ' ' + parseFloat(popupJSON[i].y);
                if (popupJSON[i].icon && popupJSON[i].icon.iconName) {
                    clon.children[0].children[0].dataset.iconName = popupJSON[i].icon.iconName;
                    clon.children[0].children[0].dataset.category = popupJSON[i].icon.category;
                    this.iconFactory.setIconFromSheet(clon.children[0].children[0]);
                }
                document.getElementById('orimap-container').appendChild(clon);
            }
            this.listMapElements('comment', popupJSON);
        }

        var tempIconJSON = window.localStorage.getItem('iconjsons3');

        if (tempIconJSON) {
            this.icons = this.icons.concat(JSON.parse(tempIconJSON));
        }

        this.populateFilterData();
    }

    listMapElements(type = 'branch', data) {
        if (document.querySelector('div.map-elements')) {
            var container = document.querySelector('div.map-elements');

            if (type === 'branch') {
                if (container.querySelector('div.map-elements-branches')) {
                    var cont = container.querySelector('div.map-elements-branches');

                    cont.innerHTML = '';

                    for (var i = 0; i < data.length; i++) {
                        var template = document.getElementById('map-elements-current-route-branches'),
                            clone = template.content.cloneNode(true);

                        clone.querySelector('label.map-elements-current-route-branches-name').textContent = (data[i].paths[0].text !== undefined ? data[i].paths[0].text : '');
                        clone.querySelector('label.map-elements-current-route-branches-location').textContent = data[i].paths[0].nodes[0] !== undefined ? this.map.getMapLocation({ x: data[i].paths[0].nodes[0].x, y: data[i].paths[0].nodes[0].y }) : '';
                        clone.querySelector('span.map-elements-current-route-branches-color').style.backgroundColor = data[i].paths[0].color !== undefined ? data[i].paths[0].color : 'red';
                        clone.children[0].dataset.pos = data[i].paths[0].nodes[0] !== undefined ? data[i].paths[0].nodes[0].x + ' ' + data[i].paths[0].nodes[0].y : '';
                        clone.children[0].dataset.indexes = data[i].mapId;

                        clone.children[0].id = Math.floor((Math.random() * 100000000) + 1);

                        clone.children[0].addEventListener('click', function () {
                            var newPos = this.dataset.pos.split(' ');
                            ctxPaint.clearRect(0, 0, cvsPaint.width, cvsPaint.height);
                            wotw.map.setMap({ x: newPos[0] * -1, y: newPos[1] * -1 });
                            activeBranch = wotw.allBranches[this.dataset.indexes];
                            wotw.drawer.clearMap();
                            openRouteDetails();
                            wotw.allBranches[this.dataset.indexes].drawPaths();
                            if (isEditingMode) {
                                wotw.drawer.makeElementsEditable();
                            }
                        });

                        cont.appendChild(clone);
                    }
                }
            } else if (type === 'comment') {
                var cont = container.querySelector('div.map-elements-comments');

                for (var i = 0; i < data.length; i++) {
                    var temp = document.getElementById('map-elements-strat'),
                        clone = temp.content.cloneNode(true);

                    clone.querySelector('label.strat-name').textContent = data[i].name;
                    clone.querySelector('label.strat-category').textContent = data[i].category;
                    clone.querySelector('label.strat-required').textContent = data[i].required.toString().replace(/,/g, ', ');
                    clone.querySelector('span.strat-icon').dataset.iconName = data[i].icon.iconName;
                    clone.querySelector('span.strat-icon').dataset.category = data[i].icon.category;

                    if (clone.querySelector('input.strat-standard')) {
                        clone.querySelector('input.strat-standard').checked = data[i].standard;
                        clone.querySelector('input.strat-standard').dataset.id = (data[i].id !== undefined ? data[i].id - 1 : i);
                        clone.querySelector('input.strat-standard').addEventListener('change', function () {
                            popupJSON[this.dataset.id].upload = this.checked;
                            popupJSON[this.dataset.id].hasChanged = true;
                        });
                    }
                    this.iconFactory.setIconFromSheet(clone.querySelector('span.strat-icon'));
                    clone.querySelector('label.strat-location').textContent = this.map.getMapLocation({ x: parseFloat(data[i].x), y: parseFloat(data[i].y) });

                    clone.children[0].dataset.pos = parseFloat(data[i].x) + ' ' + parseFloat(data[i].y);
                    clone.children[0].dataset.id = data[i].mapId;
                    clone.children[0].addEventListener('click', function () {
                        if (!event.target.classList.contains('strat-standard')) {
                            var newPos = this.dataset.pos.split(' ');
                            wotw.map.setMap({ x: newPos[0] * -1, y: newPos[1] * -1 });
                            document.getElementById(this.dataset.id).style.display = 'flex';
                        }
                    });

                    cont.appendChild(clone);
                }
            } else if (type === 'ori-icon') {
                var cont = container.querySelector('div.map-elements-ori-icons');

                for (var i = 0; i < data.length; i++) {

                }
            }
        }
    }

    loadStandardData() {
        const sqlUrl = "/classes/moki.php",
            data = 'getMoki=true';
        $.ajax({
            type: "POST",
            url: sqlUrl,
            data: data,
            dataType: 'json',
            cache: false,
            success: function (data) { wotw.popuplateStandardData(data); }
        });
    }

    popuplateStandardData(data) {
        if (data.mapBorders) {
            this.map.allMaps = data.mapBorders;
        }
        if (data.mapPopups) {
            this.popups = data.mapPopups;
            for (var i = 0; i < this.popups.length; i++) {
                this.popups[i].standard = true;
            }
        }
        if (data.mapRoutes) {
            this.allRoutes = data.mapRoutes;
            for (var i = 0; i < this.allRoutes.length; i++) {
                this.allRoutes[i].standard = true;
            }
        }
        if (data.mapIcons) {
            this.icons = data.mapIcons;
            for (var i = 0; i < this.icons.length; i++) {
                this.icons[i].standard = true;
            }
        }
        if (data.mapBranches) {
            this.allBranches = data.mapBranches;
            for (var i = 0; i < this.allBranches.length; i++) {
                this.allBranches[i].standard = true;
            }
        }

        var urlParams = new URLSearchParams(window.location.search);

        //createIconsIconPicker();
        this.loadMapElements();
        this.loadBranches();
        if (this.timeline) {
            this.timeline.updateFrameLabels(document.getElementById('framecontainer'));
        }
        if (typeof Inventory === 'function') {
            this.inventory = new Inventory();
            this.inventory.updatePickups();
        }
        if (this.seedTransform) {
            this.icons = this.seedTransform.mapItems;
            //this.seedTransform.posToSeedLocation(this.icons);
            //this.seedTransform.createSeedIcons();
        }
        if (this.iconFactory) {
            this.iconFactory.createIconHTML(this.icons);
        }
        if (this.shop) {
            this.shop.createShops();
        }
        //checkParams(urlParams);
    }

    populateFilterData() {
        if (document.querySelectorAll('div.map-elements-filters')) {
            var filterContainers = document.querySelectorAll('div.map-elements-filters'),
                stratAreaFilters = document.querySelectorAll('fieldset.map-elements-strat-area-filter'),
                areas = Object.keys(wotw.map.allMaps);

            for (var i = 0; i < stratAreaFilters.length; i++) {
                var legend = document.createElement('legend');
                legend.textContent = 'Areas';
                stratAreaFilters[i].appendChild(legend);

                for (var i2 = 0; i2 < areas.length; i2++) {
                    var input = document.createElement('input');
                    label = document.createElement('label');

                    input.value = areas[i2];
                    input.type = 'checkbox';
                    input.style.transform = 'scale(0.6)';
                    input.style.margin = '0px';
                    input.dataset.filterType = 'area';
                    label.appendChild(input);
                    label.innerHTML += areas[i2];
                    label.style.fontSize = '10px';
                    label.style.display = 'flex';
                    stratAreaFilters[i].appendChild(label);
                }
            }

            var stratRequiredFilters = document.querySelectorAll('fieldset.map-elements-strat-required-filter'),
                required = ['Bash', 'Spirit Arc', 'Spirit Star', 'Launch', 'Dash', 'Burrow', 'Double Jump', 'Spirit Smash', 'Spirit Sentry', 'Spirit Edge', 'Torch'];

            for (var i = 0; i < stratRequiredFilters.length; i++) {
                var legend = document.createElement('legend');
                legend.textContent = 'Required';
                stratRequiredFilters[i].appendChild(legend);

                for (var i2 = 0; i2 < required.length; i2++) {
                    var input = document.createElement('input');
                    label = document.createElement('label');

                    input.value = required[i2];
                    input.type = 'checkbox';
                    input.style.transform = 'scale(0.6)';
                    input.style.margin = '0px';
                    input.dataset.filterType = 'required';
                    label.appendChild(input);
                    label.innerHTML += required[i2];
                    label.style.fontSize = '10px';
                    label.style.display = 'flex';
                    stratRequiredFilters[i].appendChild(label);
                }
            }

            for (var i = 0; i < filterContainers.length; i++) {
                filterContainers[i].dataset.filters = JSON.stringify({ area: [], required: [] });

                filterContainers[i].addEventListener('change', function () {
                    var children = this.parentNode.nextElementSibling.children,
                        filters = JSON.parse(this.dataset.filters),
                        filterType = event.target.dataset.filterType;

                    if (event.target.checked) {
                        filters[filterType].push(event.target.value);
                        this.dataset.filters = JSON.stringify(filters);
                    } else {
                        filters[filterType].splice(filters[filterType].indexOf(event.target.value), 1);
                        this.dataset.filters = JSON.stringify(filters);
                    }

                    for (var i = 0; i < children.length; i++) {
                        var requiredVis = false,
                            areaVis = false;

                        if (children[i].querySelector('label.strat-required')) {
                            if (filters && filters.required.length > 0) {
                                var required = children[i].querySelector('label.strat-required').textContent.split(', ');
                                if (filters.required.filter(element => required.indexOf(element) !== -1).length >= filters.required.length) {
                                    requiredVis = true;
                                } else {
                                    requiredVis = false;
                                }
                            } else {
                                requiredVis = true;
                            }
                        } else {
                            requiredVis = true;
                        }

                        if (children[i].querySelector('label.strat-location, label.map-elements-current-route-branches-location')) {
                            if (filters && filters.area.length > 0) {
                                if (filters.area.indexOf(children[i].querySelector('label.strat-location, label.map-elements-current-route-branches-location').textContent) !== -1) {
                                    areaVis = true;
                                } else {
                                    areaVis = false;
                                }
                            } else {
                                areaVis = true;
                            }
                        } else {
                            areaVis = true;
                        }

                        if (requiredVis && areaVis) {
                            children[i].style.display = 'flex';
                        } else {
                            children[i].style.display = 'none';
                        }
                    }
                });
            }
        }
    }

    mouseEvents(event) {
        if (this.map) {
            var mapData = this.map.getMapData(event);
            if (document.getElementById('map-element-mouse-position')) {
                document.getElementById('map-element-mouse-position').textContent = mapData.mapX + ", " + mapData.mapY;
            }
            if (document.getElementById('map-element-mouse-position-game')) {
                document.getElementById('map-element-mouse-position-game').value = mapData.gameX + ", " + mapData.gameY;
            }
            if (document.getElementById('current-map-location')) {
                document.getElementById('current-map-location').textContent = mapData.mapLocation;
            }
        }

        if (this.timeline && this.timeline.frameDragging) {
            this.timeline.setFrameMoverPos(event);
        } else if (this.anchorDragging) {
            setAnchorPos(event);
        } else if (this.commentBeingDragged) {
            setCommentPos(event);
        } else if (this.iconBeingDragged !== undefined) {
            setIconPos(event);
        } else if (this.map && this.activeMapBorderNode) {
            this.map.setMapBorderNodePos(parseFloat(mapData.left), parseFloat(mapData.top));
        } else if (this.map && this.map.isDraggingMap) {
            this.map.moveMap(event);
        }
    }

    mouseClickEvents(event) {
        var oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();
        const mPos = [{ x: (event.clientX - oriMapCont.left) / this.map.currentZoom, y: (event.clientY - oriMapCont.top) / this.map.currentZoom }];

        if (this.isNodeMode && this.activeBranch) {
            event.preventDefault();
            event.stopPropagation();

            if (event.ctrlKey && event.target.classList.contains('frame-position-button')) {
                var indexes = event.target.dataset.indexes.split(' ');
                this.allBranches[indexes[2]].paths[indexes[1]].removeNode(event.target);
            } else {
                activeBranch.paths[0].newPath(mPos);
            }
            this.drawer.drawFrames(this.drawer.activeFrame);
        } else if (this.mapLinkerElement !== undefined) {
            mapLinkerPicker(event);
        } else if (document.getElementById('context-menu') && document.getElementById('context-menu').style.display === 'flex') {
            document.getElementById('context-menu').style.display = 'none';
        }
    }

    rightMouseClickEvents(event) {
        event.preventDefault();
        if (document.getElementById('context-menu')) {
            if (event.button === 2) {
                var contextMenu = document.getElementById('context-menu'),
                    button = document.getElementById('context-menu-url');

                contextMenu.style.display = 'flex';
                contextMenu.style.left = event.clientX + 'px';
                contextMenu.style.top = event.clientY + 'px';
                document.getElementById('context-menu-copy-coords').dataset.coords = document.getElementById('map-element-mouse-position').textContent;
                document.getElementById('context-menu-copy-ingame-coords').dataset.coords = document.getElementById('map-element-mouse-position-game').value;

                if (document.getElementById('context-menu-standard')) {
                    if (event.target.classList.contains('map-icon')) {
                        document.getElementById('context-menu-standard').parentNode.style.display = 'flex';
                        document.getElementById('context-menu-standard').dataset.iconId = event.target.dataset.iconId;
                        document.getElementById('context-menu-standard').checked = iconJSON[event.target.dataset.iconId].standard;
                    } else {
                        document.getElementById('context-menu-standard').parentNode.style.display = 'none';
                    }
                }

                if (event.target.classList.contains('map-icon') && iconJSON[event.target.dataset.iconId].standard) {
                    button.textContent = 'Get URL to icon';
                    button.dataset.type = 'icon';
                    button.dataset.data = event.target.dataset.iconId;
                } else if (event.target.classList.contains('branch-path-map-label-text') && wotw.allBranches[event.target.dataset.indexes.split(' ')[0]].standard) {
                    button.textContent = 'Get URL to path node';
                    button.dataset.type = 'pathnode';
                    button.dataset.data = event.target.dataset.indexes;
                } else {
                    button.textContent = 'Get URL to location';
                    button.dataset.type = 'pos';
                    button.dataset.data = document.getElementById('map-element-mouse-position').textContent;
                }
            }
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case 'load':
                this.loadStandardData();
                break;

            case 'mouseup':
                this.clearMouseVars();
                break;

            case 'click':
                this.mouseClickEvents(event);
                break;

            case 'mousedown':
                this.map.isDraggingMap = true;
                break;

            case 'contextmenu':
                this.rightMouseClickEvents(event);
                break;

            case 'mouseout':
                if (this.divContainer.contains(event.target) === false) {
                    this.map.isDraggingMap = false;
                }
                break;

            case 'wheel':
                this.map.zoomMap(event);
                break;
        }
    }
}

var wotw = new WOTW();