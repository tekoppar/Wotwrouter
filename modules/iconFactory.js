class IconFactory {
    constructor(map, columnSpan = 29, rowSpan = 13) {
        this.columnSpan = columnSpan;
        this.rowSpan = rowSpan;
        this.sheetWidth = 1856;
        this.sheetHeigth = 823;
        this.iconData = iconDataNew;
        this.categoriesIndex = {};
        this.mapClass = map;
        this.activeIconPicker;
        this.iconBeingDragged
        this.dropdown;
        this.icons = [];

        this.createHTML();
        this.indexCategories();
        this.createIconsIconPicker();
    }

    handleEvent(event) {
        switch (event.type) {
            case 'click':
                if (event.target.classList.contains('dropdown-label')) {
                    this.toggleDropdown(event.target, event);
                } else {
                    this.setIconFromSheet(event.target);
                }
                break;

            case 'mouseup':
                if (event.target.classList.contains('icon-toggle')) {
                    this.toggleIconsOnMap(event.target.dataset.category, event.target);
                } else if (event.target.classList.contains('icon-picker')) {
                    this.toggleIconsOnMap(event.target.dataset.category, event.target.dataset.iconName);
                }
                break;

            case 'mouseover':
                this.showIconData(event.target);
                break;

            case 'mousedown':
                this.iconBeingDragged = event.target;
                this.activeIconPicker = event.target;
                break;

            case 'contextmenu':
                event.preventDefault();
                event.stopPropagation();
                this.toggleIconsOnMap(event.target.dataset.category, event.target.dataset.iconName);
                if (document.querySelectorAll('span[data-name="' + event.target.dataset.name + '"]')[0]) {
                    var x = document.querySelectorAll('span[data-name="' + event.target.dataset.name + '"]')[0].dataset.pos.split(' ');
                    this.mapClass.setMap({ x: x[0] * -1, y: x[1] * -1 });
                }
                break;
        }

    }

    createHTML() {
        var dropdown = document.createElement('div'),
            dropdownLabel = document.createElement('label'),
            dropdownContainer = document.createElement('div'),
            dropdownIconContainer = document.createElement('div'),
            dropdownLabelContainer = document.createElement('label');

        dropdown.className = 'dropdown';
        dropdown.toggle = false;

        dropdownLabel.addEventListener('click', this, false);
        dropdownLabel.className = 'dropdown-label';
        dropdownLabel.innerText = 'Icons';

        dropdownContainer.className = 'map-elements-container';
        dropdownContainer.style.overflow = 'hidden';
        dropdownContainer.style.maxHeight = 'unset';
        dropdownContainer.style.padding = '0px';

        dropdownIconContainer.className = 'map-elements-container map-element-ori-icons icon-picker-dropdown';
        dropdownIconContainer.style.overflow = 'auto';
        dropdownIconContainer.style.maxHeight = '300px';
        dropdownIconContainer.style.marginBottom = '0px';
        dropdownIconContainer.style.padding = '5px 5px 10px 5px';
        dropdownIconContainer.addEventListener('click', this, false);
        dropdownIconContainer.addEventListener('mouseover', this, false);

        dropdownLabelContainer.id = 'map-elements-ori-icons-data';
        dropdownLabelContainer.style.fontSize = '12px';

        dropdownContainer.appendChild(dropdownIconContainer);
        dropdownContainer.appendChild(dropdownLabelContainer);

        dropdown.appendChild(dropdownLabel);
        dropdown.appendChild(dropdownContainer);

        this.dropdown = dropdown;
        document.getElementById('controls-container').querySelector('div.map-elements').appendChild(dropdown);
    }

    indexCategories() {
        var index = 0,
            collection = Object.entries(this.iconData);

        for (var i = 0; i < collection.length; i++) {
            this.categoriesIndex[collection[i][0]] = index;
            index += Object.keys(collection[i][1]).length;
        }
    }

    toggleDropdown(el, event) {
        if (el === event.target) {
            el.parentNode.setAttribute('toggle', el.parentNode.getAttribute('toggle') === 'true' ? false : true);
        }
    }

    showIconData(el) {
        if (el.dataset.category && el.dataset.iconName) {
            var info = '',
                iconData = this.iconData[el.dataset.category][el.dataset.iconName],
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
                            switch ('easy') {
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
                            switch ('easy') {
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
        icon.addEventListener('mousedown', this, false);

        //this.mapClass.mapContainer.appendChild(icon);

        return icon;
    }

    clearIcons() {
        var icons = document.querySelectorAll('span.map-icon-onmap');

        for (var i = 0; i < icons.length; i++) {
            icons[i].remove();
        }
        this.icons = [];
    }

    createIconHTML(icons) {
        this.clearIcons();
        
        for (var i = 0; i < icons.length; i++) {
            if (icons[i].iconName !== undefined && icons[i].iconName !== null && icons[i].iconName !== 'null') {
                var icon = icons[i],
                    newIcon,
                    tempIconData = (icon.category !== undefined && this.iconData[icon.category] !== undefined && this.iconData[icon.category][icon.iconName] !== undefined ? this.iconData[icon.category][icon.iconName] : this.iconData.mapIcon['Frame Glow']);

                newIcon = this.createIcon(icon);
                newIcon.style.display = 'flex';
                newIcon.removeAttribute('new');
                if (icon.icon !== undefined) {
                    newIcon.dataset.icon = icon.icon;
                } else {
                    icons[i].icon = tempIconData.name;
                    newIcon.dataset.icon = tempIconData.name;
                }
                newIcon.id = icon.mapId;
                newIcon.setAttribute('iconName', icon.iconName);
                newIcon.dataset.iconId = i;
                newIcon.dataset.category = tempIconData.category;
                newIcon.dataset.iconName = icon.iconName;
                newIcon.dataset.name = icon.name !== undefined ? icon.name : tempIconData.name;
                //this.setIconFromSheet(newIcon);
                this.icons.push(newIcon);
            }
        }
        for (var i = 0; i < this.icons.length; i++) {
            var newIcon = this.icons[i];
            this.mapClass.mapContainer.appendChild(newIcon);
            this.setIconFromSheet(newIcon);
            //newIcon.dataset.name = icon.name !== undefined ? icon.name : tempIconData.name;
        }
    }

    createIconsIconPicker() {
        var keysCategories = Object.keys(this.iconData);

        if (document.querySelector('div.map-element-ori-icons')) {
            for (var i = 0; i < keysCategories.length; i++) {
                var keysIcons = Object.keys(this.iconData[keysCategories[i]]),
                    label = document.createElement('label'),
                    div = document.createElement('div');

                label.className = 'map-hover-info ori-click ori-glow icon-toggle';
                label.dataset.popup = 'Toggle visibility';
                label.dataset.category = keysCategories[i];
                label.setAttribute('show', true);
                label.addEventListener('mouseup', this, false);
                label.textContent = iconDataNewNames[keysCategories[i]];

                div.dataset.category = keysCategories[i];
                div.className = 'icon-toggle-category';
                div.addEventListener('mouseup', this, false);
                div.addEventListener('contextmenu', this, false);

                for (var i2 = 0; i2 < keysIcons.length; i2++) {
                    var button = document.createElement('button');
                    //console.log(iconDataNew[keysCategories[i]][keysIcons[i2]]);

                    button.className = 'icon-picker';// icon-picker-info';
                    button.dataset.iconName = keysIcons[i2];
                    button.dataset.name = this.iconData[keysCategories[i]][keysIcons[i2]].name;
                    button.dataset.category = keysCategories[i];

                    this.setIconFromSheet(button);

                    div.appendChild(button);
                }
                document.querySelector('div.map-element-ori-icons').appendChild(label);
                document.querySelector('div.map-element-ori-icons').appendChild(div);
            }
        }
    }

    setIconFromSheet(icon) {
        if (this.iconData[icon.dataset.category]) {
            var index = 0;

            if (icon.classList.contains('icon-picker') && this.activeIconPicker) {
                index = this.categoriesIndex[icon.dataset.category] + Object.keys(this.iconData[icon.dataset.category]).indexOf(icon.dataset.iconName);

                var tempIconData = this.iconData[icon.dataset.category][icon.dataset.iconName],
                    row = Math.floor(index / this.columnSpan),
                    column = index - (row * this.columnSpan);

                this.activeIconPicker.style.background = "url('iconsheet3.webp') no-repeat";
                this.activeIconPicker.style.backgroundPosition = ((100 / (this.columnSpan - 1)) * column) + 0.020 + '% ' + ((100 / (this.rowSpan - 1)) * row) + '%';
                this.activeIconPicker.style.backgroundSize = '2900% 1300%';

                if (this.activeIconPicker.classList.contains('map-icon')) {
                    this.activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    this.activeIconPicker.dataset.name = tempIconData.name;
                    this.activeIconPicker.dataset.category = tempIconData.category;
                    this.activeIconPicker.removeAttribute('new');

                    iconJSON[this.activeIconPicker.dataset.iconId].category = tempIconData.category;
                    iconJSON[this.activeIconPicker.dataset.iconId].iconName = icon.dataset.iconName;
                    iconJSON[this.activeIconPicker.dataset.iconId].icon = tempIconData.name;
                    iconJSON[this.activeIconPicker.dataset.iconId].hasChanged = true;
                } else if (this.activeIconPicker.classList.contains('map-comment-icon')) {
                    this.activeIconPicker.style.backgroundColor = '#000';
                    this.activeIconPicker.dataset.iconName = icon.dataset.iconName;
                    this.activeIconPicker.dataset.category = tempIconData.category;
                    popupJSON[this.activeIconPicker.parentNode.dataset.popupId].icon = { iconName: icon.dataset.iconName, category: tempIconData.category };
                    popupJSON[this.activeIconPicker.parentNode.dataset.popupId].hasChanged = true;
                }
                return true;
            } else if (icon.dataset.category && icon.dataset.iconName) {
                index = this.categoriesIndex[icon.dataset.category] + Object.keys(this.iconData[icon.dataset.category]).indexOf(icon.dataset.iconName);

                //var tempIconData = this.iconData[icon.dataset.category][icon.dataset.iconName],
                var tempIconData = (icon.dataset.category !== undefined && this.iconData[icon.dataset.category][icon.dataset.iconName] !== undefined ? this.iconData[icon.dataset.category][icon.dataset.iconName] : this.iconData.mapIcon['Frame Glow']);
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
        if (this.activeIconPicker === undefined || name && name.nodeType) {
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

export default IconFactory;