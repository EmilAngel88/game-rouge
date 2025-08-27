// renderer.js
function Renderer(map, entities, container) {
    this.map = map;
    this.entities = entities;
    this.container = container;

    // Ссылки на DOM
    this.refs = {
        cells: [],       // [y][x] → div ячейки
        healthBars: {}   // entityId → div полоски здоровья
    };
}

// Отрисовать всю карту
Renderer.prototype.render = function() {
    var container = this.container;
    container.innerHTML = '';
    this.refs.cells = [];
    this.refs.healthBars = {};

    for (var y = 0; y < this.map.height; y++) {
        this.refs.cells[y] = [];

        for (var x = 0; x < this.map.width; x++) {
            var cell = this.map.fieldStates[y][x];
            var cellTypes = cell.layers;

            var div = document.createElement('div');
            div.className = cellTypes.map(function(t) { return 'tile' + t; }).join(' ');
            div.style.top = (30 * y) + 'px';
            div.style.left = (30 * x) + 'px';

            // Проверяем — есть ли сущность (игрок/враг)
            var entity = this.findEntityAt(x, y);
            if (entity && (entity.type === 'P' || entity.type === 'E')) {
                var healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.style.width = (entity.health || 0) + '%';
                div.appendChild(healthDiv);
                this.refs.healthBars[entity.id] = healthDiv;
            }

            container.appendChild(div);
            this.refs.cells[y][x] = div; // сохраняем ссылку на DOM
        }
    }
};

// Обновить одну клетку
Renderer.prototype.updateCell = function(x, y) {
    var cell = this.map.fieldStates[y][x];
    var div = this.refs.cells[y] && this.refs.cells[y][x];
    if (!div) return;

    // Классы тайлов
    div.className = cell.layers.map(function(t) { return 'tile' + t; }).join(' ');

    // Проверяем сущность
    var entity = this.findEntityAt(x, y);

    if (entity && (entity.type === 'P' || entity.type === 'E')) {
        var healthDiv = div.querySelector('.health');
        if (!healthDiv) {
            healthDiv = document.createElement('div');
            healthDiv.className = 'health';
            div.appendChild(healthDiv);
        }
        healthDiv.style.width = (entity.health || 0) + '%';
        this.refs.healthBars[entity.id] = healthDiv;
    } else {
        // если сущности нет → удалить полоску
        var oldHealth = div.querySelector('.health');
        if (oldHealth) div.removeChild(oldHealth);
    }
};

// ❤️ Обновляем здоровье по id
Renderer.prototype.updateHealth = function(entityId, health) {
    var el = this.refs.healthBars[entityId];
    if (el) {
        el.style.width = health + "%";
    }
};

// 🔎 Поиск сущности на координатах
Renderer.prototype.findEntityAt = function(x, y) {
    for (var id in this.entities.list) {
        var ent = this.entities.list[id];
        if (ent.coords && ent.coords[0] === y && ent.coords[1] === x) {
            return ent;
        }
    }
    return null;
};
