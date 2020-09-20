class Route {
    constructor(name, category, difficulty, oob, branches = [], standard = false, id = false) {
        this.name = name;
        this.category = category;
        this.difficulty = difficulty;
        this.oob = oob;
        this.branches = branches;
        this.standard = standard;
        this.upload = false;
        this.showRouteButton();
        this.hasChanged;
        this.id = id;
    }

    save() {

    }

    validateBranches() {
        var tempBranches = {};

        if (this.branches instanceof Array) {
            for (var i = 0; i < this.branches.length; i++) {
                if (this.branches[i]) {
                    tempBranches[i] = this.branches[i];
                }
            }
            this.branches = tempBranches;
        } else {
            tempBranches = [];
            for (var key of Object.keys(this.branches)) {
                tempBranches.push({ index: key, branch: this.branches[key] });
            }
            this.branches = tempBranches;
        }
    }

    addBranch(branch) {
        if (branch && this.branches[branch] == undefined) {
            this.branches.push({ index: branch, branch: wotw.allBranches[branch].pathText });
            if (this === activeRoute) {
                this.updateBranchesHtml();
            }

            this.hasChanged = true;
        }
    }

    removeBranch(branch) {
        if (branch) {
            for (var i = 0; i < this.branches.length; i++) {
                if (branch === this.branches[i].index) {
                    this.branches.splice(i, 1);
                    this.hasChanged = true;
                    return true;
                }
            }
        }
    }

    insertBeforeBranch(before, branch) {
        var tempBeforeIndex = undefined,
            tempBranchIndex = undefined;

        for (var i = 0; i < this.branches.length; i++) {
            if (this.branches[i].index == before) {
                tempBeforeIndex = i;
            } else if (this.branches[i].index == branch) {
                tempBranchIndex = i;
            }
        }

        if (tempBeforeIndex !== undefined && tempBranchIndex !== undefined) {
            this.branches.splice(tempBeforeIndex, 0, this.branches[tempBranchIndex]);
            this.branches.splice(tempBranchIndex + 1, 1);
            this.hasChanged = true;
        }
    }

    getBranches() {
        var branches = [];
        for (var i = 0; i < this.branches.length; i++) {
            branches.push(wotw.allBranches[this.branches[i].index]);
        }
        return branches;
    }

    getAllBranchPickups() {
        var branches = this.getBranches(),
            pickups = [],
            frameIndex = 0;

        for (var i = 0; i < branches.length; i++) {
            for (var i2 = 0; i2 < branches[i].paths.length; i2++) {
                if (branches[i].paths[i2].checkPathLimitations() === false) {
                    for (var i3 = 0; i3 < branches[i].paths[i2].nodes.length; i3++) {
                        if (branches[i].paths[i2].nodes[i3].links.length > 0) {
                            var links = branches[i].paths[i2].nodes[i3].links;

                            for (var i4 = 0; i4 < links.length; i4++) {
                                var mapElement = document.getElementById(links[i4]);

                                if (mapElement && mapElement.classList.contains('map-icon')) {
                                    var icon = iconJSON[mapElement.dataset.iconId],
                                        iconData = iconDataNew[icon.category][icon.iconName];

                                    if (i2 === 0) {
                                        pickups.push({ data: iconData, iconName: icon.iconName, frame: frameIndex });
                                    } else {
                                        pickups.push({ data: iconData, iconName: icon.iconName, frame: (frameIndex - branches[i].paths[0].nodes.length) + branches[i].paths[i2].linkedIndex });
                                    }
                                }
                            }
                        }
                        if (branches[i].paths[i2].index === 0) {
                            frameIndex++;
                        }
                    }
                }
            }
        }

        return pickups;
    }

    updateBranchesHtml() {
        const routeContainer = document.getElementById('current-route-container'),
            routeBranches = routeContainer.querySelector('div.current-route-branches');

        routeBranches.innerHTML = '';

        var frameIndex = 0;
        for (var i = 0; i < this.branches.length; i++) {
            var template = document.getElementById('map-elements-current-route-branches'),
                clone = template.content.cloneNode(true),
                key = this.branches[i].index;

            wotw.allBranches[this.branches[i].index].frameIndex = frameIndex;
            frameIndex += wotw.allBranches[this.branches[i].index].paths[0].nodes.length;

            clone.querySelector('label.map-elements-current-route-branches-name').textContent = (i + 1) + ' - ' + (wotw.allBranches[key].paths[0].text !== undefined ? wotw.allBranches[key].paths[0].text : '');
            clone.querySelector('label.map-elements-current-route-branches-location').textContent = wotw.map.getMapLocation({ x: wotw.allBranches[key].paths[0].nodes[0].x, y: wotw.allBranches[key].paths[0].nodes[0].y });
            clone.querySelector('span.map-elements-current-route-branches-color').style.backgroundColor = wotw.allBranches[key].paths[0].color !== undefined ? wotw.allBranches[key].paths[0].color : 'red';
            clone.children[0].dataset.pos = wotw.allBranches[key].paths[0].nodes[0].x + ' ' + wotw.allBranches[key].paths[0].nodes[0].y;
            clone.children[0].dataset.indexes = wotw.allBranches[key].mapId;

            clone.children[0].id = Math.floor((Math.random() * 100000000) + 1);

            clone.children[0].addEventListener('click', function () {
                var newPos = this.dataset.pos.split(' ');
                ctxPaint.clearRect(0, 0, cvsPaint.width, cvsPaint.height);
                wotw.map.setMap({ x: newPos[0] * -1, y: newPos[1] * -1 });
                activeBranch = wotw.allBranches[this.dataset.indexes];
                wotw.allBranches[this.dataset.indexes].drawPaths();
                generateParamsUrl('path', 'set', this.dataset.indexes);
            });

            routeBranches.appendChild(clone);
        }
    }

    showRouteButton() {
        if (document.getElementById('map-elements-route')) {
            var button = document.createElement('button');

            button.className = 'map-element-routes-button';
            button.textContent = this.name;

            //document.querySelector('div.map-elements-routes').appendChild(button);

            var temp = document.getElementById('map-elements-route'),
                clon = temp.content.cloneNode(true);

            clon.children[0].addEventListener('click', this, false);
            clon.querySelector('label.current-route-name').textContent = this.name;
            clon.querySelector('label.current-route-difficulty').textContent = document.getElementById('new-route-difficulty').querySelector('option[value=' + this.difficulty + ']').textContent;
            clon.querySelector('label.current-route-category').textContent = this.category;
            clon.querySelector('label.current-route-oob').textContent = document.getElementById('new-route-oob').querySelector('option[value=' + this.oob + ']').textContent;

            document.querySelector('div.map-elements-routes').appendChild(clon);
        }
    }

    showAllBranchesSelect() {
        var currentRouteBranches = document.getElementById('current-route-branches-list'),
            allBranches = document.querySelector('div.map-elements-branches').children,
            length = currentRouteBranches.childNodes.length;

        for (var i = 0; i < length; i++) {
            currentRouteBranches.childNodes[0].remove();
        }

        for (var i = 0; i < allBranches.length; i++) {
            var option = document.createElement('option');

            option.value = allBranches[i].dataset.indexes;
            option.textContent = allBranches[i].textContent;

            currentRouteBranches.appendChild(option);
        }
    }

    showData() {
        if (document.getElementById('current-route-container')) {
            const routeContainer = document.getElementById('current-route-container'),
                routeName = routeContainer.querySelector('label.current-route-name'),
                routeCategory = routeContainer.querySelector('label.current-route-category'),
                routeDifficulty = routeContainer.querySelector('label.current-route-difficulty'),
                routeOOB = routeContainer.querySelector('label.current-route-oob');

            routeName.textContent = this.name;
            routeName.nextElementSibling.value = this.name;
            routeCategory.textContent = this.category;
            routeCategory.nextElementSibling.value = this.category;
            routeDifficulty.textContent = document.getElementById('new-route-difficulty').querySelector('option[value=' + this.difficulty + ']').textContent;
            routeDifficulty.nextElementSibling.option = routeDifficulty.nextElementSibling.value = this.difficulty;
            routeOOB.textContent = document.getElementById('new-route-oob').querySelector('option[value=' + this.oob + ']').textContent;
            routeOOB.nextElementSibling.option = routeOOB.nextElementSibling.value = this.oob;

            if (routeContainer.querySelector('label.current-route-standard')) {
                let routeStandard = routeContainer.querySelector('label.current-route-standard');
                routeStandard.textContent = this.standard;
                routeStandard.nextElementSibling.checked = this.standard;
            }

            this.updateBranchesHtml();
            this.showAllBranchesSelect();
            wotw.timeline.updateFrameLabels(document.getElementById('framecontainer'));
            wotw.drawer.drawFrames(0);
        }
    }

    handleEvent(event) {
        var element = event.target;
        if (element) {
            switch (event.type) {
                case 'click':
                    if (element.classList.contains('map-elements-route')) {
                        activeRoute = this;
                        activeBranch = wotw.getBranch(this.branches[0]);
                        wotw.drawer.activeFrame = 0;
                        this.showData();
                        generateParamsUrl('route', 'set', this.name);
                    }
                    break;
            }
        }
    }
}

class Branch {
    constructor(mapId, standard = false, id = false) {
        this.paths = [];
        this.name = '';
        this.category = '';
        this.mapId = mapId;
        this.standard = standard;
        this.upload = false;
        this.hasChanged;
        this.id = id;
    }

    setName(name) {
        this.name = name;
        this.hasChanged = true;
    }

    setCategory(category) {
        this.category = category;
        this.hasChanged = true;
    }

    validatePathNodeIndex() {
        for (var i = 0; i < this.path.length; i++) {
            this.path[i].pathIndex = this.mapId;
        }
        for (var i = 0; i < this.subPaths.length; i++) {
            for (var i2 = 0; i2 < this.subPaths[i].length; i2++) {
                this.subPaths[i][i2].pathIndex = this.mapId;
            }
        }
        this.hasChanged = true;
    }

    drawPaths() {
        if (document.getElementById('branch-paths')) {
            var elPaths = document.getElementById('branch-paths');
            if (activeBranch == this) {
                elPaths.innerHTML = '';
            }

            if (activeBranch !== this) {
                ctxPaint.globalAlpha = 0.2;
            } else {
                ctxPaint.globalAlpha = 1.0;
                generateParamsUrl('path', 'set', this.mapId);
                wotw.timeline.setFrameMoverFrame(this.frameIndex);
            }
            if (drawAllFullColor) {
                ctxPaint.globalAlpha = 1.0;
            }

            for (var i = 0; i < this.paths.length; i++) {
                this.paths[i].draw();
            }
        }
    }

    drawPathSE(start, end) {
        if (document.getElementById('branch-paths')) {
            var elPaths = document.getElementById('branch-paths');
            if (activeBranch == this) {
                elPaths.innerHTML = '';
            }

            if (activeBranch !== this) {
                ctxPaint.globalAlpha = 0.2;
            } else {
                ctxPaint.globalAlpha = 1.0;
                generateParamsUrl('path', 'set', this.mapId);
            }
            if (drawAllFullColor) {
                ctxPaint.globalAlpha = 1.0;
            }

            for (var i = 0; i < this.paths.length; i++) {
                this.paths[i].draw(start, end);
            }
        }
    }

    reIndexPath(path) {
        for (var i = 0; i < path.length; i++) {
            path[i].index = i;
        }
    }

    saveBranch() {
        var json = {};
        json.category = this.category;
        json.mapId = this.mapId;
        json.name = this.name;
        json.paths = this.paths;
        json.id = this.id;

        return json;
    }

    duplicateBranch() {
        var data = this.saveBranch();
        data = JSON.parse(JSON.stringify(data));
        data.mapId = wotw.allBranches.length;
        delete data.id;
        data.standard = false;

        var newBranch = new Branch(wotw.allBranches.length);
        newBranch.loadBranch(data);
        newBranch.validatePathNodeIndex();
        wotw.allBranches.push(newBranch);
        wotw.listMapElements('branch', wotw.allBranches);
    }

    loadBranch(json) {
        this.category = json.category;
        this.mapId = json.mapId;
        this.name = json.name;

        if (json.path) {
            var mergedPaths = [json.path];
            var mergedPathInfo = [{ text: json.pathText, color: json.pathColor }];
            if (json.subPaths) { mergedPaths = mergedPaths.concat(json.subPaths); }
            if (json.pathLimitations !== undefined) { mergedPathInfo[0].pathLimitations = json.pathLimitations; }
            if (json.subPathsInfo) { mergedPathInfo = mergedPathInfo.concat(json.subPathsInfo); }
            for (var i = 0; i < mergedPaths.length; i++) {
                var newPath = new Path(i, this.mapId);
                newPath.load(mergedPaths[i], mergedPathInfo[i]);
                this.paths.push(newPath);
            }
        } else {
            for (var i = 0; i < json.paths.length; i++) {
                var newPath = new Path(i, this.mapId);
                newPath.load(json.paths[i]);
                this.paths.push(newPath);
            }
        }
    }
}

class Path {
    constructor(index = 0, branchIndex = -1, standard = false, id = false) {
        this.nodes = [];
        this.index = index;
        this.branchIndex = branchIndex;
        this.linkedIndex = -1;
        this.mapNodes = [];
        this.mapAnchors = [];
        this.limitations = { difficulties: [], categories: [], restrictions: [] };
        this.color = 'red';
        this.text = 'text';
        this.standard = standard;
        this.upload = false;
        this.hasChanged;
        this.id = id;
    }

    load(nodes, pathData) {
        if (nodes.text) {
            if (nodes.linkedIndex) { this.linkedIndex = parseInt(nodes.linkedIndex); }

            this.text = nodes.text;
            this.color = nodes.color;
            this.limitations = (nodes.limitations !== undefined && nodes.limitations.categories !== undefined ? nodes.limitations : { difficulties: [], categories: [], restrictions: [] });
            for (var i = 0; i < nodes.nodes.length; i++) {
                const temp = new PathNode();
                temp.load(nodes.nodes[i]);
                temp.pathIndex = this.index;
                this.nodes.push(temp);
            }
        } else {
            if (pathData) {
                if (pathData.linkedIndex) { this.linkedIndex = parseInt(pathData.linkedIndex); }

                this.text = pathData.text;
                this.color = pathData.color;
                this.limitations = pathData.pathLimitations !== undefined && pathData.pathLimitations.length > 0 ? pathData.pathLimitations : { difficulties: [], categories: [], restrictions: [] };
            }
            for (var i = 0; i < nodes.length; i++) {
                const temp = new PathNode();
                temp.load(nodes[i]);
                temp.pathIndex = this.index;
                this.nodes.push(temp);
            }
        }
    }

    newPath(path, pathIndex = null) {
        var nIndex;

        if (pathIndex === null) {
            nIndex = this.nodes.length;
        } else {
            nIndex = pathIndex;
        }

        for (var i = 0; i < path.length; i++) {
            var pos = path[i],
                newPos = new PathNode();

            newPos.setPosition(pos);
            newPos.index = nIndex;
            newPos.pathIndex = this.index;
            newPos.branchIndex = this.branchIndex;
            if (pathIndex === null) {
                this.nodes.push(newPos);
            } else {
                this.nodes.splice(pathIndex, 0, newPos);
                pathIndex++;
            }
            nIndex++;
        }
        if (pathIndex !== null) {
            for (var i = pathIndex; i < this.nodes.length; i++) {
                this.nodes[i].index = i;
            }
        }
        wotw.allBranches[this.branchIndex].hasChanged = true;
    }

    reIndexNodes() {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].index = i;
            this.nodes[i].branchIndex = this.branchIndex;
            this.nodes[i].pathIndex = this.index;
        }
        wotw.allBranches[this.branchIndex].hasChanged = true;
    }

    removeNode(element) {
        var indexes = element.dataset.indexes.split(' '),
            index = indexes[0];

        this.nodes.splice(index, 1);
        this.reIndexNodes();
    }

    removeMapNodes() {
        for (var i = 0; i < this.mapNodes.length; i++) {
            this.mapNodes[i].remove();
        }
        this.mapNodes = [];
    }

    removeAnchors() {
        for (var i = 0; i < this.mapAnchors.length; i++) {
            this.mapAnchors[i].remove();
        }
        this.mapAnchors = [];
    }

    checkPathLimitations() {
        if (this.limitations.categories.length > 0 && this.limitations.categories.indexOf(activeRoute.category) === -1) {
            return true;
        }
        if (this.limitations.difficulties.length > 0 && this.limitations.difficulties.indexOf(activeRoute.difficulty) === -1) {
            return true;
        }
        if (this.limitations.restrictions.length > 0 && this.limitations.restrictions.indexOf(activeRoute.oob) === -1) {
            return true;
        }
        return false;
    }

    createTextNode(node, nodeIndex, nodeTextCont) {
        var label = document.createElement('label'),
            mapLabel = document.createElement('label'),
            mapContainer = document.getElementById('orimap-container');

        const pos = { x: node.x, y: node.y };

        label.textContent = node.text;
        label.className = 'branch-count ori-glow';
        label.setAttribute('nodeindex', nodeIndex);
        label.addEventListener('click', function () { wotw.map.setMap({ x: pos.x * -1, y: pos.y * -1 }) });
        nodeTextCont.appendChild(label);

        mapLabel.textContent = nodeIndex;
        mapLabel.dataset.text = node.text;
        mapLabel.dataset.indexes = node.pathIndex + ' ' + node.index + (node.subPathIndex !== null ? ' ' + node.subPathIndex : '');
        mapLabel.className = 'branch-path-map-label-text ori-glow';
        mapLabel.style.backgroundColor = this.color;
        mapLabel.style.left = pos.x - 10 + 'px';
        mapLabel.style.top = pos.y - 10 + 'px';
        this.mapNodes.push(mapLabel);
        mapContainer.appendChild(mapLabel);
    }

    createNodeLinks(node, nodeIndex, nodeTextCont) {
        for (var iL = 0; iL < node.links.length; iL++) {
            var linkedElement = document.getElementById(node.links[iL]);
            if (linkedElement) {
                linkedElement.style.display = 'flex';
                var cont = document.createElement('div'),
                    label = document.createElement('label'),
                    mapPos = linkedElement.dataset.pos.split(' '),
                    labelIcon = document.createElement('span');

                cont.style.display = 'flex';
                label.className = "branch-path-node-texts-map-comment ori-glow";
                labelIcon.style.display = 'block';
                labelIcon.style.width = '16px';
                labelIcon.style.height = '16px';
                labelIcon.style.backgroundSize = 'contain';
                labelIcon.style.marginRight = '5px';

                if (linkedElement.classList.contains('popup')) {
                    labelIcon.dataset.iconName = linkedElement.children[0].dataset.iconName;
                    labelIcon.dataset.category = linkedElement.children[0].dataset.category;
                    wotw.iconFactory.setIconFromSheet(labelIcon);
                    label.textContent = popupJSON[linkedElement.dataset.popupId].name;//.querySelector('input[data-type="name"]').value;
                } else if (linkedElement.classList.contains('map-icon')) {
                    labelIcon.dataset.iconName = linkedElement.dataset.iconName;
                    labelIcon.dataset.category = linkedElement.dataset.category;
                    wotw.iconFactory.setIconFromSheet(labelIcon);
                    label.textContent = linkedElement.dataset.name;
                }
                label.setAttribute('nodeindex', nodeIndex);
                label.dataset.mappos = (mapPos[0] * -1) + ' ' + (mapPos[1] * -1);
                label.addEventListener('click', function () { const pos = this.dataset.mappos.split(' '); wotw.map.setMap({ x: pos[0], y: pos[1] }) });
                cont.appendChild(labelIcon);
                cont.appendChild(label);
                nodeTextCont.appendChild(cont);
            }
        }
    }

    draw(start = 0, end = this.nodes.length) {
        this.removeAnchors();
        this.removeMapNodes();

        if (this.checkPathLimitations() === false) {
            if (this.index > 0) {
                if (this.linkedIndex > start && this.linkedIndex < end || isEditingMode) {
                    start = 0;
                    end = this.nodes.length;
                } else {
                    start = 0;
                    end = 0;
                }
            }
            this.createControls();

            var nodeTextCont = document.body.querySelectorAll('div.branch-path-node-texts'),
                nodeTextIndex = 1;

            nodeTextCont = nodeTextCont[nodeTextCont.length - 1];
            ctxPaint.beginPath();
            ctxPaint.strokeStyle = this.color;
            ctxPaint.lineWidth = 3;
            for (var i = start; i < end; i++) {
                const node = this.nodes[i],
                    pos = { x: node.x, y: node.y };

                //paint line
                ctxPaint.strokeStyle = this.color;
                if (i === 0 || node.isGap) {
                    if (node.isGap && i === this.nodes.length - 1 || i === this.nodes.length - 1 && i === 0 || this.nodes[i + 1] && this.nodes[i + 1].isGap) {
                        ctxPaint.rect(pos.x - 1, pos.y - 1, 1, 1);
                    } else {
                        ctxPaint.moveTo(pos.x, pos.y);
                    }
                } else {
                    if (this.nodes[i + 1] && this.nodes[i + 1].isGap && i === this.nodes.length - 1 || i === this.nodes.length - 1 && i === 0) {
                        ctxPaint.rect(pos.x - 1, pos.y - 1, 1, 1);
                    } else {
                        ctxPaint.lineTo(pos.x, pos.y);
                    }
                }

                if (isEditingMode) {
                    this.mapAnchors.push(node.createAnchor(i));
                    //this.createAnchor(pos);
                }

                if (node.text) {
                    this.createTextNode(node, nodeTextIndex, nodeTextCont);
                    nodeTextIndex++;
                }

                if (node.links) {
                    this.createNodeLinks(node, nodeTextIndex, nodeTextCont);
                }
            }
            ctxPaint.stroke();
            ctxPaint.lineWidth = 1;
        }
    }

    createControls() {
        var elPaths = document.getElementById('branch-paths'),
            temp = document.getElementById('branch-path-template'),
            clon = temp.content.cloneNode(true),
            start = clon.querySelector('label.branch-path-child-start'),
            end = clon.querySelector('label.branch-path-child-end'),
            subnodeIndex = clon.querySelector('input.branch-path-child-subnode-index'),
            standard = clon.querySelector('input.branch-path-child-standard'),
            color = clon.querySelector('input.branch-path-child-color'),
            text = clon.querySelector('div.branch-path-child-text'),
            categories = clon.querySelector('fieldset.branch-path-child-categories'),
            difficulties = clon.querySelector('fieldset.branch-path-child-difficulties'),
            restrictions = clon.querySelector('fieldset.branch-path-child-restrictions');

        clon.children[0].style.border = '1px solid ' + this.color;

        start.textContent = 0;
        end.textContent = this.nodes.length - 1;

        if (this.index === 0) {
            subnodeIndex.remove();
        } else {
            subnodeIndex.value = this.linkedIndex;
            subnodeIndex.dataset.subPath = this.index;
            subnodeIndex.setAttribute('linkedIndex', 'true');
            subnodeIndex.addEventListener('input', this, false);
        }

        if (standard) {
            standard.checked = this.standard;
            standard.addEventListener('change', this, false);
        }

        color.value = this.color;
        if (this.index === 0) {
            color.dataset.mainPath = 'true';
        }
        color.setAttribute('color', 'true');
        color.addEventListener('input', this, false);

        text.textContent = this.text;
        if (this.index === 0) {
            text.dataset.mainPath = 'true';
        }
        text.setAttribute('text', 'true');
        //children[4].style.border = '1px solid ' + this.pathColor;
        text.addEventListener('input', this, false);

        categories.addEventListener('change', this, false);
        var categoriesChildren = categories.querySelectorAll('input.branch-path-limitations');
        for (var i = 0; i < categoriesChildren.length; i++) {
            if (this.limitations.categories.indexOf(categoriesChildren[i].value) !== -1) {
                categoriesChildren[i].checked = true;
            }
        }

        difficulties.addEventListener('change', this, false);
        var difficultiesChildren = difficulties.querySelectorAll('input.branch-path-limitations');
        for (var i = 0; i < difficultiesChildren.length; i++) {
            if (this.limitations.difficulties.indexOf(difficultiesChildren[i].value) !== -1) {
                difficultiesChildren[i].checked = true;
            }
        }

        restrictions.addEventListener('change', this, false);
        var restrictionsChildren = restrictions.querySelectorAll('input.branch-path-limitations');
        for (var i = 0; i < restrictionsChildren.length; i++) {
            if (this.limitations.restrictions.indexOf(restrictionsChildren[i].value) !== -1) {
                restrictionsChildren[i].checked = true;
            }
        }

        elPaths.appendChild(clon);
    }

    handleEvent(e) {
        activeBranch = wotw.allBranches[this.branchIndex];
        wotw.allBranches[this.branchIndex].hasChanged = true;
        switch (e.type) {
            case 'input':
                if (e.target.hasAttribute('text')) {
                    this.text = e.target.textContent;
                } else if (e.target.hasAttribute('color')) {
                    this.color = e.target.value;
                } else if (e.target.hasAttribute('linkedIndex')) {
                    this.linkedIndex = e.target.value;
                }

                if (this.index === 0) {
                    var pathConts = document.querySelectorAll('div[data-indexes="' + this.branchIndex + '"]');
                    for (var i = 0; i < pathConts.length; i++) {
                        if (pathConts[i].parentNode.classList.contains('current-route-branches')) {
                            var name = pathConts[i].querySelector('label.map-elements-current-route-branches-name').textContent.split(' - ');
                            pathConts[i].querySelector('label.map-elements-current-route-branches-name').textContent = name[0] + ' - ' + this.text;
                        } else {
                            pathConts[i].querySelector('label.map-elements-current-route-branches-name').textContent = this.text;
                        }
                        pathConts[i].querySelector('span.map-elements-current-route-branches-color').style.backgroundColor = this.color;
                    }
                }
                break;

            case 'change':
                if (e.target.classList.contains('branch-path-child-standard')) {
                    //this.upload = e.target.checked;
                    wotw.allBranches[this.branchIndex].upload = e.target.checked;
                } else if (e.target.classList.contains('branch-path-limitations')) {
                    if (e.target.dataset.type) {
                        switch (e.target.dataset.type) {
                            case 'categories':
                                if (e.target.checked) {
                                    this.limitations.categories.push(e.target.value);
                                } else {
                                    this.limitations.categories.splice(this.limitations.categories.indexOf(e.target.value), 1);
                                }
                                break;

                            case 'difficulties':
                                if (e.target.checked) {
                                    this.limitations.difficulties.push(e.target.value);
                                } else {
                                    this.limitations.difficulties.splice(this.limitations.difficulties.indexOf(e.target.value), 1);
                                }
                                break;

                            case 'restrictions':
                                if (e.target.checked) {
                                    this.limitations.restrictions.push(e.target.value);
                                } else {
                                    this.limitations.restrictions.splice(this.limitations.restrictions.indexOf(e.target.value), 1);
                                }
                                break;
                        }
                    }
                }
                break;
        }
    }
}

class PathNode {
    constructor() {
        this.index = null;
        this.pathIndex = null;
        this.branchIndex = null;
        //this.subPathIndex = null;
        this.x = null;
        this.y = null;
        this.isGap = false;
        this.links = [];
        this.text = '';
    }

    load(data) {
        this.index = data.index;
        if (data.branchIndex !== undefined) {
            this.branchIndex = data.branchIndex;
            this.pathIndex = data.pathIndex;
        } else {
            this.branchIndex = data.pathIndex;
            this.pathIndex = data.subPathIndex === null ? 0 : data.subPathIndex;
        }
        this.x = data.x;
        this.y = data.y;
        this.links = data.links !== undefined ? data.links : [];
        this.text = data.text !== undefined ? data.text : '';
        this.isGap = data.isGap;
    }

    save() {

    }

    addLink(id) {
        this.links.push(id);
        wotw.allBranches[this.branchIndex].hasChanged = true;
        mapLinkerElement = undefined;
    }

    setPosition(newPosition) {
        if (newPosition.x) {
            this.x = newPosition.x;
            this.y = newPosition.y;
        } else if (typeof newPosition === 'string') {
            const temp = newPosition.split(' ');
            this.x = temp[0];
            this.y = temp[1];
        }
        if (wotw.allBranches[this.branchIndex]) {
            wotw.allBranches[this.branchIndex].hasChanged = true;
        }
    }

    createAnchor(nodeIndex) {
        var anchor = document.createElement('button');

        anchor.textContent = this.index;
        anchor.className = "frame-position-button";
        anchor.style.left = this.x + 'px';
        anchor.style.top = this.y + 'px';
        anchor.style.zIndex = 999999 - nodeIndex;
        anchor.dataset.indexes = this.index + ' ' + this.pathIndex + ' ' + this.branchIndex;
        anchor.addEventListener('mousedown', this, true);
        anchor.addEventListener('mouseup', this, false);
        document.getElementById('orimap-container').appendChild(anchor);

        return anchor;
    }

    createAnchorTextbox() {
        var anchorCont = document.getElementById('anchor-textbox')

        anchorCont.style.display = 'flex';
        anchorCont.style.left = this.x + 15 + 'px';
        anchorCont.style.top = this.y + 15 + 'px';

        anchorCont.querySelector('button.popup-link-picker').setAttribute('showedit', true);
        if (anchorCont.querySelector('button.popup-link-picker').onmousedown) {
            anchorCont.querySelector('button.popup-link-picker').onmousedown.bind(this);
        } else {
            anchorCont.querySelector('button.popup-link-picker').addEventListener('mousedown', this, false);
        }

        document.getElementById('anchor-links').innerHTML = '';
        for (var i = 0; i < this.links.length; i++) {
            var linkButton = document.createElement('button'),
                linkEl = document.getElementById(this.links[i]);

            linkButton.dataset.popup = 'Remove this link';
            linkButton.className = 'popup-onlyedit map-icon map-hover-info';
            linkButton.setAttribute('showedit', true);
            linkButton.setAttribute('removelink', i);
            linkButton.addEventListener('mousedown', this, false);

            if (linkEl) {
                if (linkEl.classList.contains('popup')) {
                    linkButton.dataset.popup = popupJSON[document.getElementById(this.links[i]).dataset.popupId].name + ', Remove this link';
                    linkButton.dataset.iconName = popupJSON[document.getElementById(this.links[i]).dataset.popupId].icon.iconName;
                    linkButton.dataset.category = popupJSON[document.getElementById(this.links[i]).dataset.popupId].icon.category;
                    wotw.iconFactory.setIconFromSheet(linkButton);
                } else if (linkEl.classList.contains('map-icon')) {
                    linkButton.dataset.popup = linkEl.dataset.name + ', Remove this link';
                    linkButton.dataset.iconName = linkEl.dataset.iconName;
                    linkButton.dataset.category = linkEl.dataset.category;
                    wotw.iconFactory.setIconFromSheet(linkButton);
                }
            }
            linkButton.style.transform = 'inherit';

            document.getElementById('anchor-links').appendChild(linkButton);
        }

        anchorCont.querySelector('input').addEventListener('input', this, false);
        anchorCont.querySelector('input').checked = this.isGap;

        anchorCont.querySelector('textarea').dataset.indexes = this.index + ' ' + this.pathIndex + ' ' + this.branchIndex;

        if (this.text) {
            anchorCont.querySelector('textarea').value = this.text;
        } else {
            anchorCont.querySelector('textarea').value = '';
        }

        anchorCont.querySelector('textarea').addEventListener('change', this, false);

        anchorCont.addEventListener('blur', function () { if (!this.contains(event.explicitOriginalTarget)) { this.style.display = 'none'; this.outerHTML = this.outerHTML; } }, true);

        anchorCont.querySelector('textarea').focus();
    }

    handleEvent(event) {
        switch (event.type) {
            case 'change':
                wotw.allBranches[this.branchIndex].hasChanged = true;
                if (event.target.dataset.indexes) {
                    this.text = event.target.value;
                }
                if (event.target.nodeName === 'INPUT' && event.target.type === 'checkbox') {
                    this.isGap = event.target.checked;
                }
                break;

            case 'mouseup':
                if (event.target.dataset.indexes && isNodeMode === false) {
                    this.createAnchorTextbox();
                }
                break;

            case 'mousedown':
                if (event.target.classList.contains('popup-link-picker')) {
                    mapLinkerElement = this;
                } else if (event.target.hasAttribute('removelink')) {
                    this.links.splice(parseInt(event.target.getAttribute('removelink')), 1);
                    event.target.remove();
                    wotw.allBranches[this.branchIndex].hasChanged = true;
                } else if (isPaintMode || isSubPathMode) {
                    mousePosRecords = [];
                    activeBranchPathNodeIndex = this.index;
                    activeBranchPathIndex = this.pathIndex;
                    activeBranchIndex = this.branchIndex;
                    isPainting = true;
                } else {
                    anchorDragging = true;
                    anchorBeingDragged = event.target;
                }

                break;

            case 'input':
                if (event.target.nodeName === 'INPUT' && event.target.type === 'checkbox') {
                    this.isGap = event.target.checked;
                    wotw.allBranches[this.branchIndex].hasChanged = true;
                }
                break;
        }
    }
}

class Inventory {
    constructor() {
        this.firstOpherBuy = true;
        this.pickups = [];
        this.spiritLight = 0;
        this.totalPickedSpiritLight = 0;
        this.totalSpiritLight = 0;
        this.spiritLightSpent = 0;
        this.energy = 3;
        this.minimumEnergy = 3;
        this.totalPickedEnergy = 0;
        this.totalEnergy = 3;
        this.health = 3;
        this.minimumHealth = 3;
        this.totalPickedHealth = 0;
        this.totalHealth = 3;
        this.keystones = 0;
        this.totalPickedKeystones = 0;
        this.totalKeystones = 0;
        this.usedKeyStones = 0;
        this.gorlekOre = 0;
        this.totalPickedGorlekOre = 0;
        this.totalGorlekOre = 0;
        this.usedGorlekOre = 0;
        this.abilities = [];
        this.shards = [];
        this.shardUpgrades = {};
        this.projectBuilders = [];
        this.projectGardeners = [];
        this.sideQuests = [];
        this.mainQuests = [];
    }

    reset() {
        this.firstOpherBuy = true;
        this.spiritLight = 0;
        this.totalPickedSpiritLight = 0;
        this.totalSpiritLight = 0;
        this.spiritLightSpent = 0;
        this.energy = 3;
        this.minimumEnergy = 3;
        this.totalPickedEnergy = 0;
        this.totalEnergy = 3;
        this.health = 3;
        this.minimumHealth = 3;
        this.totalPickedHealth = 0;
        this.totalHealth = 3;
        this.keystones = 0;
        this.totalPickedKeystones = 0;
        this.totalKeystones = 0;
        this.usedKeyStones = 0;
        this.gorlekOre = 0;
        this.totalPickedGorlekOre = 0;
        this.totalGorlekOre = 0;
        this.usedGorlekOre = 0;
        this.abilities = [];
        this.shards = [];
        this.shardUpgrades = {};
        this.projectBuilders = [];
        this.projectGardeners = [];
        this.sideQuests = [];
        this.mainQuests = [];
    }

    createHTML() {
        if (document.getElementById('inventory')) {
            var cont = document.getElementById('inventory'),
                contPickups = document.createElement('div'),
                contAbilities = document.createElement('div'),
                contShards = document.createElement('div'),
                contBuilderProjects = document.createElement('div'),
                contGardenerProjects = document.createElement('div'),
                labelCont = document.createElement('div'),
                labelIcon = document.createElement('span');

            cont.innerHTML = '';
            activeIconPicker = undefined;

            contPickups.className = 'map-elements-inventory-pickups';
            contAbilities.className = 'map-elements-inventory-abilities';
            contShards.className = 'map-elements-inventory-shards';

            labelIcon.style.display = 'block';
            labelIcon.style.width = '24px';
            labelIcon.style.height = '24px';
            labelIcon.style.backgroundSize = 'contain';
            labelIcon.style.marginRight = '2px';
            labelIcon.className = 'icon-picker';

            var label = document.createElement('label');
            label.className = 'map-hover-info';
            label.textContent = this.spiritLight;
            label.dataset.popup = 'Current: ' + this.spiritLight + ', picked up: ' + this.totalPickedSpiritLight + ', total: ' + this.totalSpiritLight;
            //label.textContent = this.spiritLight + '/' + this.totalPickedSpiritLight + '/' + this.totalSpiritLight;
            labelIcon.dataset.iconName = 'Small Experience';
            labelIcon.dataset.category = 'pickup';
            labelIcon.dataset.name = 'Spirit Light';
            wotw.iconFactory.setIconFromSheet(labelIcon);

            labelCont.appendChild(labelIcon);
            labelCont.appendChild(label);
            contPickups.appendChild(labelCont);

            labelCont = document.createElement('div');
            labelIcon = labelIcon.cloneNode(true);
            label = document.createElement('label');
            label.className = 'map-hover-info';
            label.textContent = this.energy;
            label.dataset.popup = 'Current: ' + this.energy + ', picked up: ' + this.totalPickedEnergy + ', total: ' + this.totalEnergy;
            //label.dataset.popup = this.energy + '/' + this.totalPickedEnergy + '/' + this.totalEnergy;
            labelIcon.dataset.iconName = 'Energy Container';
            labelIcon.dataset.category = 'pickup';
            labelIcon.dataset.name = 'Energy';
            wotw.iconFactory.setIconFromSheet(labelIcon);

            labelCont.appendChild(labelIcon);
            labelCont.appendChild(label);
            contPickups.appendChild(labelCont);

            labelCont = document.createElement('div');
            labelIcon = labelIcon.cloneNode(true);
            label = document.createElement('label');
            label.className = 'map-hover-info';
            label.textContent = this.health;
            label.dataset.popup = 'Current: ' + this.health + ', picked up: ' + this.totalPickedHealth + ', total: ' + this.totalHealth;
            //label.textContent = this.health + '/' + this.totalPickedHealth + '/' + this.totalHealth;
            labelIcon.dataset.iconName = 'Life Cell';
            labelIcon.dataset.category = 'pickup';
            labelIcon.dataset.name = 'Life';
            wotw.iconFactory.setIconFromSheet(labelIcon);

            labelCont.appendChild(labelIcon);
            labelCont.appendChild(label);
            contPickups.appendChild(labelCont);

            labelCont = document.createElement('div');
            labelIcon = labelIcon.cloneNode(true);
            label = document.createElement('label');
            label.className = 'map-hover-info';
            label.textContent = this.keystones;
            label.dataset.popup = 'Current: ' + this.keystones + ', picked up: ' + this.totalPickedKeystones + ', total: ' + this.totalKeystones;
            labelIcon.dataset.iconName = 'Keystone';
            labelIcon.dataset.category = 'pickup';
            labelIcon.dataset.name = 'Keystones';
            wotw.iconFactory.setIconFromSheet(labelIcon);

            labelCont.appendChild(labelIcon);
            labelCont.appendChild(label);
            contPickups.appendChild(labelCont);

            labelCont = document.createElement('div');
            labelIcon = labelIcon.cloneNode(true);
            label = document.createElement('label');
            label.className = 'map-hover-info';
            label.textContent = this.gorlekOre;
            label.dataset.popup = 'Current: ' + this.gorlekOre + ', picked up: ' + this.totalPickedGorlekOre + ', total: ' + this.totalGorlekOre;
            //label.textContent = this.gorlekOre + '/' + this.totalPickedGorlekOre + '/' + this.totalGorlekOre;
            labelIcon.dataset.iconName = 'Ore';
            labelIcon.dataset.category = 'pickup';
            labelIcon.dataset.name = 'Gorlek Ore';
            wotw.iconFactory.setIconFromSheet(labelIcon);

            labelCont.appendChild(labelIcon);
            labelCont.appendChild(label);
            contPickups.appendChild(labelCont);

            cont.appendChild(contPickups);

            for (var i = 0; i < this.abilities.length; i++) {
                var ability = this.pickups[this.abilities[i]];

                labelIcon = labelIcon.cloneNode(true);
                labelIcon.style.width = '32px';
                labelIcon.style.height = '32px';
                labelIcon.dataset.iconName = ability.iconName;
                labelIcon.dataset.category = ability.data.category;
                labelIcon.dataset.name = ability.data.name;
                wotw.iconFactory.setIconFromSheet(labelIcon);

                if (wotw.drawer.activeFrame < ability.frame) {
                    labelIcon.style.filter = 'grayscale(100%) brightness(50%)';
                } else {
                    labelIcon.style.filter = 'brightness(100%)';
                }

                contAbilities.appendChild(labelIcon);
            }
            cont.appendChild(contAbilities);

            var addedShards = {};
            for (var i = 0; i < this.shards.length; i++) {
                var shard = this.pickups[this.shards[i]];

                if (addedShards[shard.data.name] === undefined) {
                    labelIcon = labelIcon.cloneNode(true);
                    labelIcon.style.width = '32px';
                    labelIcon.style.height = '32px';
                    labelIcon.dataset.iconName = shard.iconName;
                    labelIcon.dataset.category = shard.data.category;
                    labelIcon.dataset.name = shard.data.name;
                    wotw.iconFactory.setIconFromSheet(labelIcon);

                    if (wotw.drawer.activeFrame >= shard.frame) {
                        labelIcon.style.filter = 'drop-shadow(rgb(0, 195, 255) 0px 0px 2px) brightness(100%)';
                    } else {
                        labelIcon.style.filter = 'brightness(50%)';
                    }

                    contShards.appendChild(labelIcon);
                    addedShards[shard.data.name] = 0;
                } else {
                    addedShards[shard.data.name] += 1;
                }
            }
            cont.appendChild(contShards);

            for (var i = 0; i < this.projectBuilders.length; i++) {
                var projectBuilder = this.pickups[this.projectBuilders[i]];

                labelIcon = labelIcon.cloneNode(true);
                labelIcon.style.width = '32px';
                labelIcon.style.height = '32px';
                labelIcon.dataset.iconName = projectBuilder.iconName;
                labelIcon.dataset.category = projectBuilder.data.category;
                labelIcon.dataset.name = projectBuilder.data.name;
                wotw.iconFactory.setIconFromSheet(labelIcon);

                if (wotw.drawer.activeFrame >= projectBuilder.frame) {
                    labelIcon.style.filter = 'drop-shadow(rgb(0, 195, 255) 0px 0px 2px) brightness(100%)';
                } else {
                    labelIcon.style.filter = 'brightness(50%)';
                }

                contBuilderProjects.appendChild(labelIcon);
            }
            cont.appendChild(contBuilderProjects);

            for (var i = 0; i < this.projectGardeners.length; i++) {
                var projectGardener = this.pickups[this.projectGardeners[i]];

                labelIcon = labelIcon.cloneNode(true);
                labelIcon.style.width = '32px';
                labelIcon.style.height = '32px';
                labelIcon.dataset.iconName = projectGardener.iconName;
                labelIcon.dataset.category = projectGardener.data.category;
                labelIcon.dataset.name = projectGardener.data.name;
                wotw.iconFactory.setIconFromSheet(labelIcon);

                if (wotw.drawer.activeFrame >= projectGardener.frame) {
                    labelIcon.style.filter = 'drop-shadow(rgb(0, 195, 255) 0px 0px 2px) brightness(100%)';
                } else {
                    labelIcon.style.filter = 'brightness(50%)';
                }

                contGardenerProjects.appendChild(labelIcon);
            }
            cont.appendChild(contBuilderProjects);
        }
    }

    updatePickups() {
        this.pickups = activeRoute.getAllBranchPickups();
        this.reset();

        for (var i = 0; i < this.pickups.length; i++) {
            switch (this.pickups[i].data.category) {
                case 'pickup':
                    this.updatePickup(this.pickups[i]);
                    break;

                case 'mapIcon':
                    this.updateMapIcon(this.pickups[i]);
                    break;

                case 'ability':
                    this.abilities.push(i);
                    this.updateAbilities(this.pickups[i]);
                    break;

                case 'shard':
                    this.shards.push(i);
                    this.updateShards(this.pickups[i]);
                    break;

                case 'projectBuilder':
                    this.projectBuilders.push(i);
                    this.updateBuilderProjects(this.pickups[i]);
                    break;

                case 'projectGardener':
                    this.projectGardeners.push(i);
                    break;

                case 'sideQuest':
                    this.sideQuests.push(i);
                    this.updateSideQuest(this.pickups[i]);

                case 'mainQuest':
                    this.mainQuests.push(i);
                    this.updateMainQuest(this.pickups[i]);
            }
        }

        this.createHTML();
    }

    updateAbilities(item) {
        if (item.data.cost) {
            var cost = parseFloat(item.data.cost[activeRoute.difficulty]);
            if (wotw.drawer.activeFrame >= item.frame) {
                if (this.firstOpherBuy) {
                    cost = cost / 2;
                    this.firstOpherBuy = false;
                }
                this.spiritLight -= cost;
            }
            this.spiritLightSpent += cost;
        }
    }

    updateShards(item) {
        if (item.data.cost && this.shardUpgrades[item.data.name] === undefined) {
            var cost = parseFloat(item.data.cost[activeRoute.difficulty]);
            if (wotw.drawer.activeFrame >= item.frame) {
                this.spiritLight -= cost;
            }
            this.spiritLightSpent += cost;
            this.shardUpgrades[item.data.name] = 0;
        } else if (item.data.upgrades) {
            var rank = this.shardUpgrades[item.data.name] !== undefined ? this.shardUpgrades[item.data.name] : 0,
                cost = parseFloat(item.data.upgrades[rank].cost[activeRoute.difficulty]);

            if (this.shardUpgrades[item.data.name] !== undefined) {
                if (wotw.drawer.activeFrame >= item.frame) {
                    this.spiritLight -= cost;
                    this.shardUpgrades[item.data.name] += 1;
                }
                this.spiritLightSpent += cost;
            } else {
                this.shardUpgrades[item.data.name] = 0;
            }
        }
    }

    updateBuilderProjects(item) {
        if (wotw.drawer.activeFrame >= item.frame) {
            //this.gorlekOre -= item.data.cost;
            this.usedGorlekOre += item.data.cost;
            this.gorlekOre = this.totalPickedGorlekOre - this.usedGorlekOre;
        }
    }

    updateSideQuest(item) {
        if (item.data.type) {
            switch (item.data.type) {
                case 'lightSpirit':
                    this.totalSpiritLight += item.data.reward;
                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                        this.spiritLight -= this.spiritLightSpent;
                    }
                    break;

                case 'gorlekOre':
                    this.totalGorlekOre++;
                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.gorlekOre = this.totalPickedGorlekOre = this.totalGorlekOre;
                        this.gorlekOre = this.totalPickedGorlekOre - this.usedGorlekOre;
                    }
                    break;

                case 'keystone':
                    this.totalKeystones += item.data.reward;

                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.keystones = this.totalPickedKeystones = this.totalKeystones;
                        this.keystones = this.totalPickedKeystones - this.usedKeyStones;
                    }
                    break;
            }
        }
    }

    updateMainQuest(item) {
        if (item.data.type) {
            switch (item.data.type) {
                case 'lightSpirit':
                    this.totalSpiritLight += item.data.reward;
                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                        this.spiritLight -= this.spiritLightSpent;
                    }
                    break;
            }
        }
    }

    updateMapIcon(item) {
        if (item.data && item.data.type) {
            switch (item.data.type) {

                case 'wisp':
                    this.totalEnergy += 1;
                    this.totalHealth += 1;

                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.health = Math.floor(this.totalHealth);
                        this.energy = Math.floor(this.totalEnergy);
                    }
                    break;

                case 'reward':
                    this.totalSpiritLight += item.data.amount;

                    if (wotw.drawer.activeFrame >= item.frame) {
                        this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                        this.spiritLight -= this.spiritLightSpent;
                    }
                    break;

            }
        }

        switch (item.data.name) {
            case 'Keystone':
                this.totalKeystones++;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.keystones = this.totalPickedKeystones = this.totalKeystones;
                    this.keystones = this.totalPickedKeystones - this.usedKeyStones;
                }
                break;

            case 'Life Cell Fragment':
                this.totalHealth += 0.5;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.totalPickedHealth += 0.5;
                    this.health = Math.floor(this.totalHealth);
                }
                break;

            case 'Energy Cell Fragment':
                this.totalEnergy += 0.5;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.totalPickedEnergy += 0.5;
                    this.energy = Math.floor(this.totalEnergy);
                }
                break;

            case 'Spirit Gate 2':
                if (wotw.drawer.activeFrame >= item.frame) {
                    this.usedKeyStones += 2;
                    this.keystones = this.totalPickedKeystones - this.usedKeyStones;
                }
                break;

            case 'Spirit Gate 4':
                if (wotw.drawer.activeFrame >= item.frame) {
                    this.usedKeyStones += 4;
                    this.keystones = this.totalPickedKeystones - this.usedKeyStones;
                }
                break;

            case 'Gorlek Ore':
                this.totalGorlekOre++;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.gorlekOre = this.totalPickedGorlekOre = this.totalGorlekOre;
                    this.gorlekOre = this.totalPickedGorlekOre - this.usedGorlekOre;
                }
                break;
        }
    }

    updatePickup(item) {
        switch (item.data.name) {
            case 'Half Life Cell':
                this.totalHealth += 0.5;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.totalPickedHealth += 0.5;
                    this.health = Math.floor(this.totalHealth);
                }
                break;

            case 'Half Energy Container':
                this.totalEnergy += 0.5;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.totalPickedEnergy += 0.5;
                    this.energy = Math.floor(this.totalEnergy);
                }
                break;

            case 'Small Spirit Light (50)':
                this.totalSpiritLight += 50;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                    this.spiritLight -= this.spiritLightSpent;
                }
                break;

            case 'Large Spirit Light (100)':
                this.totalSpiritLight += 100;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                    this.spiritLight -= this.spiritLightSpent;
                }
                break;

            case 'Greater Spirit Light (200)':
                this.totalSpiritLight += 200;

                if (wotw.drawer.activeFrame >= item.frame) {
                    this.spiritLight = this.totalPickedSpiritLight = this.totalSpiritLight;
                    this.spiritLight -= this.spiritLightSpent;
                }
                break;
        }
    }
}

class Drawer {
    constructor() {
        this.activeFrame = 0;
    }

    clearMap() {
        var mapPopups = document.querySelectorAll('div.popup'),
            mapNodes = document.querySelectorAll('button.map-elements-map-node');

        for (var i = 0; i < wotw.allBranches.length; i++) {
            for (var i2 = 0; i2 < wotw.allBranches[i].paths.length; i2++) {
                wotw.allBranches[i].paths[i2].removeAnchors();
                wotw.allBranches[i].paths[i2].removeMapNodes();
            }
        }

        if (document.getElementById('strat-vis-toggle') && document.getElementById('strat-vis-toggle').dataset.toggle === 'false') {
            for (var i = 0; i < mapPopups.length; i++) {
                mapPopups[i].style.display = 'none';//isEditingMode === true ? 'flex' : 'none';
            }
        }

        for (var i = 0; i < mapNodes.length; i++) {
            mapNodes[i].remove();
        }

        if (isEditingMode === false) {
            var mapIcons = document.querySelectorAll('span.map-icon');
            for (var i = 0; i < mapIcons.length; i++) {
                mapIcons[i].style.display = 'none';
            }
        } else {
            var mapIcons = document.querySelectorAll('span.map-icon[new]');
            for (var i = 0; i < mapIcons.length; i++) {
                mapIcons[i].style.display = 'flex';
            }
        }
        ctxPaint.clearRect(0, 0, cvsPaint.width, cvsPaint.height);
    }

    makeElementsEditable() {
        var popups = document.body.querySelectorAll('div.popup-container'),
            branches = document.body.querySelectorAll('div.branch-part-path'),
            currentRouteElements = document.getElementById('current-route-container').querySelectorAll('div.current-route-info-wrapper');

        if (isEditingMode) {
            for (var i = 0; i < popups.length; i++) {
                var children = popups[i].querySelectorAll('*.popup-editable, *.popup-onlyedit, *.popup-noedit');
                for (var ic = 0; ic < children.length; ic++) {
                    if (children[ic].classList.contains('popup-onlyedit') || children[ic].classList.contains('popup-noedit')) {
                        children[ic].setAttribute('showedit', '');
                    } else {
                        children[ic].setAttribute('contenteditable', '');
                    }
                }
            }
            for (var i = 0; i < branches.length; i++) {
                var children = branches[i].querySelectorAll('*.branch-path-child, *.branch-part-onlyedit, *.branch-part-noedit');
                for (var ic = 0; ic < children.length; ic++) {
                    if (children[ic].classList.contains('branch-part-onlyedit') || children[ic].classList.contains('branch-part-noedit')) {
                        children[ic].setAttribute('showedit', '');
                    } else {
                        children[ic].setAttribute('contenteditable', '');
                    }
                }
            }
            for (var i = 0; i < currentRouteElements.length; i++) {
                currentRouteElements[i].setAttribute('showedit', true);
            }
        } else {
            for (var i = 0; i < popups.length; i++) {
                var children = popups[i].querySelectorAll('*.popup-editable, *.popup-onlyedit, *.popup-noedit');
                for (var ic = 0; ic < children.length; ic++) {
                    if (children[ic].classList.contains('popup-onlyedit') || children[ic].classList.contains('popup-noedit')) {
                        children[ic].removeAttribute('showedit');
                    } else {
                        children[ic].removeAttribute('contenteditable');
                    }
                }
            }
            for (var i = 0; i < branches.length; i++) {
                var children = branches[i].querySelectorAll('*.branch-path-child, *.branch-part-onlyedit, *.branch-part-noedit');
                for (var ic = 0; ic < children.length; ic++) {
                    if (children[ic].classList.contains('branch-part-onlyedit') || children[ic].classList.contains('branch-part-noedit')) {
                        children[ic].removeAttribute('showedit');
                    } else {
                        children[ic].removeAttribute('contenteditable');
                    }
                }
            }
            for (var i = 0; i < currentRouteElements.length; i++) {
                currentRouteElements[i].removeAttribute('showedit');
            }
        }
    }

    getToDrawBranches(frame, framesToDraw) {
        var allBranches = wotw.allBranches,
            activeBranchFound = true;

        if (activeRoute) {
            allBranches = activeRoute.getBranches();

            if (activeBranch) {
                activeBranchFound = false;
                for (var i = 0; i < allBranches.length; i++) {
                    if (allBranches[i] === activeBranch) {
                        activeBranchFound = true;
                    }
                }
            }
        }

        if (activeBranchFound) {
            allBranches = this.getFramePositions(allBranches, frame, framesToDraw);
        } else {
            allBranches = [{ branch: activeBranch, s: 0, e: activeBranch.paths[0].length }];
        }

        return allBranches;
    }

    drawFrames(frame, framesToDraw = 30) {
        var allBranches = this.getToDrawBranches(frame, framesToDraw);
        this.clearMap();
        openRouteDetails();

        if (wotw.inventory) {
            wotw.inventory.updatePickups();
        }

        if (allBranches.length > 0) {
            activeBranch = allBranches[0].branch;
            for (var i = 0; i < allBranches.length; i++) {
                var tBranch = allBranches[i];
                if ((isOnlyActiveBranch && activeBranch === tBranch.branch) || isOnlyActiveBranch === false) {
                    tBranch.branch.drawPathSE(tBranch.s, tBranch.e);
                }
            }

            if (isEditingMode) {
                this.makeElementsEditable();
            }
            return true;
        } else {
            activeBranch = null;
            document.getElementById('branch-paths').innerHTML = '';
            return false;
        }
    }

    //bug if there are more frames to extract and no more pos it will start from 0 from current path
    getFramePositions(paths, index, totalFrames = 30) {
        var curIndex = 0,
            extractedFrames = 0,
            curPaths = paths,
            curPathIndex = 0,
            returnPaths = [];

        while (curPaths.length > curPathIndex && extractedFrames < totalFrames) {
            if ((curIndex + curPaths[curPathIndex].paths[0].nodes.length - 1) < index) {
                curIndex += curPaths[curPathIndex].paths[0].nodes.length;
                //curPaths.splice(0, 1);
                curPathIndex++;
            } else {
                if ((curIndex + curPaths[curPathIndex].paths[0].nodes.length) > index) {
                    var spliceIndex = Math.max((extractedFrames > 0 ? 0 : index - curIndex), 0),
                        endIndex = Math.min((totalFrames - extractedFrames) + spliceIndex, curPaths[curPathIndex].paths[0].nodes.length),
                        //temp = curPaths[0].path.splice(spliceIndex, endIndex);
                        temp = { branch: curPaths[curPathIndex], s: spliceIndex, e: endIndex };

                    returnPaths.push(temp);
                    extractedFrames += endIndex - spliceIndex;
                    curIndex += endIndex;
                    //curPaths.splice(0, 1);
                    curPathIndex++;
                } else {
                    extractedFrames += curPaths[curPathIndex].paths[0].nodes.length;
                    curIndex += curPaths[curPathIndex].paths[0].nodes.length;
                    returnPaths.push({ branch: curPaths[curPathIndex], s: 0, e: curPaths[curPathIndex].paths[0].nodes.length });
                    //curPaths.splice(0, 1);
                    curPathIndex++;
                }
            }
        }
        return returnPaths
    }
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
                //wotw.loadStandardData();
                this.parentElement.addEventListener('mousemove', function (e) { mouseEvents(e); });
                break;
        }
    }
}

class Timeline {
    constructor() {
        this.frameDragging = false;
        if (document.querySelector('div.frame-container')) {
            document.querySelector('div.frame-container').addEventListener('mousemove', this, false);
        }
        if (document.getElementById('framecontainer')) {
            document.getElementById('framecontainer').addEventListener('click', this, false);
            document.getElementById('framecontainer').addEventListener('contextmenu', this, false);
            document.getElementById('framemover').addEventListener('mousedown', this, false);
            document.getElementById('framemover').addEventListener('mouseup', this, false);
        }
        document.documentElement.addEventListener('mouseup', this, false);
    }

    handleEvent(event) {
        switch (event.type) {
            case 'contextmenu':
                event.preventDefault();
                event.stopPropagation();
            case 'mousemove':
                this.setFrameMoverPos(event);
                break;

            case 'click':
                this.updateFrameLabels(document.getElementById('framecontainer'));
                break;

            case 'mousedown':
                this.frameDragging = true;
                break;

            case 'mouseup':
                this.frameDragging = false;
                break;
        }
    }
    getTotalBranchFrames() {
        var index = 0,
            branches = activeRoute.getBranches();

        for (var i = 0; i < branches.length; i++) {
            index += branches[i].paths[0].nodes.length;
        }
        return index + 100;
    }

    updateFrameLabels(el) {
        if (el) {
            var children = el.querySelectorAll('label.frame-labels'),
                totalFrames = this.getTotalBranchFrames(),
                framesPerLabel = Math.floor(totalFrames / 10);

            el.style.minWidth = totalFrames * 3 + 'px';
            for (var i = 0; i < children.length; i++) {
                const child = children[i];
                if (i === 0) {
                    child.style.left = '0%';
                    child.textContent = '1';
                } else {
                    child.style.left = Math.max(i * 10, 1) + '%';
                    child.textContent = Math.min(i * framesPerLabel, totalFrames);
                }
            }
        }
    }

    setFrameMoverFrame(frame) {
        var el = document.getElementById('framemover'),
            container = document.getElementById('framecontainer'),
            mapCont = document.getElementById('map-container');

        el.style.left = Math.min(frame * 3, parseFloat(container.style.minWidth)) + 'px';
        el.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
        mapCont.scrollTop = 0;
        mapCont.scrollLeft = 0;
    }

    setFrameMoverPos(event) {
        if (this.frameDragging || event.type === 'contextmenu') {
            var el = document.getElementById('framemover'),
                container = document.getElementById('framecontainer'),
                sizePerc = container.getBoundingClientRect(),
                pos = (event.pageX - sizePerc.x) - window.scrollX,
                frame = Math.floor(Math.max(pos / 3, 0));
            //framePerc = Math.round(Math.min(Math.max(parseFloat((pos / sizePerc.width * 100).toPrecision(2)), 0), 100));

            el.style.left = Math.min(frame * 3, parseFloat(container.style.minWidth)) + 'px';//framePerc + '%';
            if (wotw.drawer.activeFrame !== frame) {
                wotw.drawer.activeFrame = Math.min(frame, parseFloat(container.style.minWidth) / 3);
                wotw.drawer.drawFrames(wotw.drawer.activeFrame);
            }
        }
    }
}

class Shop {
    constructor(iconFactory) {
        this.iconFactory = iconFactory;
        this.createShops();
    }

    createShops() {
        this.createShop('Opher', 'Weapon Master');
        this.createShop('Twillen', 'Trader');
        this.createShop('Grom', 'Builder');
        this.createShop('Tuley', 'Gardener');
    }

    /*
    iconName is the name of the icon itself
    iconDataName is the object key name

    creates a shop per icon on the map currently, this needs to be fixed to avoid
    flooding the DOM with too many elements
    */
    createShop(iconName = 'Opher', iconDataName = 'Weapon Master') {
        var opherData = iconDataNew.mapIcon[iconDataName],
            shops = document.querySelectorAll('span[data-category="mapIcon"][data-icon="' + iconName + '"]');

        for (var iO = 0; iO < shops.length; iO++) {
            var shop = shops[iO],
                shopCont = document.createElement('div');

            shopCont.className = 'map-elements-shop';
            shopCont.style.left = shop.style.left;
            shopCont.style.top = shop.style.top;
            shopCont.dataset.shopId = shop.id;
            shopCont.id = Math.floor(Math.random() * 100000000);
            shopCont.setAttribute('tabindex', -1);
            shopCont.addEventListener('mouseleave', function () {
                this.dataset.active = false;
            });
            shopCont.addEventListener('blur', function () {
                this.dataset.active = false;
            });
            shop.dataset.shopId = shopCont.id;
            shop.addEventListener('mouseenter', function () {
                document.getElementById(this.dataset.shopId).dataset.active = true;
                document.getElementById(this.dataset.shopId).focus();
            });

            for (var i = 0; i < opherData.data.tabs.length; i++) {
                var tabs = opherData.data.tabs[i],
                    shopTab = document.createElement('div'),
                    shopTabName = document.createElement('label');

                shopTab.className = 'map-elements-shop-tab';
                shopTabName.className = 'map-elements-shop-name';
                shopTabName.textContent = tabs.name;

                for (var i2 = 0; i2 < tabs.items.length; i2++) {
                    var newIcon = this.iconFactory.createIcon({ x: 0, y: 0 }),
                        tempIconData = iconDataNew[tabs.type][tabs.items[i2]],
                        tempIcon = { mapId: iconName.toLowerCase() + iO + i + i2, x: newIcon.style.left, y: newIcon.style.top, standard: true, iconName: tabs.items[i2], name: tempIconData.name, category: tempIconData.category, shopIcon: true };

                    newIcon.dataset.iconId = iconJSON.length;
                    newIcon.id = iconName.toLowerCase() + iO + i + i2;
                    iconJSON.push(tempIcon);
                    newIcon.removeAttribute('new');
                    newIcon.dataset.name = tempIconData.name;
                    newIcon.dataset.category = tempIconData.category;
                    newIcon.dataset.iconName = tabs.items[i2];

                    this.iconFactory.setIconFromSheet(newIcon);
                    newIcon.style.position = 'relative';
                    newIcon.style.transform = 'none';

                    shopTab.appendChild(newIcon);
                }
                shopCont.appendChild(shopTabName);
                shopCont.appendChild(shopTab);
            }
            document.getElementById('orimap-container').appendChild(shopCont);
        }
    }
}

class IconFactory {
    constructor(map, columnSpan = 29, rowSpan = 13) {
        this.columnSpan = columnSpan;
        this.rowSpan = rowSpan;
        this.sheetWidth = 1856;
        this.sheetHeigth = 823;
        this.iconData = iconDataNew;
        this.categoriesIndex = {};
        this.mapClass = map;

        this.indexCategories();
    }

    indexCategories() {
        var index = 0,
            collection = Object.entries(this.iconData);

        for (var i = 0; i < collection.length; i++) {
            this.categoriesIndex[collection[i][0]] = index;
            index += Object.keys(collection[i][1]).length;
        }
    }

    createIcon(event) {
        var pos = { x: 0, y: 0 },
            icon = document.createElement('span'),
            mapContainerRect = this.mapClass.mapContainer.getBoundingClientRect();

        if (event.clientX && event.clientY) {
            pos.x = (event.clientX - mapContainerRect.left) / this.mapClass.currentZoom;
            pos.y = (event.clientY - mapContainerRect.top) / this.mapClass.currentZoom;
        } else {
            pos.x = parseFloat(event.x);
            pos.y = parseFloat(event.y);
        }

        icon.style.left = pos.x + 'px';
        icon.style.top = pos.y + 'px';
        icon.style.display = 'none';
        icon.dataset.pos = pos.x + ' ' + pos.y;
        icon.id = Math.floor((Math.random() * 100000000) + 1);
        icon.className = 'map-icon map-icon-onmap';
        icon.setAttribute('new', true);
        icon.addEventListener('mousedown', function () { iconBeingDragged = this; activeIconPicker = this; });

        this.mapClass.mapContainer.appendChild(icon);

        return icon;
    }

    setIconFromSheet(icon) {
        if (this.iconData[icon.dataset.category]) {
            var index = 0;

            if (icon.classList.contains('icon-picker') && activeIconPicker) {
                index = this.categoriesIndex[icon.dataset.category] + Object.keys(this.iconData[icon.dataset.category]).indexOf(icon.dataset.iconName);

                var tempIconData = this.iconData[icon.dataset.category][icon.dataset.iconName],
                    row = Math.floor(index / this.columnSpan),
                    column = index - (row * this.columnSpan);

                activeIconPicker.style.background = "url('iconsheet3.webp') no-repeat";
                activeIconPicker.style.backgroundPosition = ((100 / (this.columnSpan - 1)) * column) + 0.020 + '% ' + ((100 / (this.rowSpan - 1)) * row) + '%';
                activeIconPicker.style.backgroundSize = '2900% 1300%';

                if (activeIconPicker.classList.contains('map-icon')) {
                    activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    activeIconPicker.dataset.name = tempIconData.name;
                    activeIconPicker.dataset.category = tempIconData.category;
                    activeIconPicker.removeAttribute('new');

                    iconJSON[activeIconPicker.dataset.iconId].category = tempIconData.category;
                    iconJSON[activeIconPicker.dataset.iconId].iconName = icon.dataset.iconName;
                    iconJSON[activeIconPicker.dataset.iconId].icon = tempIconData.name;
                    iconJSON[activeIconPicker.dataset.iconId].hasChanged = true;
                } else if (activeIconPicker.classList.contains('map-comment-icon')) {
                    activeIconPicker.style.backgroundColor = '#000';
                    activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    activeIconPicker.dataset.category = tempIconData.category;
                    popupJSON[activeIconPicker.parentNode.dataset.popupId].icon = { iconName: icon.dataset.iconName, category: tempIconData.category };
                    popupJSON[activeIconPicker.parentNode.dataset.popupId].hasChanged = true;
                }
                return true;
            } else if (icon.dataset.category && icon.dataset.iconName) {
                index = this.categoriesIndex[icon.dataset.category] + Object.keys(this.iconData[icon.dataset.category]).indexOf(icon.dataset.iconName);

                var tempIconData = this.iconData[icon.dataset.category][icon.dataset.iconName],
                    row = Math.floor(index / this.columnSpan),
                    column = index - (row * this.columnSpan);

                icon.style.background = "url('iconsheet3.webp') no-repeat";
                icon.style.backgroundPosition = ((100 / (this.columnSpan - 1)) * column) + 0.020 + '% ' + ((100 / (this.rowSpan - 1)) * row) + '%';
                icon.style.backgroundSize = '2900% 1300%';

                if (icon.classList.contains('map-icon')) {
                    icon.dataset.iconName = icon.dataset.iconName;
                    icon.dataset.name = tempIconData.name;
                    icon.dataset.category = tempIconData.category;
                    icon.removeAttribute('new');
                } else if (icon.classList.contains('map-comment-icon')) {
                    icon.style.backgroundColor = '#000';
                    icon.dataset.iconName = icon.dataset.iconName;
                    icon.dataset.category = tempIconData.category;
                }
                return true;
            }
        } else {
            return false;
        }
    }

    toggleIconsOnMap(category, name = false) {
        if (isEditingMode === false || isEditingMode && activeIconPicker === undefined || name && name.nodeType) {
            var query = 'span[data-category=' + category + ']',
                categoryBool;

            if (name && name.nodeType === undefined) {
                query += '[data-icon-name="' + name + '"]';
            } else {
                categoryBool = name.getAttribute('show') === 'true' ? false : true;
                name.setAttribute('show', categoryBool);
            }
            var mapIcons = this.mapClass.mapContainer.querySelectorAll(query);

            for (var i = 0; i < mapIcons.length; i++) {
                if (name && name.nodeType) {
                    mapIcons[i].style.display = (categoryBool === true ? 'flex' : 'none');
                } else {
                    if (mapIcons[i].style.display === 'flex') {
                        mapIcons[i].style.display = 'none';
                    } else {
                        mapIcons[i].style.display = 'flex';
                    }
                }
            }
        }
    }
}

class Panel {

    constructor() {
        this.panel;
        this.panels = {};
    }

    newPanel() {
        var panel = document.createElement('div');

        panel.className = 'map-elements';

        this.panel = panel;
    }

    newDropdown(dropdownName = 'Dropdown') {
        var dropdown = document.createElement('div'),
            dropdownLabel = document.createElement('label'),
            dropdownContainer = document.createElement('div');

        dropdown.className = 'dropdown';
        dropdown.toggle = false;

        dropdownLabel.addEventListener('click', function () { toggleDropdown(this, event); });
        dropdownLabel.innerText = dropdownName;

        dropdownContainer.className = 'map-elements-container';
        dropdownContainer.style.overflow = 'hidden';
        dropdownContainer.style.maxHeight = 'unset';
        dropdownContainer.style.padding = '0px';

        dropdown.appendChild(dropdownLabel);
        dropdown.appendChild(dropdownContainer);

        this.panels[dropdownName] = dropdown;
        return dropdown;
    }
}

class WOTW {
    constructor() {
        this.drawer = new Drawer();
        this.map = new Map(document.getElementById('map-container'));
        this.iconFactory = new IconFactory(this.map);
        this.timeline = new Timeline();
        this.shop = new Shop(this.iconFactory);
        this.inventory;
        this.allBranches = [];
        this.allRoutes = [];

        this.map.mapImage.addEventListener('load', this, false);
    }

    createBranch() {
        var path = new Branch(this.allBranches.length);
        activeBranch = path;
        this.allBranches.push(path);
        activeBranch.paths.push(new Path(0, path.mapId));
        this.listMapElements('branch', this.allBranches);
        this.drawer.drawFrames(this.drawer.activeFrame);
    }

    getBranch(name) {
        for (var i = 0; i < this.allBranches.length; i++) {
            if (this.allBranches[i].pathText === name) {
                return this.allBranches[i];
            }
        }
        return false;
    }

    loadBranches() {
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

    loadRoutes() {
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
            iconJSON = iconJSON.concat(JSON.parse(tempIconJSON));
        }

        for (var i = 0; i < iconJSON.length; i++) {
            if (iconJSON[i].iconName !== null && iconJSON[i].iconName !== 'null') {
                var icon = iconJSON[i],
                    newIcon,
                    tempIconData = iconDataNew[icon.category][icon.iconName];

                newIcon = wotw.iconFactory.createIcon(icon);
                newIcon.style.display = isEditingMode ? 'flex' : 'none';
                newIcon.removeAttribute('new');
                if (icon.icon !== undefined) {
                    newIcon.dataset.icon = icon.icon;
                } else {
                    iconJSON[i].icon = tempIconData.name;
                    newIcon.dataset.icon = tempIconData.name;
                }
                newIcon.id = icon.mapId;
                newIcon.setAttribute('iconName', icon.iconName);
                newIcon.dataset.iconId = i;
                newIcon.dataset.name = tempIconData.name;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = icon.iconName;

                this.iconFactory.setIconFromSheet(newIcon);
            }
        }

        this.shop.createShops();
        populateFilterData();
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
            popupJSON = data.mapPopups;
            for (var i = 0; i < popupJSON.length; i++) {
                popupJSON[i].standard = true;
            }
        }
        if (data.mapRoutes) {
            this.allRoutes = data.mapRoutes;
            for (var i = 0; i < this.allRoutes.length; i++) {
                this.allRoutes[i].standard = true;
            }
        }
        if (data.mapIcons) {
            iconJSON = data.mapIcons;
            for (var i = 0; i < iconJSON.length; i++) {
                iconJSON[i].standard = true;
            }
        }
        if (data.mapBranches) {
            this.allBranches = data.mapBranches;
            for (var i = 0; i < this.allBranches.length; i++) {
                this.allBranches[i].standard = true;
            }
        }
        var urlParams = new URLSearchParams(window.location.search);

        createIconsIconPicker();
        this.loadMapElements();
        this.loadBranches();
        this.timeline.updateFrameLabels(document.getElementById('framecontainer'));
        this.inventory = new Inventory();
        this.inventory.updatePickups();
        checkParams(urlParams);
    }

    handleEvent(event) {
        switch (event.type) {
            case 'load':
                this.loadStandardData();
                break;
        }
    }
}

const mapSize = { width: 6193, height: 1713 };

var activeBranch = null,
    activeBranchIndex = null,
    activeBranchPathIndex = null,
    activeBranchPathNodeIndex = null,
    activeBranchSubPathIndex = null,
    activeIconPicker = null,
    activeRoute = null,
    drawAllFullColor = false,
    mousePosRecords = [],
    //allMousePosRecords = [],
    //allRoutes = [],
    isPainting = false,
    isPaintMode = false,
    isInGameBoxMode = false,
    isDrawingBox = false,
    isPathStarted = false,
    /*isDraggingMap = false,*/
    isPlacingIcon = false,
    isAddingBranch = false,
    isNodeMode = false,
    /*frameDragging = false,*/
    anchorDragging = false,
    anchorBeingDragged = undefined,
    iconBeingDragged = undefined,
    isSubPathMode = false,
    isEditingMode = false,
    isCommentMode = false,
    /*activeFrame = 0,*/
    isOnlyActiveBranch = false,
    commentBeingDragged = undefined,
    mapLinkerElement = undefined,
    /*currentMapPosition = [-1393.4, -227.027],
    currentMapZoom = 1.0,*/
    popupJSON,
    activeMapBorderNode = false,
    /*allMaps,*/
    iconJSON = [],
    /*inventory = undefined,*/
    startPosBox = { x: 0, y: 0 },
    sizePosBox = { x: 0, y: 0 },
    /*drawer = new Drawer(),
    map = new Map(),
    timeline = new Timeline(),
    shop = new Shop(),*/
    wotw = new WOTW();

/*var img = new Image(mapSize.width, mapSize.height),
    ctxMap = document.getElementById('orimap').getContext('2d');

ctxMap.webkitImageSmoothingEnabled = false;
ctxMap.msImageSmoothingEnabled = false;
ctxMap.imageSmoothingEnabled = false;*/

var cvsOff = document.createElement('canvas');

cvsOff.height = mapSize.height;
cvsOff.width = mapSize.width;

var ctxOff = cvsOff.getContext('2d');

ctxOff.webkitImageSmoothingEnabled = false;
ctxOff.msImageSmoothingEnabled = false;
ctxOff.imageSmoothingEnabled = false;

var cvsPaint = document.createElement('canvas');

cvsPaint.height = mapSize.height;
cvsPaint.width = mapSize.width;
cvsPaint.style.position = "absolute";
cvsPaint.style.left = 0;
cvsPaint.style.top = 0;

cvsPaint.addEventListener('mousedown', function (event) {
    if (isPaintMode || isSubPathMode) {
        activeBranchPathNodeIndex = null;
        activeBranchSubPathIndex = null;
        isPainting = true;
    }
    if (isCommentMode) {
        createComment(event);
    }
    if (isPlacingIcon) {
        var newIcon = wotw.iconFactory.createIcon(event),
            tempIcon = { mapId: newIcon.id, x: newIcon.style.left, y: newIcon.style.top, standard: false };

        newIcon.style.display = isEditingMode ? 'flex' : 'none';
        newIcon.dataset.iconId = iconJSON.length;
        iconJSON.push(tempIcon);
    }
});

cvsPaint.addEventListener('mouseup', function () {
    isPainting = false;
    isPathStarted = false,
        newBranch = undefined,
        newPos = [];

    if (activeBranch === null) {
        newBranch = new Branch(wotw.allBranches.length);
    } else {
        newBranch = activeBranch;
    }

    if (mousePosRecords.length > 0) {
        while (mousePosRecords.length > 1) {
            var p1 = mousePosRecords[0],
                p2 = mousePosRecords[1],
                dist = distance(p1, p2),
                angle = false;

            if (mousePosRecords.length > 2) {
                angle = angle2(mousePosRecords[0], mousePosRecords[1], mousePosRecords[2]);
            } else {
                angle = false;
            }
            if (dist > 100 || angle > 25 && dist > 30) {
                newPos.push(p1);
                mousePosRecords.splice(0, 1);
            } else {
                if (mousePosRecords.length > 2) {
                    mousePosRecords.splice(1, 1);
                } else {
                    mousePosRecords.splice(0, 2);
                    newPos.push(p2);
                }
            }
        }

        if (activeBranchPathIndex !== null && (isSubPathMode === true && activeBranchPathIndex === 0 ? false : true)) {
            newBranch.paths[activeBranchPathIndex].newPath(newPos, (activeBranchPathNodeIndex !== null ? parseInt(activeBranchPathNodeIndex) + 1 : null));
        } else if (activeBranch && isPaintMode) {
            activeBranch.paths[0].newPath(newPos, (activeBranchPathNodeIndex !== null ? parseInt(activeBranchPathNodeIndex) + 1 : null));
        } else {
            var newPath = new Path(newBranch.paths.length, newBranch.mapId);
            newPath.newPath(newPos);
            newBranch.paths.push(newPath);
        }

        //newBranch.newPath(newPos, (activeBranchPathNodeIndex !== null ? parseInt(activeBranchPathNodeIndex) + 1 : null), (activeBranchSubPathIndex !== null ? parseInt(activeBranchSubPathIndex) : null));
        if (activeBranch === null) {
            wotw.allBranches.push(newBranch);
        }
        wotw.listMapElements('branch', wotw.allBranches);
        activeBranch = newBranch;
        mousePosRecords = [];
        wotw.drawer.drawFrames(wotw.drawer.activeFrame);
    }
    wotw.timeline.updateFrameLabels(document.getElementById('framecontainer'));
});

cvsPaint.addEventListener('mousemove', function (event) {
    if (isPainting) {
        var oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();
        const mPos = { x: (event.clientX - oriMapCont.left) / wotw.map.currentZoom, y: (event.clientY - oriMapCont.top) / wotw.map.currentZoom };

        mousePosRecords.push(mPos);
        if (isPathStarted === false) {
            ctxPaint.beginPath();
            ctxPaint.strokeStyle = 'red';
            ctxPaint.moveTo(mPos.x, mPos.y);
            isPathStarted = true;
        } else {
            ctxPaint.lineTo(mPos.x, mPos.y);
            ctxPaint.stroke();
        }
    }
});

var ctxPaint = cvsPaint.getContext('2d');
ctxPaint.webkitImageSmoothingEnabled = false;
ctxPaint.msImageSmoothingEnabled = false;
ctxPaint.imageSmoothingEnabled = false;
document.getElementById('orimap-container').appendChild(cvsPaint);

/*img.crossOrigin = "Anonymous";
img.src = 'oriwotwmap.0.1.6.webp';
img.addEventListener('load', function () {
    ctxMap.drawImage(img, 0, 0);
    ctxMap.drawImage(img, 0, 0);
    wotw.loadStandardData();
    document.getElementById('map-container').addEventListener('mousemove', function () { mouseEvents(event); });
}, false);*/

/*function createNewBranch() {
    var path = new Branch(wotw.allBranches.length);
    activeBranch = path;
    wotw.allBranches.push(path);
    activeBranch.paths.push(new Path(0, path.mapId));
    wotw.listMapElements('branch', wotw.allBranches);
    wotw.drawer.drawFrames(wotw.drawer.activeFrame);
}*/

function createIconsIconPicker() {
    var keysCategories = Object.keys(iconDataNew);

    if (document.querySelector('div.map-element-ori-icons')) {
        for (var i = 0; i < keysCategories.length; i++) {
            var keysIcons = Object.keys(iconDataNew[keysCategories[i]]),
                label = document.createElement('label'),
                div = document.createElement('div');

            label.className = 'map-hover-info ori-click ori-glow';
            label.dataset.popup = 'Toggle visibility';
            label.dataset.category = keysCategories[i];
            label.setAttribute('show', false);
            label.addEventListener('click', function () { wotw.iconFactory.toggleIconsOnMap(this.dataset.category, this); });
            label.textContent = iconDataNewNames[keysCategories[i]];

            div.dataset.category = keysCategories[i];
            div.addEventListener('click', function () { wotw.iconFactory.toggleIconsOnMap(this.dataset.category, event.target.dataset.iconName); });
            div.addEventListener('contextmenu', function () { event.preventDefault(); event.stopPropagation(); wotw.iconFactory.toggleIconsOnMap(this.dataset.category, event.target.dataset.iconName); var x = document.querySelectorAll('span[data-name="' + event.target.dataset.name + '"]')[0].dataset.pos.split(' '); wotw.map.setMap({ x: x[0] * -1, y: x[1] * -1 }); });

            for (var i2 = 0; i2 < keysIcons.length; i2++) {
                var button = document.createElement('button');
                //console.log(iconDataNew[keysCategories[i]][keysIcons[i2]]);

                button.className = 'icon-picker';// icon-picker-info';
                button.dataset.iconName = keysIcons[i2];
                button.dataset.name = iconDataNew[keysCategories[i]][keysIcons[i2]].name;
                button.dataset.category = keysCategories[i];

                wotw.iconFactory.setIconFromSheet(button);

                div.appendChild(button);
            }
            document.querySelector('div.map-element-ori-icons').appendChild(label);
            document.querySelector('div.map-element-ori-icons').appendChild(div);
        }
    }
}

function showIconData(el) {
    if (el.dataset.category && el.dataset.iconName) {
        var info = '',
            iconData = iconDataNew[el.dataset.category][el.dataset.iconName],
            category = el.dataset.category;

        if (iconData) {
            switch (category) {
                case 'projectGardener':
                    if (iconData.description) {
                        info += iconData.description + '\r\n';
                    }
                    if (iconData.cost) {
                        info += '\r\nCost: ' + iconData.cost;
                    }
                    if (iconData.effect) {
                        info += '\r\nEffect: ' + iconData.effect;
                    }
                    break;

                case 'shard':
                    if (iconData.data) {
                        info += iconData.data;
                    }
                    if (iconData.upgrades) {
                        switch (activeRoute.difficulty) {
                            case 'easy':
                                info += '\r\nCost: ' + iconData.upgrades[0].cost.easy
                                break;

                            case 'normal':
                                info += '\r\nCost: ' + iconData.upgrades[0].cost.normal;
                                break;

                            case 'hard':
                                info += '\r\nCost: ' + iconData.upgrades[0].cost.hard;
                                break;
                        }
                    }
                    break;

                case 'ability':
                    if (iconData.data) {
                        info += iconData.data;
                    }
                    if (iconData.cost) {
                        switch (activeRoute.difficulty) {
                            case 'easy':
                                info += '\r\nCost: ' + iconData.cost.easy
                                break;

                            case 'normal':
                                info += '\r\nCost: ' + iconData.cost.normal;
                                break;

                            case 'hard':
                                info += '\r\nCost: ' + iconData.cost.hard;
                                break;
                        }
                    }
                    break;
            }
        }
        if (info !== '') {
            document.getElementById('map-elements-ori-icons-data').innerText = info;
            document.getElementById('map-elements-ori-icons-data').style.padding = '5px';
        } else {
            document.getElementById('map-elements-ori-icons-data').innerText = '';
            document.getElementById('map-elements-ori-icons-data').style.padding = '0px';
        }
    } else {
        document.getElementById('map-elements-ori-icons-data').innerText = '';
        document.getElementById('map-elements-ori-icons-data').style.padding = '0px';
    }
}

function clearMouseVars() {
    wotw.timeline.frameDragging = false;
    anchorBeingDragged = undefined;
    anchorDragging = false;
    activeBranchIndex = null;
    commentBeingDragged = undefined;
    wotw.map.isDraggingMap = false;
    iconBeingDragged = undefined;
    if (activeMapBorderNode !== false) {
        activeMapBorderNode = false;
        wotw.map.showMapLocationNodes();
    }
    activeMapBorderNode = false;
}

function toggleBoolean(event, bool) {
    event.preventDefault();
    event.stopPropagation();
    if (event.target.classList.contains('map-controls-button') && event.target.hasAttribute('active')) {
        event.target.setAttribute('active', event.target.getAttribute('active') === 'true' ? false : true);
    } else if (event.target.parentNode.hasAttribute('active')) {
        event.target.parentNode.setAttribute('active', event.target.parentNode.getAttribute('active') === 'true' ? false : true);
    }

    switch (bool) {
        case 'isPaintMode':
            isPaintMode = !isPaintMode;
            break;

        case 'isSubPathMode':
            if (activeBranch) { isSubPathMode = !isSubPathMode; }
            break;

        case 'isNodeMode':
            isNodeMode = !isNodeMode;
            break;

        case 'isCommentMode':
            isCommentMode = !isCommentMode;
            break;

        case 'isPlacingIcon':
            isPlacingIcon = !isPlacingIcon;
            break;

        case 'isEditingMode':
            isEditingMode = !isEditingMode;
            wotw.drawer.makeElementsEditable();
            wotw.drawer.drawFrames(wotw.drawer.activeFrame);
            break;

        case 'isOnlyActiveBranch':
            isOnlyActiveBranch = !isOnlyActiveBranch;
            wotw.drawer.drawFrames(wotw.drawer.activeFrame);
            break;

        case 'save':
            saveAllBranches();
            saveMapElements();
            break;

        case 'isInGameBoxMode':
            isInGameBoxMode = !isInGameBoxMode;
            break;
    }
}

function createNewRoute() {
    var name = document.getElementById('new-route-name').value,
        category = document.getElementById('new-route-category').value,
        difficulty = document.getElementById('new-route-difficulty').value,
        oob = document.getElementById('new-route-oob').value,
        newRoute = new Route(name, category, difficulty, oob);

    wotw.allRoutes.push(newRoute);
}

function saveAllBranches() {
    var json = [];
    for (var i = 0; i < wotw.allBranches.length; i++) {
        if (wotw.allBranches[i].standard === false && wotw.allBranches[i].upload !== true || wotw.allBranches[i].standard === true && wotw.allBranches[i].hasChanged && wotw.allBranches[i].upload === false) {
            json.push(wotw.allBranches[i].saveBranch());
        }
    }
    if (json.length > 0) {
        window.localStorage.setItem('branches3', JSON.stringify(json));
    } else {
        window.localStorage.removeItem('branches3');
    }

    var jsonRoutes = [];
    for (var i = 0; i < wotw.allRoutes.length; i++) {
        if (wotw.allRoutes[i].standard === false && wotw.allRoutes[i].upload !== true || wotw.allRoutes[i].standard === true && wotw.allRoutes[i].hasChanged && wotw.allRoutes[i].upload === false) {
            if (wotw.allRoutes[i].hasChanged !== undefined) {
                delete wotw.allRoutes[i].hasChanged;
                delete wotw.allRoutes[i].upload;
            }
            if (wotw.allRoutes[i].id) {
                delete wotw.allRoutes[i].id;
            }
            wotw.allRoutes[i].standard = false;
            jsonRoutes.push(wotw.allRoutes[i]);
        }
    }
    if (jsonRoutes.length > 0) {
        window.localStorage.setItem('routes3', JSON.stringify(jsonRoutes));
    } else {
        window.localStorage.removeItem('routes3');
    }
}

/*function getBranch(name) {
    for (var i = 0; i < wotw.allBranches.length; i++) {
        if (wotw.allBranches[i].pathText === name) {
            return wotw.allBranches[i];
        }
    }
    return false;
}*/

function mapLinkerPicker(event) {
    if (event.target.classList.contains('map-comment-icon')) {
        mapLinkerElement.addLink(event.target.parentNode.id);
    } else if (event.target.classList.contains('map-icon')) {
        mapLinkerElement.addLink(event.target.id);
    }
}

/*function setIconFromSheet(icon) {
    const columnSpan = 29,
        rowSpan = 13,
        sheetWidht = 1856,
        sheetHeight = 832;

    var collection = Object.entries(iconDataNew),
        index = 0;

    if (icon.classList.contains('icon-picker') && activeIconPicker) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i][0] === icon.dataset.category) {
                index += Object.keys(iconDataNew[icon.dataset.category]).indexOf(icon.dataset.iconName);

                var tempIconData = iconDataNew[icon.dataset.category][icon.dataset.iconName],
                    row = Math.floor(index / columnSpan),
                    column = index - (row * columnSpan);

                activeIconPicker.style.background = "url('iconsheet2.webp') no-repeat";
                activeIconPicker.style.backgroundPosition = ((100 / (columnSpan - 1)) * column) + 0.020 + '% ' + ((100 / (rowSpan - 1)) * row) + '%';
                activeIconPicker.style.backgroundSize = '2900% 1300%';

                if (activeIconPicker.classList.contains('map-icon')) {
                    activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    activeIconPicker.dataset.name = tempIconData.name;
                    activeIconPicker.dataset.category = tempIconData.category;
                    activeIconPicker.removeAttribute('new');

                    iconJSON[activeIconPicker.dataset.iconId].category = tempIconData.category;
                    iconJSON[activeIconPicker.dataset.iconId].iconName = icon.dataset.iconName;
                    iconJSON[activeIconPicker.dataset.iconId].icon = tempIconData.name;
                    iconJSON[activeIconPicker.dataset.iconId].hasChanged = true;
                } else if (activeIconPicker.classList.contains('map-comment-icon')) {
                    activeIconPicker.style.backgroundColor = '#000';
                    activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    activeIconPicker.dataset.category = tempIconData.category;
                    popupJSON[activeIconPicker.parentNode.dataset.popupId].icon = { iconName: icon.dataset.iconName, category: tempIconData.category };
                    popupJSON[activeIconPicker.parentNode.dataset.popupId].hasChanged = true;
                }
                return true;
            } else {
                index += Object.keys(collection[i][1]).length;
            }
        }
    } else if (icon.dataset.category && icon.dataset.iconName) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i][0] === icon.dataset.category) {
                index += Object.keys(iconDataNew[icon.dataset.category]).indexOf(icon.dataset.iconName);

                var tempIconData = iconDataNew[icon.dataset.category][icon.dataset.iconName],
                    row = Math.floor(index / columnSpan),
                    column = index - (row * columnSpan);

                icon.style.background = "url('iconsheet2.webp') no-repeat";
                icon.style.backgroundPosition = ((100 / (columnSpan - 1)) * column) + 0.020 + '% ' + ((100 / (rowSpan - 1)) * row) + '%';
                icon.style.backgroundSize = '2900% 1300%';

                if (icon.classList.contains('map-icon')) {
                    icon.dataset.iconName = icon.dataset.iconName;
                    icon.dataset.name = tempIconData.name;
                    icon.dataset.category = tempIconData.category;
                    icon.removeAttribute('new');
                } else if (icon.classList.contains('map-comment-icon')) {
                    icon.style.backgroundColor = '#000';
                    icon.dataset.iconName = icon.dataset.iconName;
                    icon.dataset.category = tempIconData.category;
                }
                return true;
            } else {
                index += Object.keys(collection[i][1]).length;
            }
        }
    }
}*/

function saveMapElements() {
    var tempPopupJSON = [];

    for (var i = 0; i < popupJSON.length; i++) {
        if (popupJSON[i].standard === false && popupJSON[i].upload !== true || popupJSON[i].standard === true && popupJSON[i].hasChanged && popupJSON[i].upload === false) {
            if (popupJSON[i].hasChanged !== undefined) {
                delete popupJSON[i].hasChanged;
                delete popupJSON[i].upload;
            }
            if (popupJSON[i].id) {
                delete popupJSON[i].id;
            }
            popupJSON[i].standard = false;
            tempPopupJSON.push(popupJSON[i]);
        }
    }
    if (tempPopupJSON.length > 0) {
        window.localStorage.setItem('popupjsons3', JSON.stringify(tempPopupJSON));
    } else {
        window.localStorage.removeItem('popupjsons3');
    }

    var tempIconJSON = [];

    for (var i = 0; i < iconJSON.length; i++) {
        if (iconJSON[i].standard === false && iconJSON[i].upload !== true || iconJSON[i].standard === true && iconJSON[i].hasChanged && iconJSON[i].upload === false) {
            if (iconJSON[i].hasChanged !== undefined) {
                delete iconJSON[i].hasChanged;
                delete iconJSON[i].upload;
            }
            if (iconJSON[i].id) {
                delete iconJSON[i].id;
            }
            iconJSON[i].standard = false;
            tempIconJSON.push(iconJSON[i]);
        }
    }
    if (tempIconJSON.length > 0) {
        window.localStorage.setItem('iconjsons3', JSON.stringify(tempIconJSON));
    } else {
        window.localStorage.removeItem('iconjsons3');
    }

    //window.localStorage.setItem('mapborderjson3', JSON.stringify(allMaps));
}

/*function loadStratData(newEl, index) {
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
}*/
/*function loadMapElements() {
    tempPopupJSON = window.localStorage.getItem('popupjsons3');

    if (tempPopupJSON) {
        popupJSON = popupJSON.concat(JSON.parse(tempPopupJSON));
    }

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
            setIconFromSheet(clon.children[0].children[0]);
        }
        document.getElementById('orimap-container').appendChild(clon);
    }
    listMapElements('comment', popupJSON);

    var tempIconJSON = window.localStorage.getItem('iconjsons3');

    if (tempIconJSON) {
        iconJSON = iconJSON.concat(JSON.parse(tempIconJSON));
    }

    for (var i = 0; i < iconJSON.length; i++) {
        if (iconJSON[i].iconName !== null && iconJSON[i].iconName !== 'null') {
            var icon = iconJSON[i],
                newIcon,
                tempIconData = iconDataNew[icon.category][icon.iconName];

            newIcon = createIcon(icon);
            newIcon.removeAttribute('new');
            if (icon.icon !== undefined) {
                newIcon.dataset.icon = icon.icon;
            } else {
                iconJSON[i].icon = tempIconData.name;
                newIcon.dataset.icon = tempIconData.name;
            }
            newIcon.id = icon.mapId;
            newIcon.setAttribute('iconName', icon.iconName);
            newIcon.dataset.iconId = i;
            newIcon.dataset.name = tempIconData.name;
            newIcon.dataset.category = tempIconData.category;
            newIcon.dataset.iconName = icon.iconName;

            setIconFromSheet(newIcon);
        }
    }

    //createShopPopups();
    shop.createShops();
    populateFilterData();
}*/

/*
function createShopPopups() {
    createOpherShops();
    createTwillenShops();
    createGromShops();
    createTuleyShops();
}

function createOpherShops() {
    var opherData = iconDataNew.mapIcon['Weapon Master'],
        ophers = document.querySelectorAll('span[data-category="mapIcon"][data-icon="Opher"]');

    for (var iO = 0; iO < ophers.length; iO++) {
        var opher = ophers[iO],
            opherCont = document.createElement('div');

        opherCont.className = 'map-elements-shop';
        opherCont.style.left = opher.style.left;
        opherCont.style.top = opher.style.top;
        opherCont.dataset.shopId = opher.id;
        opherCont.id = Math.floor(Math.random() * 100000000);
        opherCont.setAttribute('tabindex', -1);
        opherCont.addEventListener('mouseleave', function () {
            this.dataset.active = false;
        });
        opherCont.addEventListener('blur', function () {
            this.dataset.active = false;
        });
        opher.dataset.shopId = opherCont.id;
        opher.addEventListener('mouseenter', function () {
            document.getElementById(this.dataset.shopId).dataset.active = true;
            document.getElementById(this.dataset.shopId).focus();
        });

        for (var i = 0; i < opherData.data.tabs.length; i++) {
            var tabs = opherData.data.tabs[i],
                opherTab = document.createElement('div'),
                opherTabName = document.createElement('label');

            opherTab.className = 'map-elements-shop-tab';
            opherTabName.className = 'map-elements-shop-name';
            opherTabName.textContent = tabs.name;

            for (var i2 = 0; i2 < tabs.items.length; i2++) {
                var newIcon = createIcon({ x: 0, y: 0 }),
                    tempIconData = iconDataNew[tabs.type][tabs.items[i2]],
                    tempIcon = { mapId: 'opher' + iO + i + i2, x: newIcon.style.left, y: newIcon.style.top, standard: true, iconName: tabs.items[i2], name: tempIconData.name, category: tempIconData.category, shopIcon: true };

                newIcon.dataset.iconId = iconJSON.length;
                newIcon.id = 'opher' + iO + i + i2;
                iconJSON.push(tempIcon);
                newIcon.removeAttribute('new');
                newIcon.dataset.name = tempIconData.name;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = tabs.items[i2];

                setIconFromSheet(newIcon);
                newIcon.style.position = 'relative';
                newIcon.style.transform = 'none';

                opherTab.appendChild(newIcon);
            }
            opherCont.appendChild(opherTabName);
            opherCont.appendChild(opherTab);
        }
        document.getElementById('orimap-container').appendChild(opherCont);
    }
}

function createTwillenShops() {
    var twillenData = iconDataNew.mapIcon['Trader'],
        twillens = document.querySelectorAll('span[data-category="mapIcon"][data-icon="Twillen"]');

    for (var iO = 0; iO < twillens.length; iO++) {
        var twillen = twillens[iO],
            twillenCont = document.createElement('div');

        twillenCont.className = 'map-elements-shop';
        twillenCont.style.left = twillen.style.left;
        twillenCont.style.top = twillen.style.top;
        twillenCont.dataset.shopId = twillen.id;
        twillenCont.id = Math.floor(Math.random() * 100000000);
        twillenCont.setAttribute('tabindex', -1);
        twillenCont.addEventListener('mouseleave', function () {
            this.dataset.active = false;
        });
        twillenCont.addEventListener('blur', function () {
            this.dataset.active = false;
        });
        twillen.dataset.shopId = twillenCont.id;
        twillen.addEventListener('mouseenter', function () {
            document.getElementById(this.dataset.shopId).dataset.active = true;
            document.getElementById(this.dataset.shopId).focus();
        });

        for (var i = 0; i < twillenData.data.tabs.length; i++) {
            var tabs = twillenData.data.tabs[i],
                twillenTab = document.createElement('div'),
                twillenTabName = document.createElement('label');

            twillenTab.className = 'map-elements-shop-tab';
            twillenTabName.className = 'map-elements-shop-name';
            twillenTabName.textContent = tabs.name;

            for (var i2 = 0; i2 < tabs.items.length; i2++) {
                var newIcon = createIcon({ x: 0, y: 0 }),
                    tempIconData = iconDataNew[tabs.type][tabs.items[i2]],
                    tempIcon = { mapId: 'twillen' + iO + i + i2, x: newIcon.style.left, y: newIcon.style.top, standard: true, iconName: tabs.items[i2], name: tempIconData.name, category: tempIconData.category, shopIcon: true };

                newIcon.dataset.iconId = iconJSON.length;
                newIcon.id = 'twillen' + iO + i + i2;
                iconJSON.push(tempIcon);
                newIcon.removeAttribute('new');
                newIcon.dataset.name = tempIconData.name;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = tabs.items[i2];

                setIconFromSheet(newIcon);
                newIcon.style.position = 'relative';
                newIcon.style.transform = 'none';

                twillenTab.appendChild(newIcon);
            }
            twillenCont.appendChild(twillenTabName);
            twillenCont.appendChild(twillenTab);
        }
        document.getElementById('orimap-container').appendChild(twillenCont);
    }
}

function createGromShops() {
    var gromData = iconDataNew.mapIcon['Builder'],
        groms = document.querySelectorAll('span[data-category="mapIcon"][data-icon="Grom"]');

    for (var iO = 0; iO < groms.length; iO++) {
        var grom = groms[iO],
            gromCont = document.createElement('div');

        gromCont.className = 'map-elements-shop';
        gromCont.style.left = grom.style.left;
        gromCont.style.top = grom.style.top;
        gromCont.dataset.shopId = grom.id;
        gromCont.id = Math.floor(Math.random() * 100000000);
        gromCont.setAttribute('tabindex', -1);
        gromCont.addEventListener('mouseleave', function () {
            this.dataset.active = false;
        });
        gromCont.addEventListener('blur', function () {
            this.dataset.active = false;
        });
        grom.dataset.shopId = gromCont.id;
        grom.addEventListener('mouseenter', function () {
            document.getElementById(this.dataset.shopId).dataset.active = true;
            document.getElementById(this.dataset.shopId).focus();
        });

        for (var i = 0; i < gromData.data.tabs.length; i++) {
            var tabs = gromData.data.tabs[i],
                gromTab = document.createElement('div'),
                gromTabName = document.createElement('label');

            gromTab.className = 'map-elements-shop-tab';
            gromTabName.className = 'map-elements-shop-name';
            gromTabName.textContent = tabs.name;

            for (var i2 = 0; i2 < tabs.items.length; i2++) {
                var newIcon = createIcon({ x: 0, y: 0 }),
                    tempIconData = iconDataNew[tabs.type][tabs.items[i2]],
                    tempIcon = { mapId: 'grom' + iO + i + i2, x: newIcon.style.left, y: newIcon.style.top, standard: true, iconName: tabs.items[i2], name: tempIconData.name, category: tempIconData.category, shopIcon: true };

                newIcon.dataset.iconId = iconJSON.length;
                newIcon.id = 'grom' + iO + i + i2;
                iconJSON.push(tempIcon);
                newIcon.removeAttribute('new');
                newIcon.dataset.name = tempIconData.name;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = tabs.items[i2];

                setIconFromSheet(newIcon);
                newIcon.style.position = 'relative';
                newIcon.style.transform = 'none';

                gromTab.appendChild(newIcon);
            }
            gromCont.appendChild(gromTabName);
            gromCont.appendChild(gromTab);
        }
        document.getElementById('orimap-container').appendChild(gromCont);
    }
}

function createTuleyShops() {
    var tuleyData = iconDataNew.mapIcon['Gardener'],
        tuleys = document.querySelectorAll('span[data-category="mapIcon"][data-icon="Tuley"]');

    for (var iO = 0; iO < tuleys.length; iO++) {
        var tuley = tuleys[iO],
            tuleyCont = document.createElement('div');

        tuleyCont.className = 'map-elements-shop';
        tuleyCont.style.left = tuley.style.left;
        tuleyCont.style.top = tuley.style.top;
        tuleyCont.dataset.shopId = tuley.id;
        tuleyCont.id = Math.floor(Math.random() * 100000000);
        tuleyCont.setAttribute('tabindex', -1);
        tuleyCont.addEventListener('mouseleave', function () {
            this.dataset.active = false;
        });
        tuleyCont.addEventListener('blur', function () {
            this.dataset.active = false;
        });
        tuley.dataset.shopId = tuleyCont.id;
        tuley.addEventListener('mouseenter', function () {
            document.getElementById(this.dataset.shopId).dataset.active = true;
            document.getElementById(this.dataset.shopId).focus();
        });

        for (var i = 0; i < tuleyData.data.tabs.length; i++) {
            var tabs = tuleyData.data.tabs[i],
                tuleyTab = document.createElement('div'),
                tuleyTabName = document.createElement('label');

            tuleyTab.className = 'map-elements-shop-tab';
            tuleyTabName.className = 'map-elements-shop-name';
            tuleyTabName.textContent = tabs.name;

            for (var i2 = 0; i2 < tabs.items.length; i2++) {
                var newIcon = createIcon({ x: 0, y: 0 }),
                    tempIconData = iconDataNew[tabs.type][tabs.items[i2]],
                    tempIcon = { mapId: 'tuley' + iO + i + i2, x: newIcon.style.left, y: newIcon.style.top, standard: true, iconName: tabs.items[i2], name: tempIconData.name, category: tempIconData.category, shopIcon: true };

                newIcon.dataset.iconId = iconJSON.length;
                newIcon.id = 'tuley' + iO + i + i2;
                iconJSON.push(tempIcon);
                newIcon.removeAttribute('new');
                newIcon.dataset.name = tempIconData.name;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = tabs.items[i2];

                setIconFromSheet(newIcon);
                newIcon.style.position = 'relative';
                newIcon.style.transform = 'none';

                tuleyTab.appendChild(newIcon);
            }
            tuleyCont.appendChild(tuleyTabName);
            tuleyCont.appendChild(tuleyTab);
        }
        document.getElementById('orimap-container').appendChild(tuleyCont);
    }
}
*/

/*function toggleIconsOnMap(category, name = false) {
    if (isEditingMode === false || isEditingMode && activeIconPicker === undefined || name && name.nodeType) {
        var cont = document.getElementById('orimap-container'),
            query = 'span[data-category=' + category + ']',
            categoryBool;

        if (name && name.nodeType === undefined) {
            query += '[data-icon-name="' + name + '"]';
        } else {
            categoryBool = name.getAttribute('show') === 'true' ? false : true;
            name.setAttribute('show', categoryBool);
        }
        var mapIcons = cont.querySelectorAll(query);

        for (var i = 0; i < mapIcons.length; i++) {
            if (name && name.nodeType) {
                mapIcons[i].style.display = (categoryBool === true ? 'flex' : 'none');
            } else {
                if (mapIcons[i].style.display === 'flex') {
                    mapIcons[i].style.display = 'none';
                } else {
                    mapIcons[i].style.display = 'flex';
                }
            }
        }
    }
}*/

function togglePopupsOnMap() {
    var popups = document.querySelectorAll('div.popup'),
        toggler = document.getElementById('strat-vis-toggle');

    toggler.dataset.toggle = toggler.dataset.toggle === 'true' ? 'false' : 'true';
    toggler.innerText = toggler.dataset.toggle === 'true' ? 'Hide All' : 'Show All';
    for (var i = 0; i < popups.length; i++) {
        if (toggler.dataset.toggle === 'false') {
            popups[i].style.display = 'none';
        } else {
            popups[i].style.display = 'flex';
        }
    }
}

/*function loadAllBranches() {
    var tempJson = window.localStorage.getItem('branches3'),
        tempBranches = [];

    if (tempJson) {
        allMousePosRecords = allMousePosRecords.concat(JSON.parse(tempJson));
    }

    for (var i = 0; i < allMousePosRecords.length; i++) {
        var branch = new Branch(allMousePosRecords[i].mapId, allMousePosRecords[i].standard, allMousePosRecords[i].id);
        branch.loadBranch(allMousePosRecords[i]);
        tempBranches.push(branch);
    }
    allMousePosRecords = tempBranches;

    loadAllRoutes();
    listMapElements('branch', allMousePosRecords);

    if (activeRoute) {
        activeRoute.showData();
    }
    drawer.drawFrames(0);
}*/

/*function loadAllRoutes() {
    var tempJson = window.localStorage.getItem('routes3'),
        tempRoutes = [];

    if (tempJson) {
        allRoutes = allRoutes.concat(JSON.parse(tempJson));
    }

    for (var i = 0; i < allRoutes.length; i++) {
        var route = new Route(allRoutes[i].name, allRoutes[i].category, allRoutes[i].difficulty, allRoutes[i].oob, allRoutes[i].branches, allRoutes[i].standard, allRoutes[i].id);
        if (i === 0) {
            activeRoute = route;
        }
        tempRoutes.push(route);
    }
    allRoutes = tempRoutes;
}*/

function openRouteDetails() {
    if (document.querySelector('div.map-elements-route-details')) {
        var dropdown = document.querySelector('div.map-elements-route-details').parentNode;

        dropdown.setAttribute('toggle', true);
    }
}

/*function listMapElements(type = 'branch', data) {
    var container = document.querySelector('div.map-elements');

    if (type === 'branch') {
        var cont = container.querySelector('div.map-elements-branches');

        cont.innerHTML = '';

        for (var i = 0; i < data.length; i++) {
            var template = document.getElementById('map-elements-current-route-branches'),
                clone = template.content.cloneNode(true);

            clone.querySelector('label.map-elements-current-route-branches-name').textContent = (data[i].paths[0].text !== undefined ? data[i].paths[0].text : '');
            clone.querySelector('label.map-elements-current-route-branches-location').textContent = data[i].paths[0].nodes[0] !== undefined ? map.getMapLocation({ x: data[i].paths[0].nodes[0].x, y: data[i].paths[0].nodes[0].y }) : '';
            clone.querySelector('span.map-elements-current-route-branches-color').style.backgroundColor = data[i].paths[0].color !== undefined ? data[i].paths[0].color : 'red';
            clone.children[0].dataset.pos = data[i].paths[0].nodes[0] !== undefined ? data[i].paths[0].nodes[0].x + ' ' + data[i].paths[0].nodes[0].y : '';
            clone.children[0].dataset.indexes = data[i].mapId;

            clone.children[0].id = Math.floor((Math.random() * 100000000) + 1);

            clone.children[0].addEventListener('click', function () {
                var newPos = this.dataset.pos.split(' ');
                ctxPaint.clearRect(0, 0, cvsPaint.width, cvsPaint.height);
                map.setMap({ x: newPos[0] * -1, y: newPos[1] * -1 });
                activeBranch = allMousePosRecords[this.dataset.indexes];
                drawer.clearMap();
                openRouteDetails();
                allMousePosRecords[this.dataset.indexes].drawPaths();
                if (isEditingMode) {
                    drawer.makeElementsEditable();
                }
            });

            cont.appendChild(clone);
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
            setIconFromSheet(clone.querySelector('span.strat-icon'));
            clone.querySelector('label.strat-location').textContent = map.getMapLocation({ x: parseFloat(data[i].x), y: parseFloat(data[i].y) });

            clone.children[0].dataset.pos = parseFloat(data[i].x) + ' ' + parseFloat(data[i].y);
            clone.children[0].dataset.id = data[i].mapId;
            clone.children[0].addEventListener('click', function () {
                if (!event.target.classList.contains('strat-standard')) {
                    var newPos = this.dataset.pos.split(' ');
                    map.setMap({ x: newPos[0] * -1, y: newPos[1] * -1 });
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
}*/

function populateFilterData() {
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

function createComment(event) {
    var pos = { x: 0, y: 0 },
        temp = document.getElementById('popup-template'),
        clon = temp.content.cloneNode(true),
        oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();

    pos.x = (event.clientX - oriMapCont.left) / wotw.map.currentZoom;
    pos.y = (event.clientY - oriMapCont.top) / wotw.map.currentZoom;

    clon.children[0].style.left = pos.x + 'px';
    clon.children[0].style.top = pos.y + 'px';
    clon.children[0].dataset.pos = pos.x + ' ' + pos.y;
    clon.children[0].id = Math.floor((Math.random() * 100000000) + 1);
    clon.children[0].dataset.popupId = popupJSON.length;
    popupJSON.push({ mapId: clon.children[0].id, x: pos.x + 'px', y: pos.y + 'px', standard: false });
    document.getElementById('orimap-container').appendChild(clon);
}

function updateStrat(index, el) {
    var type = el.dataset.type;

    switch (type) {
        case 'name':
        case 'category':
            popupJSON[index][type] = el.value;
            break;

        case 'required':
            var objReq = popupJSON[index][type];
            if (el.checked) {
                if (objReq.indexOf(el.value) === -1) {
                    objReq.push(el.value);
                }
            } else {
                if (objReq.indexOf(el.value) !== -1) {
                    objReq.splice(objReq.indexOf(el.value), 1);
                }
            }
            popupJSON[index][type] = objReq;
            break;

        case 'text':
            popupJSON[index][type] = el.innerText;
            break;

        case 'url':
            popupJSON[index][type] = el.value;
            break;
    }
    popupJSON[index].hasChanged = true;
}

/*function createIcon(event) {
    var pos = { x: 0, y: 0 },
        icon = document.createElement('span'),
        oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();

    if (event.clientX && event.clientY) {
        pos.x = (event.clientX - oriMapCont.left) / wotw.map.currentZoom;
        pos.y = (event.clientY - oriMapCont.top) / wotw.map.currentZoom;
    } else {
        pos.x = parseFloat(event.x);
        pos.y = parseFloat(event.y);
    }

    icon.style.left = pos.x + 'px';
    icon.style.top = pos.y + 'px';
    icon.style.display = isEditingMode ? 'flex' : 'none';
    icon.dataset.pos = pos.x + ' ' + pos.y;
    icon.id = Math.floor((Math.random() * 100000000) + 1);
    icon.className = 'map-icon map-icon-onmap';
    icon.setAttribute('new', true);
    icon.addEventListener('mousedown', function () { iconBeingDragged = this; activeIconPicker = this; });

    document.getElementById('orimap-container').appendChild(icon);

    return icon;
}*/

function toggleDropdown(el, event) {
    if (el === event.target) {
        el.parentNode.setAttribute('toggle', el.parentNode.getAttribute('toggle') === 'true' ? false : true);
    }
}

function playFrames() {
    var wasDrawn = wotw.drawer.drawFrames(wotw.drawer.activeFrame),
        playButton = document.getElementById('playFrames'),
        frameMover = document.getElementById('framemover'),
        container = document.getElementById('framecontainer');

    if (playButton.dataset.active === 'true') {
        wotw.drawer.activeFrame++;
        frameMover.style.left = Math.min(wotw.drawer.activeFrame * 3, parseFloat(container.style.minWidth)) + 'px';


        if (wasDrawn) {
            setTimeout(function () {
                window.requestAnimationFrame(playFrames);
            }, 250);
        }
    }
}

function mouseEvents(event) {
    var mapData = wotw.map.getMapData(event);
    if (document.getElementById('map-element-mouse-position')) {
        document.getElementById('map-element-mouse-position').textContent = mapData.mapX + ", " + mapData.mapY;
    }
    if (document.getElementById('map-element-mouse-position-game')) {
        document.getElementById('map-element-mouse-position-game').value = mapData.gameX + ", " + mapData.gameY;
    }
    if (document.getElementById('current-map-location')) {
        document.getElementById('current-map-location').textContent = mapData.mapLocation;
    }

    if (wotw.timeline.frameDragging) {
        wotw.timeline.setFrameMoverPos(event);
    } else if (anchorDragging) {
        setAnchorPos(event);
    } else if (commentBeingDragged) {
        setCommentPos(event);
    } else if (iconBeingDragged !== undefined) {
        setIconPos(event);
    } else if (activeMapBorderNode) {
        wotw.map.setMapBorderNodePos(parseFloat(mapData.left), parseFloat(mapData.top));
    } else if (isInGameBoxMode && isDrawingBox) {
        createBox(event);
    } else if (wotw.map.isDraggingMap && isPaintMode === false && isSubPathMode === false && isNodeMode === false) {
        wotw.map.moveMap(event);
    }
}

function mouseClickEvents(event) {
    var oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();
    const mPos = [{ x: (event.clientX - oriMapCont.left) / wotw.map.currentZoom, y: (event.clientY - oriMapCont.top) / wotw.map.currentZoom }];

    if (isNodeMode && activeBranch) {
        event.preventDefault();
        event.stopPropagation();

        if (event.ctrlKey && event.target.classList.contains('frame-position-button')) {
            var indexes = event.target.dataset.indexes.split(' ');
            wotw.allBranches[indexes[2]].paths[indexes[1]].removeNode(event.target);
        } else {
            activeBranch.paths[0].newPath(mPos);
        }
        wotw.drawer.drawFrames(wotw.drawer.activeFrame);
    } else if (mapLinkerElement !== undefined) {
        mapLinkerPicker(event);
    } else if (isInGameBoxMode) {
        if (isDrawingBox) {
            var oriMapSize = document.getElementById('orimap').getBoundingClientRect(),
                copyText = '',
                gameMapTop = ((4796.8700000000003 - (parseFloat(startPosBox.y) * -1)) * -1) * 0.72, //4860.870000000000
                gameMapLeft = (2440.73 - (parseFloat(startPosBox.x).mapRange(0, Math.abs(oriMapSize.width) / wotw.map.currentZoom, Math.abs(oriMapSize.width) / wotw.map.currentZoom, 0) * 0.726));

            copyText = gameMapLeft.toFixed(2) + ', ' + gameMapTop.toFixed(2) + ', ';

            copyToClipboard(copyText + (sizePosBox.x - startPosBox.x).toFixed(2) + ', ' + (sizePosBox.y - startPosBox.y).toFixed(2));
            isDrawingBox = false;
            startPosBox = { x: 0, y: 0 };
        } else {
            startPosBox = { x: mPos[0].x, y: mPos[0].y };
            isDrawingBox = true;
        }
    } else if (document.getElementById('context-menu') && document.getElementById('context-menu').style.display === 'flex') {
        document.getElementById('context-menu').style.display = 'none';
    }
}

function rightMouseClickEvents(event) {
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

function copyToClipboard(text) {
    var temp = document.getElementById('context-menu-temp-clipboard');

    temp.value = text;
    temp.select();
    temp.focus();
    document.execCommand("copy");
}

function getShareableLink(type, data) {
    var urlParams = new URLSearchParams();

    switch (type) {
        case 'icon':
            urlParams.set(type, data);
            break;

        case 'pos':
            var temp = data.replace(' ', '');
            urlParams.set(type, temp);
            break;

        case 'pathnode':
            var temp = data.replace(' ', ',');
            urlParams.set(type, temp);
            break;
    }

    copyToClipboard(window.location.protocol + '//' + window.location.hostname + window.location.pathname + '?' + urlParams.toString());
}

function createBox(event) {
    if (isDrawingBox) {
        var oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();

        sizePosBox = { x: (event.clientX - oriMapCont.left) / wotw.map.currentZoom, y: (event.clientY - oriMapCont.top) / wotw.map.currentZoom };

        wotw.drawer.clearMap();
        ctxPaint.beginPath();
        ctxPaint.strokeStyle = 'red';
        ctxPaint.lineWidth = 1;
        ctxPaint.globalAlpha = 1.0;
        ctxPaint.rect(startPosBox.x, startPosBox.y, sizePosBox.x - startPosBox.x, sizePosBox.y - startPosBox.y);
        ctxPaint.stroke();
    }
}

function setAnchorPos(event) {
    if (anchorDragging && anchorBeingDragged !== undefined) {
        var container = document.getElementById('orimap-container'),
            sizePerc = container.getBoundingClientRect(),
            indexes = anchorBeingDragged.dataset.indexes.split(' '),
            pos;

        pos = wotw.allBranches[indexes[2]].paths[indexes[1]].nodes[indexes[0]];
        pos.x = (event.clientX - sizePerc.left) / wotw.map.currentZoom;
        pos.y = (event.clientY - sizePerc.top) / wotw.map.currentZoom;

        anchorBeingDragged.style.left = pos.x + 'px';
        anchorBeingDragged.style.top = pos.y + 'px';

        wotw.allBranches[indexes[2]].paths[indexes[1]].nodes[indexes[0]] = pos;
        wotw.allBranches[indexes[2]].hasChanged = true;
        wotw.drawer.drawFrames(wotw.drawer.activeFrame);
    }
}

function setCommentPos(event) {
    if (isEditingMode) {
        var container = commentBeingDragged.parentNode,
            oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();

        container.style.left = (event.clientX - oriMapCont.left) / wotw.map.currentZoom + 'px';
        container.style.top = (event.clientY - oriMapCont.top) / wotw.map.currentZoom + 'px';
        popupJSON[container.dataset.popupId].x = container.style.left;
        popupJSON[container.dataset.popupId].y = container.style.top;
        popupJSON[container.dataset.popupId].hasChanged = true;
    }
}

function setIconPos(event) {
    if (isEditingMode) {
        var oriMapCont = document.getElementById('orimap-container').getBoundingClientRect();

        iconBeingDragged.style.left = (event.clientX - oriMapCont.left) / wotw.map.currentZoom + 'px';
        iconBeingDragged.style.top = (event.clientY - oriMapCont.top) / wotw.map.currentZoom + 'px';
        iconJSON[iconBeingDragged.dataset.iconId].x = iconBeingDragged.style.left;
        iconJSON[iconBeingDragged.dataset.iconId].y = iconBeingDragged.style.top;
        iconJSON[iconBeingDragged.dataset.iconId].hasChanged = true;
    }
}

function onDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
    event.currentTarget.style.color = '#ffdf00';
}

function onDragOver(event) {
    event.preventDefault();
}

function onDragEnter(event) {
    event.preventDefault();
    if (event.target.hasAttribute && event.target.hasAttribute('draggable')) {
        event.target.classList.add('droppable');
    }
}

function onDragExit(event) {
    event.preventDefault();
    if (event.target.hasAttribute && event.target.hasAttribute('draggable') && !event.target.contains(event.relatedTarget)) {
        event.target.classList.remove('droppable');
    }
}

function onDragEnd(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text');

    const draggableElement = document.getElementById(id);
    if (draggableElement) {
        draggableElement.style.color = 'white';
    }
}

function onDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text');

    const draggableElement = document.getElementById(id);
    const dropzone = event.target.parentNode;

    if (event.target.hasAttribute('garbage')) {
        activeRoute.removeBranch(draggableElement.dataset.indexes);
        activeRoute.updateBranchesHtml();
        //draggableElement.remove();
    } else {
        event.target.classList.remove('droppable');
        draggableElement.style.color = 'white';
        activeRoute.insertBeforeBranch(event.target.dataset.indexes, draggableElement.dataset.indexes);
        activeRoute.updateBranchesHtml();
        //dropzone.insertBefore(draggableElement, event.target);
    }
}

/*function loadStandardData() {
    const sqlUrl = "/classes/moki.php";
    data = 'getMoki=true';
    $.ajax({
        type: "POST",
        url: sqlUrl,
        data: data,
        dataType: 'json',
        cache: false,
        success: function (data) { popuplateStandardData(data); }
    });
}*/

/*function popuplateStandardData(data) {
    if (data.mapBorders) {
        map.allMaps = data.mapBorders;
    }
    if (data.mapPopups) {
        popupJSON = data.mapPopups;
        for (var i = 0; i < popupJSON.length; i++) {
            popupJSON[i].standard = true;
        }
    }
    if (data.mapRoutes) {
        allRoutes = data.mapRoutes;
        for (var i = 0; i < allRoutes.length; i++) {
            allRoutes[i].standard = true;
        }
    }
    if (data.mapIcons) {
        iconJSON = data.mapIcons;
        for (var i = 0; i < iconJSON.length; i++) {
            iconJSON[i].standard = true;
        }
    }
    if (data.mapBranches) {
        allMousePosRecords = data.mapBranches;
        for (var i = 0; i < allMousePosRecords.length; i++) {
            allMousePosRecords[i].standard = true;
        }
    }
    var urlParams = new URLSearchParams(window.location.search);

    createIconsIconPicker();
    loadMapElements();
    loadAllBranches();
    timeline.updateFrameLabels(document.getElementById('framecontainer'));
    inventory = new Inventory();
    inventory.updatePickups();
    checkParams(urlParams);
}*/

function checkParams(urlParams = undefined) {
    if (urlParams === undefined) {
        var urlParams = new URLSearchParams(window.location.search);
    }
    if (urlParams.has('icon')) {
        var icons = urlParams.getAll('icon');

        for (var i = 0; i < icons.length; i++) {
            var icon = iconJSON[icons[i]];

            document.getElementById(icon.mapId).style.display = 'flex';

            if (i === 0) {
                wotw.map.setMap({ x: parseFloat(icon.x) * -1, y: parseFloat(icon.y) * -1 });
                wotw.map.setMapZoomLevel(3.5);
            }
        }
    } else if (urlParams.has('iconId')) {
        var icons = urlParams.getAll('iconId');

        for (var i = 0; i < icons.length; i++) {

            var icon = iconJSON[document.getElementById(icons[i]).dataset.iconId]

            document.getElementById(icon.mapId).style.display = 'flex';

            if (i === 0) {
                wotw.map.setMap({ x: parseFloat(icon.x) * -1, y: parseFloat(icon.y) * -1 });
                wotw.map.setMapZoomLevel(3.5);
            }
        }
    }

    if (urlParams.has('pos')) {
        var pos = urlParams.get('pos');

        pos = pos.split(',');
        if (pos.length === 1) {
            pos = { x: pos[0], y: pos[0] };
        } else if (pos.length > 1) {
            pos = { x: pos[0], y: pos[1] };
        }
        wotw.map.setMap(pos);
    }

    if (urlParams.has('pathnode')) {
        var indexes = urlParams.get('pathnode').split(',');
        activeBranch = wotw.allBranches[indexes[0]];
        wotw.drawer.clearMap();
        openRouteDetails();
        activeBranch.drawPaths();
        var newPos = indexes.length == 2 ? activeBranch.path[indexes[1]] : activeBranch.subPaths[indexes[2]][indexes[1]];
        wotw.map.setMap({ x: newPos.x * -1, y: newPos.y * -1 });
    }

    if (urlParams.has('route') || urlParams.has('r')) {
        var name = urlParams.has('r') !== false ? urlParams.get('r') : urlParams.get('route');
        for (var i = 0; i < wotw.allRoutes.length; i++) {
            if (wotw.allRoutes[i].name === name) {
                activeRoute = wotw.allRoutes[i];
                activeRoute.showData();
            }
        }
    }

    if (urlParams.has('path')) {
        activeBranch = wotw.allBranches[urlParams.get('path')];
        wotw.allBranches[urlParams.get('path')].drawPaths();
        wotw.map.setMap({ x: wotw.allBranches[urlParams.get('path')].paths[0].nodes[0].x * -1, y: wotw.allBranches[urlParams.get('path')].paths[0].nodes[0].y * -1 });
    }
}

function generateParamsUrl(type, operation, value) {
    var url = new URL(window.location.href),
        params = url.searchParams;

    switch (type) {
        case 'icon':
            if (operation === 'set') {
                params.set('icon', value);
            } else {
                params.append('icon', value);
            }
            break;

        case 'iconId':
            if (operation === 'set') {
                params.set('iconId', value);
            } else {
                params.append('iconId', value);
            }
            break;

        case 'pos':
            if (operation === 'set') {
                params.set('pos', value);
            } else {
                params.append('pos', value);
            }
            break;

        case 'path':
            if (operation === 'set') {
                params.set('path', value);
            } else {
                params.append('path', value);
            }
            break;

        case 'pathNode':
            if (operation === 'set') {
                params.set('pathnode', value);
            } else {
                params.append('pathnode', value);
            }
            break;

        case 'route':
            if (operation === 'set') {
                params.set('route', value);
                params.set('path', 0);
            } else {
                params.append('route', value);
            }
            break;
    }

    url.searchParams = params;
    window.history.replaceState({}, document.title, url.pathname + url.search);
}

function cross(a, b, o) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function angle(a, b) {
    var x = Math.atan2(a.y - b.y, a.x - b.x);
    return (x > 0 ? x : (2 * Math.PI + x)) * 360 / (2 * Math.PI);
}

function angle180(a, b) {
    var x = Math.atan2(a.y - b.y, a.x - b.x);
    return x * 180 / Math.PI;
}

function angle2(a, b, o) {
    var x = angle(a, b);
    var y = angle(b, o);
    var angle1 = 180 - Math.abs(Math.abs(x - y) - 180);
    return angle1;
}

function distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function lineSlope(a, b) {
    return (a.y - b.y) / (a.x - b.x);
}

function lineIntersect(slope, b) {
    return b.y - (slope * b.x);
}

function lineEquation(x, slope, intersect) {
    return slope * x + intersect;
}

function interpolate(a, b, frac) // points A and B, frac between 0 and 1
{
    var nx = a.x + (b.x - a.x) * frac;
    var ny = a.y + (b.y - a.y) * frac;
    return { x: nx, y: ny };
}

function furthestCorner(x, y, boundBox) {
    var furthest = 0;
    var box = boundBox[0];
    for (var i = 0; i < boundBox.length; i++) {
        var pt2 = boundBox[i];
        var distance = Math.pow((pt2.y - y), 2) + Math.pow((pt2.x - x), 2);
        if (distance > furthest) {
            furthest = distance;
            box = boundBox[i];
        }
    }
    return box;
}

function getIntersections(x, y, points) {
    var bBox = boundingBox(points);
    var furthestPt = furthestCorner(x, y, bBox);

    var intersections = 0;
    for (var i = 0; i < points.length; i++) {
        var pt1 = points[i];
        var pt2 = points[(i + 1) % points.length];
        var val = intersects(x, y, x + 500000, y, pt1.x, pt1.y, pt2.x, pt2.y);
        if (val) {
            intersections++;
        }
    }
    return intersections;
}

function selfIntersections(points) {
    for (var i = 0; i < points.length; i++) {
        var a = points[i];
        var b = points[(i + 1) % (points.length)];
        var c = points[(i + 2) % (points.length)];
        var intersect = intersects(a.x, a.y, b.x, b.y, b.x, b.y, c.x, c.y);
        if (intersect) {
            createLine(a.x, a.y, b.x, b.y, "red");
            createLine(b.x, b.y, c.x, c.y, "pink");
        }
    }
}

function boundingBox(points) {
    var box = { minX: points[0].x, minY: points[0].y, x: points[0].x, y: points[0].y };
    for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        if (pt.x < box.minX) {
            box.minX = pt.x - 50;
        }
        if (pt.y < box.minY) {
            box.minY = pt.y - 50;
        }
        if (pt.x > box.x) {
            box.x = pt.x + 50;
        }
        if (pt.y > box.y) {
            box.y = pt.y + 50;
        }
    }
    var boundBox = [{ x: box.minX, y: box.minY }, { x: box.x, y: box.minY }, { x: box.x, y: box.y }, { x: box.minX, y: box.y }];
    return boundBox;
}

function intersects(a, b, c, d, p, q, r, s) {
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
    }
}

Number.prototype.mapRange = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}