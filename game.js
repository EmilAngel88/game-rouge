function Game(options) {
    this.map = new Map(options.width, options.height, options.emptyCellRatio);
    this.entities = new Entities(this.map);
}

Game.prototype.init = function () {
    this.map.generate();
    this.entities.spawn();
    this.map.render(document.querySelector('.field'));
};
