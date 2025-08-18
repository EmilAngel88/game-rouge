// utils.js — набор вспомогательных функций
var Utils = (function() {

    // Рандомное число (целое/дробное)
    function getRandomInRange(min, max, float) {
        var num = Math.random() * (max - min) + min;
        return float
            ? Math.round(num * 10) / 10
            : Math.floor(num);
    }

    // Перемешивание массива
    function shuffleArray(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    // Создание матрицы
    function createMatrix(h, w, filler) {
        return Array.apply(null, Array(h)).map(function () {
            return Array.apply(null, Array(w)).map(function () {
                return filler();
            });
        });
    }

    // Рандомные координаты в пределах ограниченной области
    function getRandomCoordsInRange(maxW, maxH) {
        return {
            x: this.getRandomInRange(0, maxW - 1),
            y: this.getRandomInRange(0, maxH - 1)
        };
    }

    // Рандомный элемент из массива (с удалением)
    function getRandomFromArray(arr) {
        var idx = Math.floor(Math.random() * arr.length);
        return arr.splice(idx, 1)[0];
    }

    // Удаляет элемент с поля
    function removeElementFromCell(cell, elementToRemove) {
        return cell.filter(function(el) {
            return el !== elementToRemove;
        });
    }

    return {
        getRandomInRange: getRandomInRange,
        shuffleArray: shuffleArray,
        createMatrix: createMatrix,
        getRandomCoordsInRange: getRandomCoordsInRange,
        getRandomFromArray: getRandomFromArray,
        removeElementFromCell: removeElementFromCell,
    };

})();
