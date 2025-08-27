function GameMap(width, height, emptyCellRatio){
    this.width = width;
    this.height = height;
    this.emptyCellRatio = emptyCellRatio / 100;
    this.fieldStates = [];
}

GameMap.prototype.generate = function() {
    // 1. Создаём пустую матрицу слоёв
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

GameMap.prototype.fillWalls = function () {
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            this.fieldStates[i][j].layers.push('W');
        }
    }
};

GameMap.prototype.clearWall = function (cell) {
    return Utils.removeElementFromCell(cell.layers, 'W');
};

GameMap.prototype.generateRoomSizes = function(totalArea, roomNumber) {
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

GameMap.prototype.placeRooms = function(roomParameters) {
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

GameMap.prototype.generatePassages = function() {
    var vertical = [], horizontal = [];
    var verticalCount = Utils.getRandomInRange(3,5);
    var horizontalCount = Utils.getRandomInRange(3,5);

    for (var i= 0; i < verticalCount; i++) vertical.push(Utils.getRandomInRange(1,this.width-2));
    for (var j= 0; j < horizontalCount; j++) horizontal.push(Utils.getRandomInRange(1,this.height-2));

    return {vertical: vertical, horizontal: horizontal};
};

GameMap.prototype.applyPassages = function(passages) {
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

GameMap.prototype.applyRooms = function(roomsData) {
    var self = this;
    roomsData.forEach(function(room){
        for (var i = room.coords[1]; i < room.coords[1] + room.sides[1]; i++) {
            for (var j = room.coords[0]; j < room.coords[0] + room.sides[0]; j++) {
                self.fieldStates[i][j].layers = self.clearWall(self.fieldStates[i][j]);
            }
        }
    });
};
