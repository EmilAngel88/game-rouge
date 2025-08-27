function Entities(map, game) {
    this.map = map;
    this.game = game;
    this.list = {}; // id → entity
    this.lastId = 0;
    this.kf = 5

    this.entitiesConfig = {
        'E': {
            count: 10,
            type: 'E',
            factory: () => ({
                id: this.nextId(),
                type: 'E',
                coords: [],
                hit: 1,
                health: 100
            }),
            controller: (entity) => this.initEnemyAI(entity)
        },
        'HP': {
            count: 10,
            type: 'HP',
            factory: () => ({
                id: this.nextId(),
                type: 'HP'
            }),
            applyEffect: healEffect
        },
        'P': {
            count: 1,
            type: 'P',
            factory: () => ({
                id: 'P', // игрок всегда один
                type: 'P',
                coords: [],
                health: 10,
                hit: 1
            }),
            controller: (entity) => this.initPlayerControls(entity)
        },
        'SW': {
            count: 2,
            type: 'SW',
            factory: () => ({
                id: this.nextId(),
                type: 'SW'
            }),
            applyEffect: swordEffect
        }
    };
}

// --- Универсальные методы ---
Entities.prototype.nextId = function() {
    return "ent_" + (++this.lastId);
};

// Передвижение сущности
Entities.prototype.tryMove = function (entity, toX, toY) {
    var map = this.map.fieldStates;
    if (!map[toY] || !map[toY][toX]) return null;

    var cell = map[toY][toX].layers;
    if (cell.includes('W') || cell.includes('E')) return null;

    return this.moveEntity(entity, entity.coords[1], entity.coords[0], toX, toY);
};

// Найти сущность по к-там
Entities.prototype.getEntityAt = function (x, y, type) {
    for (var id in this.list) {
        var ent = this.list[id];
        if (ent && ent.coords && ent.coords[0] === y && ent.coords[1] === x) {
            if (!type || ent.type === type) return ent;
        }
    }
    return null;
};

// Нанесение урона(уничтожение) сущности
Entities.prototype.damageEntity = function (entity, dmg) {
    entity.health -= dmg;
    if (entity.health <= 0) {
        this.removeEntityAt(entity.coords[1], entity.coords[0], entity.type);
        return { dead: true, entityId: entity.id, x: entity.coords[1], y: entity.coords[0] };
    }
    return { dead: false, entityId: entity.id, health: entity.health };
};

// Подбор предметов
Entities.prototype.pickUpItems = function (x, y, player) {
    var effectChanges = [];
    var cell = this.map.fieldStates[y][x].layers;
    for (var type in this.entitiesConfig) {
        if (this.entitiesConfig.hasOwnProperty(type) && this.entitiesConfig[type].applyEffect) {
            if (cell.includes(type)) {
                var res = this.applyEntities(x, y, type, player);
                if (res) effectChanges.push(res);
            }
        }
    }
    return effectChanges;
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


// --- Спавн сущностей ---
Entities.prototype.spawn = function() {
    for (var key in this.entitiesConfig) {
        var cfg = this.entitiesConfig[key];
        this.generateEntities(cfg);
    }
};

// Генерация состояний для сущностей
Entities.prototype.generateEntities = function(cfg) {
    let freeCells = this.getFreeCells();
    for (let i = 0; i < cfg.count; i++) {
        let entity = cfg.factory();
        let pos = Utils.getRandomFromArray(freeCells);

        entity.coords = [pos.y, pos.x];
        this.list[entity.id] = entity;

        this.map.fieldStates[pos.y][pos.x].layers.push(cfg.type);

        if (cfg.controller) {
            cfg.controller(entity);
        }
    }
};


// --- Логика игрока и врагов ---

// Поведение врага
Entities.prototype.initEnemyAI = function (entity) {
    let self = this;

    // У каждого врага будет свой интервал
    entity.aiTimer = setInterval(function() {
        // Проверяем, что враг ещё жив
        if (!self.list[entity.id]) {
            clearInterval(entity.aiTimer);
            return;
        }

        // Двигаем врага
        let changes = self.enemyActing(entity);
        if (changes) {
            self.game.applyChanges(changes);
        }

    }, Utils.getRandomInRange(800, 1500)); // каждому врагу разный темп (0.8–1.5 сек)
}

// Движение врага
Entities.prototype.enemyActing = function (enemy) {
    var y = enemy.coords[0], x = enemy.coords[1];

    // направление на игрока
    let player = this.list['P'];
    if (!player) return;

    var py = player.coords[0], px = player.coords[1];
    let dy = py - y;
    let dx = px - x;

    let stepY = 0, stepX = 0;

    // если игрок рядом → двигаемся к нему
    if (Math.abs(dx) + Math.abs(dy) <= 5) { // в радиусе "агро"
        if (Math.abs(dx) > Math.abs(dy)) {
            stepX = dx > 0 ? 1 : -1;
        } else {
            stepY = dy > 0 ? 1 : -1;
        }
    } else {
        // иначе случайное движение
        let dirs = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
        ];
        let rand = Utils.getRandomFromArray(dirs);
        stepX = rand.dx;
        stepY = rand.dy;
    }

    let newY = y + stepY;
    let newX = x + stepX;

    // проверка границ и стен
    let map = this.map.fieldStates;
    if (!map[newY] || !map[newY][newX]) return;
    let cell = map[newY][newX].layers;

    // если рядом игрок → атака
    if (cell.includes('P')) {
        var res = this.damageEntity(player, enemy.hit * this.kf);
        return { effects: [res] };
    }

    // нельзя идти в стену или на другого врага
    if (cell.includes('W') || cell.includes('E')) return;

    // Иначе двигаться
    var moveChanges = this.tryMove(enemy, newX, newY);
    return moveChanges ? { moves: [moveChanges] } : null;
};

// Инициализация поведения игрока
Entities.prototype.initPlayerControls = function (player) {
    var mapEl = document.querySelector('.field')
    mapEl.setAttribute('tabindex', '0');
    mapEl.focus();

    var self = this;
    function handler(e) {
        var keyCode = e.keyCode
        var changes = self.handlePlayerAction(player, keyCode)

        if (changes) self.game.applyChanges(changes)
    }

    mapEl.addEventListener('keydown', handler);
}

// Движения игрока
Entities.prototype.handlePlayerAction = function (player, keyCode) {
    let actions = {
        87: { dx: 0, dy: -1 },
        83: { dx: 0, dy: 1 },
        65: { dx: -1, dy: 0 },
        68: { dx: 1, dy: 0 },
        32: { attack: true }
    };
    let action = actions[keyCode];
    if (!action) return;

    if (action.attack) {
        this.attackPlayer(player)
        return;
    }

    var y = player.coords[0], x = player.coords[1];
    let newY = y + action.dy;
    let newX = x + action.dx;

    var moveChanges = this.tryMove(player, newX, newY);
    if (!moveChanges) return;

    var effectChanges = this.pickUpItems(newX, newY, player);
    return { moves: [moveChanges], effects: effectChanges };
};

// ⚔️ Атака игрока (Space)
Entities.prototype.attackPlayer = function (player) {
    var y = player.coords[0];
    var x = player.coords[1];
    var directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1] // 4 стороны
    ];

    var effects = [];
    var kills = [];

    for (var i = 0; i < directions.length; i++) {
        var ny = y + directions[i][0];
        var nx = x + directions[i][1];
        var enemy = this.getEntityAt(nx, ny, 'E');
        if (!enemy) continue;

        // наносим урон
        var res = this.damageEntity(enemy, player.hit * this.kf);
        if (res.dead) kills.push(res);
        else effects.push(res);
    }

    // собираем изменения, чтобы отдать в game.applyChanges
    if (effects.length || kills.length) {
        this.game.applyChanges({ effects: effects, kills: kills });
    }
};

// --- перемещение ---
Entities.prototype.moveEntity = function (entity, fromX, fromY, toX, toY) {
    // убрать из старой ячейки
    let oldCell = this.map.fieldStates[fromY][fromX].layers;
    this.map.fieldStates[fromY][fromX].layers = Utils.removeElementFromCell(oldCell, entity.type);

    // добавить в новую
    this.map.fieldStates[toY][toX].layers.push(entity.type);

    // обновляем координаты сущности
    entity.coords = [toY, toX];

    // возвращаем информацию о том, что изменилось
    return { fromX, fromY, toX, toY, entity };
};

// Применить эффект предмета
Entities.prototype.applyEntities = function (x, y, type, player) {
    var cfg = this.entitiesConfig[type];
    if (!cfg.applyEffect) return null;

    var applied = cfg.applyEffect(player); // изменит player.health
    if (!applied) return null;

    // предмет исчезает с клетки
    this.removeEntityAt(x, y, type);

    // сообщаем И о клетке (чтобы убрать иконку аптечки), И о новом HP
    return {
        x: x,
        y: y,
        entityId: player.id,   // "P"
        health: player.health  // новое значение
    };
};

// Удаление сущностей
Entities.prototype.removeEntityAt = function (x, y, type) {
    var cell = this.map.fieldStates[y][x].layers;
    this.map.fieldStates[y][x].layers = Utils.removeElementFromCell(cell, type);

    for (var id in this.list) {
        var ent = this.list[id];
        if (ent && ent.type === type && ent.coords[0] === y && ent.coords[1] === x) {
            delete this.list[id];
            break;
        }
    }
};

// восстановление ХP Игрока
function healEffect(player) {
    if (player.health >= 100) return false;
    player.health = Math.min(100, player.health + 50);
    return true;
}

// Усиление атаки Игрока
function swordEffect(player) {
    player.hit += 1;
    return true;
}
