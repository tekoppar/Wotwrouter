class Strats {
    constructor(strats, iconFactory) {
        this.strats = strats;
        this.iconFactoryClass = iconFactory
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

    createStratElements() {
        if (document.getElementById('popup-template')) {
            for (var i = 0; i < this.strats.length; i++) {
                var pos = { x: this.strats[i].x, y: this.strats[i].y },
                    temp = document.getElementById('popup-template'),
                    clon = temp.content.cloneNode(true);

                //fix required
                this.strats[i].required = this.strats[i].required.replace('Sword', 'Spirit Edge');
                this.strats[i].required = this.strats[i].required.replace('Bow', 'Spirit Arc');
                this.strats[i].required = this.strats[i].required.replace('Sentry', 'Spirit Sentry');
                this.strats[i].required = this.strats[i].required.replace('Hammer', 'Spirit Smash');
                this.strats[i].required = this.strats[i].required.split(', ');

                clon.children[0].style.left = pos.x;
                clon.children[0].style.top = pos.y;
                clon.children[0].id = this.strats[i].mapId;
                clon.children[0].dataset.popupId = i;
                clon.children[0].dataset.pos = parseFloat(this.strats[i].x) + ' ' + parseFloat(this.strats[i].y);
                if (this.strats[i].icon && this.strats[i].icon.iconName) {
                    clon.children[0].children[0].dataset.iconName = this.strats[i].icon.iconName;
                    clon.children[0].children[0].dataset.category = this.strats[i].icon.category;
                    this.iconFactoryClass.setIconFromSheet(clon.children[0].children[0]);
                }
                document.getElementById('orimap-container').appendChild(clon);
            }
            this.listMapElements('comment', this.strats);
        }
    }

    listStratElements() {
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
            this.iconFactoryClass.setIconFromSheet(clone.querySelector('span.strat-icon'));
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
    }

    loadStratData(newEl, index) {
        var popupCont = document.getElementById('popup-container'),
            children = popupCont.querySelectorAll('*.popup-editable, label[data-type="required"]');

        for (var i2 = 0; i2 < children.length; i2++) {
            var type = children[i2].dataset.type;

            switch (type) {
                case 'name':
                case 'category':
                    if (this.strats[index] && this.strats[index][type]) {
                        children[i2].value = this.strats[index][type];
                    } else {
                        children[i2].value = '';
                    }
                    break;

                case 'required':
                    var inputs = popupCont.querySelectorAll('input[data-type="required"]');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].checked = false;
                    }
                    for (var i = 0; i < this.strats[index][type].length; i++) {
                        var input = popupCont.querySelector('input[value="' + this.strats[index][type][i].toString() + '"]');
                        if (input) {
                            input.checked = true;
                        }
                    }
                    popupCont.querySelector('label[data-type="required"').innerText = this.strats[index][type].toString().replace(/,/g, ', ');
                    break;

                case 'text':
                    if (this.strats[index] && this.strats[index][type]) {
                        children[i2].innerText = this.strats[index][type];
                    } else {
                        children[i2].innerText = '';
                    }
                    break;

                case 'url':
                    if (this.strats[index] && this.strats[index][type]) {
                        children[i2].value = this.strats[index][type];
                        children[i2].nextElementSibling.href = children[i2].nextElementSibling.textContent = this.strats[index][type];
                    } else {
                        children[i2].value = '';
                        children[i2].nextElementSibling.href = children[i2].nextElementSibling.textContent = '';
                    }
                    break;

            }
        }

        newEl.appendChild(popupCont);
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
}

export default Strats;