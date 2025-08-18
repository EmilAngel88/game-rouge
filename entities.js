function Entities(map) {
    this.map = map;

    this.entitiesConfig = {
        'E': {
            count: 10,
            type: 'E',
            options: {
                id: null,
                coords: [],
                hit: 1,
                health: 100,
                controller: function (options) {this.initEnemyAI(options)}
            },
            createState: function (type, options) {this.createEnemiesState(type, options)}
        },
        'HP': {
            count: 10,
            type: 'HP',
        },
        'P': {
            count: 1,
            type: 'P',
            options: {
                coords: [],
                health: 100,
                hit: 1,
                controller: function (options, type) {this.initPlayerControls(options, type)},
                actions: function (key) {this.movePlayer(key)},
            },
            createState: function (type, options) {this.createPlayerState(type, options)}
        },
        'SW': {
            count: 2,
            type: 'SW',
        }
    };
}

// Спавн сущностей
Entities.prototype.spawn = function() {
    for (var key in this.entitiesConfig) {
        var cfg = this.entitiesConfig[key];
        this.generateEntities(cfg);
    }
};

Entities.prototype.generateEntities = function(cfg) {
    var freeCells = this.getFreeCells();
    var options = cfg.options
    var count = cfg.count
    var type = cfg.type

    for (var i = 0; i < count; i++) {
        // Создаём состояние сущности
        this.createEntitiesState(cfg)

        // Добавляем на карту
        var pos = Utils.getRandomFromArray(freeCells);
        this.map.fieldStates[pos.y][pos.x].layers.push(type);
        if (type === 'P') {
            this[type].coords = [pos.y, pos.x]
        }

        // Назначаем поведение
        if (options) this.createEntitiesAction(options, type)
    }
};

// Получение свободных клеток
Entities.prototype.getFreeCells = function () {
    var freeCells = [];

    for (var y = 0; y < this.map.height; y++) {
        for (var x = 0; x < this.map.width; x++) {
            var cell = this.map.fieldStates[y][x].layers;
            // свободная клетка = нет стен, нет сущностей
            if (cell.length === 1 && cell[0] === '') {
                freeCells.push({x: x, y: y});
            }
        }
    }

    return freeCells;
};

// Создаём состояние сущности
Entities.prototype.createEntitiesState = function (config) {
    var createState = config.createState
    if (!createState) return

    var type = config.type
    var options = config.options

    if (createState && typeof createState === 'function') {
        createState.call(this, type, options);
    }
}

// Запускаем поведение (если есть)
Entities.prototype.createEntitiesAction = function (options, type) {
    var controller = options.controller
    if (controller && typeof controller === 'function') {
        controller.call(this, options, type);
    }
}

// Поведение врага
Entities.prototype.initEnemyAI = function (options) {
    // console.log('initEnemyAI')
    // console.log(options)

}

// Поведение игрока
Entities.prototype.initPlayerControls = function (options, type) {
    var map = document.querySelector('.field')
    map.setAttribute('tabindex', '0');
    map.focus();

    var self = this;
    function handler(e) {
        var keyCode = e.keyCode
        var action = self.entitiesConfig[type].options.actions

        if (action && typeof action === 'function') {
            action.call(self, keyCode);
        }
    }

    map.addEventListener('keydown', handler);
}

// createPlayerState
Entities.prototype.createPlayerState = function (type, options) {
    this[type] = JSON.parse(JSON.stringify(options));
}

// createEnemiesState
Entities.prototype.createEnemiesState = function (type, options) {
    if (!this[type]) this[type] = [];
    this[type].push(JSON.parse(JSON.stringify(options)));
}

// Перемещение персонажа
Entities.prototype.movePlayer = function (key) {
    var player = this['P'];
    var self = this;
    var y = player.coords[0];
    var x = player.coords[1];

    var actions = {
        87: { dx: 0, dy: -1 },
        83: { dx: 0, dy: 1 },
        65: { dx: -1, dy: 0 },
        68: { dx: 1, dy: 0 },
        32: { attack: true }
    };

    var action = actions[key];
    if (!action) return;

    if (action.attack) {
        console.log('Игрок атакует')
        return;
    }

    // новое положение
    var newY = y + action.dy;
    var newX = x + action.dx;
    var map = this.map.fieldStates;

    if (!map[newY] || !map[newY][newX]) return;

    var cell = map[newY][newX].layers;

    if (cell.indexOf('W') !== -1 || cell.indexOf('E') !== -1) return;

    this.moveEntities('P', x, y, newX, newY)
    player.coords = [newY, newX];

    ['HP', 'SW'].forEach(function(el) {
        if (cell.indexOf(el) !== -1) {
            self.applyEntities(newX, newY, el)
        }
    });
}

// Перемещение сущности
Entities.prototype.moveEntities = function (type, fromX, fromY, toX, toY) {
    var oldCell = this.map.fieldStates[fromY][fromX].layers
    // убрать type из старой ячейки
    this.map.fieldStates[fromY][fromX].layers = Utils.removeElementFromCell(oldCell, type);
    this.map.updateCell(fromX, fromY);

    // добавить type в новую ячейку
    this.map.fieldStates[toY][toX].layers.push(type);
    this.map.updateCell(toX, toY);
}

Entities.prototype.applyEntities = function (x, y, type) {
    // Применение подобранного предмета
    // ...

    // Удаление предмета из матрицы и с поля
    this.removeEntityAt(x, y, type)
}

// Удаление сущностей
Entities.prototype.removeEntityAt = function (x, y, type) {
    var cell = this.map.fieldStates[y][x].layers;
    this.map.fieldStates[y][x].layers = Utils.removeElementFromCell(cell, type);
    this.map.updateCell(x, y);
};
