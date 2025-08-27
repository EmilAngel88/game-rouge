function Game(options) {
    this.map = new GameMap(options.width, options.height, options.emptyCellRatio);
    this.entities = new Entities(this.map, this);
    this.renderer = new Renderer(this.map, this.entities, document.querySelector('.field'));
}

// game.js
Game.prototype.start = function() {
    this.init();
};

// Инициализация + рендер карты и сущностей
Game.prototype.init = function() {
    this.map.generate();
    this.entities.spawn();
    this.renderer.render();
};

// Универсальный метод применения изменений
Game.prototype.applyChanges = function(changes) {
    if (!changes) return;

    if (changes.moves && changes.moves.length) {
        for (var i = 0; i < changes.moves.length; i++) {
            var move = changes.moves[i];
            this.renderer.updateCell(move.fromX, move.fromY);
            this.renderer.updateCell(move.toX, move.toY);
        }
    }

    if (changes.effects && changes.effects.length) {
        // теперь обновляем hp у игрока
        for (var j = 0; j < changes.effects.length; j++) {
            var effect = changes.effects[j];
            if (effect && effect.entityId && effect.health !== undefined) {
                this.renderer.updateHealth(effect.entityId, effect.health);
            }
        }
    }

    // 💀 убираем убитых врагов
    if (changes.kills && changes.kills.length) {
        for (var k = 0; k < changes.kills.length; k++) {
            var kill = changes.kills[k];
            this.renderer.updateCell(kill.x, kill.y);
        }
    }
};
