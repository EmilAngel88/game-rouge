function Map(width, height, emptyCellRatio){
    this.width = width;
    this.height = height;
    this.emptyCellRatio = emptyCellRatio / 100;
    this.fieldStates = [];
}

Map.prototype.generate = function() {
    // Создаём пустую матрицу слоёв
    this.fieldStates = Utils.createMatrix(this.height, this.width, function() {
        return { layers: [''] };
    });

    // 2. Заполняем стены
    this.fillWalls();

    // 3. Генерируем проходы
    var passages = this.generatePassages();
    // 4. Размещаем проходы на поле
    this.applyPassages(passages);

    // 5. Генерируем размеры комнат и их координаты на поле
    var totalArea = this.width * this.height * this.emptyCellRatio;
    var roomCount = Utils.getRandomInRange(5, 10);
    var roomParameters = this.generateRoomSizes(totalArea, roomCount);
    var roomsData = this.placeRooms(roomParameters);

    // 6. Размещаем комнаты на поле
    this.applyRooms(roomsData);
};

Map.prototype.fillWalls = function () {
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            this.fieldStates[i][j].layers.push('W');
        }
    }
};

Map.prototype.clearWall = function (cell) {
    return Utils.removeElementFromCell(cell.layers, 'W');
};

Map.prototype.generateRoomSizes = function(totalArea, roomNumber) {
    var deviations = [];
    var halfY = Math.floor(roomNumber / 2);
    for (var i = 0; i < halfY; i++) {
        var v = Utils.getRandomInRange(0, 0.2, true);
        deviations.push(v);
        deviations.push(-v);
    }
    if (roomNumber % 2 !== 0) deviations.push(0);
    Utils.shuffleArray(deviations);

    var roomsArea = [];
    for (var j = 0; j < roomNumber; j++) {
        roomsArea.push(Math.ceil(totalArea / roomNumber * (1 + deviations[j])));
    }

    var roomParameters = [];
    for (var k = 0; k < roomsArea.length; k++) {
        var width = Utils.getRandomInRange(3, 8);
        var height = Math.ceil(roomsArea[k] / width);
        if (height < 3) height = 3;
        if (height > 8) height = 8;
        roomParameters.push([width, height]);
    }
    return roomParameters;
};

Map.prototype.placeRooms = function(roomParameters) {
    var roomsData = [];
    for (var i= 0; i < roomParameters.length; i++) {
        var widthRoom = roomParameters[i][0];
        var heightRoom = roomParameters[i][1];
        var coords = Utils.getRandomCoordsInRange(this.width - widthRoom, this.height - heightRoom);
        var x = coords.x;
        var y = coords.y;

        var intersects = false;
        for (var dx= 0; dx < widthRoom; dx++) {
            for (var dy= 0; dy < heightRoom; dy++) {
                if (this.fieldStates[y+dy][x+dx].layers.indexOf('W') === -1) {
                    intersects = true; break;
                }
            }
            if (intersects) break;
        }

        if (intersects) {
            roomsData.push({ id: i, coords: [x, y], sides: roomParameters[i] });
        } else {
            roomParameters.splice(i, 1);
            i--;
        }
    }
    return roomsData;
};

Map.prototype.generatePassages = function() {
    var vertical = [], horizontal = [];
    var verticalCount = Utils.getRandomInRange(3,5);
    var horizontalCount = Utils.getRandomInRange(3,5);

    for (var i= 0; i < verticalCount; i++) vertical.push(Utils.getRandomInRange(1,this.width-2));
    for (var j= 0; j < horizontalCount; j++) horizontal.push(Utils.getRandomInRange(1,this.height-2));

    return {vertical: vertical, horizontal: horizontal};
};

Map.prototype.applyPassages = function(passages) {
    var self = this;

    passages.vertical.forEach(function(v) {
        for (var i = 0; i < self.height; i++) {
            self.fieldStates[i][v].layers = self.clearWall(self.fieldStates[i][v]);
        }
    });

    passages.horizontal.forEach(function(h) {
        for (var i = 0; i < self.width; i++) {
            self.fieldStates[h][i].layers = self.clearWall(self.fieldStates[h][i]);
        }
    });
};

Map.prototype.applyRooms = function(roomsData) {
    var self = this;
    roomsData.forEach(function(room){
        for (var i = room.coords[1]; i < room.coords[1] + room.sides[1]; i++) {
            for (var j = room.coords[0]; j < room.coords[0] + room.sides[0]; j++) {
                self.fieldStates[i][j].layers = self.clearWall(self.fieldStates[i][j]);
            }
        }
    });
};

Map.prototype.render = function(container) {
    container.innerHTML = '';

    for (var x = 0; x < this.height; x++) {
        for (var y = 0; y < this.width; y++) {
            var cell = this.fieldStates[x][y];
            var classes = cell.layers.map(function(el) {
                return 'tile' + el;
            }).join(' ');

            var div = document.createElement('div');
            div.className = classes;
            div.style.top = (30 * x) + 'px';
            div.style.left = (30 * y) + 'px';

            // Health-див для игрока или врага
            if ((cell.layers.indexOf('P') !== -1 || cell.layers.indexOf('E') !== -1)) {
                var healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                div.appendChild(healthDiv);
            }

            container.appendChild(div);
            cell.element = div;
        }
    }

};

Map.prototype.updateCell = function(x, y) {
    var cell = this.fieldStates[y][x];
    var classes = [];
    for (var i = 0; i < cell.layers.length; i++) {
        classes.push('tile' + cell.layers[i]);
    }
    cell.element.className = classes.join(' ');

    // health-див
    if (cell.layers.indexOf('P') !== -1 || cell.layers.indexOf('E') !== -1) {
        if (!cell.element.querySelector('.health')) {
            var healthDiv = document.createElement('div');
            healthDiv.className = 'health';
            cell.element.appendChild(healthDiv);
        }
    } else {
        var healthDiv = cell.element.querySelector('.health');
        if (healthDiv) cell.element.removeChild(healthDiv);
    }
};
