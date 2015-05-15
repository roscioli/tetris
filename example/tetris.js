window.onload = function() {

    // -------------- INSTANCE VARIABLES --------------

    var boardWidth = 10;
    var boardHeight = 14;
    var maxPieceHeight = 2;
    var time = Date.now();
    var timeoutIncrement = 1100;
    var incrementalSpeedup = 50;
    var steps = 0;
    var paused = false;
    var gameOver = false;
    var score = 0;
    var lines = 0;
    var level = 1;
    var numberOfLinesBeforeNextLevel = 1;

    var matrix = [];

    var Coordinate = function(y, x) {
        this.y = y;
        this.x = x;
    };

    var piece = {
        x: 0,
        y: 0,
        color: "",
        coordinates: []
    };

    var PIECES = {
        square: [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(1,0), new Coordinate(1,1)],
        rightL: [new Coordinate(1,0), new Coordinate(1,1) ,new Coordinate(1,2), new Coordinate(0,2)],
        rightS: [new Coordinate(0,0), new Coordinate(0,1) ,new Coordinate(1,1), new Coordinate(1,2)],
        leftL:  [new Coordinate(0,0), new Coordinate(1,0), new Coordinate(1,1), new Coordinate(1,2)],
        leftS:  [new Coordinate(1,0), new Coordinate(1,1) ,new Coordinate(0,1), new Coordinate(0,2)],
        line:   [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(0,2), new Coordinate(0,3)]
    };

    var STATIONARY_PIECE_MARKER = 1;
    var COMPLETE_ROW_MARKER = -1;
    var MOVING_PIECE_MARKER = "*";

    // -------------- INITIALIZER METHODS --------------

    var loadEmptyBoard = function() {
        matrix = [];
        for(var y = 0; y < boardHeight; y++) {
            matrix.push(getAFreshRow());
        }
    };

    var getAFreshRow = function(_marker) {
        var row = [];
        var marker = !!_marker ? _marker : 0;
        for(var i = 0; i < boardWidth; i++) {
            row.push(marker);
        }
        return row;
    };

    var initializeEventHandlers = function() {
        document.onkeydown = function(e) {
            e = e || window.event;

            if(paused) {
                setPause(false);
                return;
            }

            switch (e.keyCode) {
                case 37:
                    movePieceLeft();
                    break;
                case 38:
                    rotatePiece();
                    break;
                case 39:
                    movePieceRight();
                    break;
                case 40:
                    movePieceFasterDownwards();
                    break;
                case 32:
                    dropPiece();
                    break;
                default :
                    setPause(true);
            }
        };
    };

    // -------------- BOARD VALIDATION METHODS --------------

    var topRowHasAStationaryPiece = function() {
        return matrix[0].contains(STATIONARY_PIECE_MARKER);
    };

    // -------------- BOARD UPKEEP: ROW DELETION METHODS --------------

    Array.prototype.last = function() {
        return this[this.length - 1];
    };

    Array.prototype.contains = function(x) {
        return this.indexOf(x) >= 0;
    };

    var isACompleteRow = function(row) {
        return !row.contains(0);
    };

    var isAnEmptyRow = function(row) {
        return row.every(function(x) { return x === 0; })
    };

    var getNumberOfCompletedRows = function() {
        return matrix.reduce(function(prev, row) { return prev + (isACompleteRow(row) ? 1 : 0) }, 0);
    };
    
    var removeCompletedRows = function() {
        var newMatrixPrefix = [];
        var newMatrix = [];
        for(var i = matrix.length - 1; i >= 0; i--) {
            var row = matrix[i];
            isACompleteRow(row) ?
                newMatrixPrefix.push(getAFreshRow())
                : newMatrix.unshift(row);
        }
        matrix = newMatrixPrefix.concat(newMatrix);
        CanvasDrawer.renderMatrix();
    };

    // -------------- GAME UPKEEP: SCORE & LEVEL METHODS --------------

    var updateScore = function() {
        var SCORES = [0, 40, 100, 300, 1200];
        var numberOfCompletedRows = getNumberOfCompletedRows();
        score += SCORES[numberOfCompletedRows] * getLevel();
        lines += numberOfCompletedRows;
        console.log("score: " + score);
    };

    var getLevel = function() {
        return Math.floor(lines / numberOfLinesBeforeNextLevel) + 1;
    };

    var updateLevel = function() {
        var newlyCalculatedLevel = getLevel();
        if(newlyCalculatedLevel > level) {
            level = newlyCalculatedLevel;
            timeoutIncrement -= incrementalSpeedup;
            console.log("  level: " + level);
            console.log("timeout: " + timeoutIncrement);
        }
    };

    // -------------- PIECE GENERATION, TRANSFORMATION, & DESTRUCTION METHODS --------------

    var generateNextPiece = function() {
        piece.y = 0;
        var possibilities = Object.keys(PIECES);
        piece.coordinates = PIECES[possibilities[Math.floor(Math.random() * possibilities.length)]];
        var pieceWidth = piece.coordinates.reduce(function(prev, curr) { return Math.max(prev, curr.x); }, 0);
        piece.x = Math.floor((boardWidth - pieceWidth) / 2);
        drawPiece();
    };

    var renderPiece = function(action) {
        if(action === "clear") {
            var matrixMarker = 0;
            CanvasDrawer.clearPiece();
        } else {
            var matrixMarker = MOVING_PIECE_MARKER;
            CanvasDrawer.drawPiece("#ffffff");
        }
        var matrixMarker = action === "clear" ? 0 : MOVING_PIECE_MARKER;
        for(var i = 0; i < piece.coordinates.length; i++) {
            var coordinate = piece.coordinates[i];
            try {
                matrix[piece.y + coordinate.y][piece.x + coordinate.x] = matrixMarker;
            } catch(e) {
                console.log(action);
                console.log("piece.y + coordinate.y: " + (piece.y + coordinate.y));
                console.log("piece.x + coordinate.x: " + (piece.x + coordinate.x));
                console.log(JSON.stringify(piece));
            }
        }
    };

    var clearPiece = function() {
        renderPiece("clear");
    };

    var drawPiece = function() {
        renderPiece("draw");
    };

    var convertMovingPieceToStationaryPiece = function() {
        for(var i = 0; i < piece.coordinates.length; i++) {
            matrix[piece.coordinates[i].y + piece.y][piece.coordinates[i].x + piece.x] = STATIONARY_PIECE_MARKER;
        }
    };

    // -------------- PIECE ROTATION METHODS --------------

    var copyPieceCoordinates = function() {
        var copy = [];
        for(var i = 0; i < piece.coordinates.length; i++) {
            var coord = piece.coordinates[i];
            copy.push(new Coordinate(coord.y, coord.x));
        }
        return copy;
    };

    var rotatePiece = function() {
        var rotatedPiece = copyPieceCoordinates();
        rotatedPiece = rotatedPiece.map(function(coord) { return new Coordinate(0 - coord.x, coord.y) });
        var yOffset = piece.coordinates.reduce(function(prev, curr) {
            return new Coordinate(null, Math.max(prev.x, curr.x))
        }, piece.coordinates[0]).x;
        rotatedPiece = rotatedPiece.map(function(coord) { return new Coordinate(coord.y + yOffset, coord.x) });
        if(rotatedPiece.every(function(coord) { return !spaceAtCoordinatesHasBlockingElement(coord.y + piece.y, coord.x + piece.x) })) {
            clearPiece();
            piece.coordinates = rotatedPiece;
            drawPiece();
        }
    };

    // -------------- PIECE MOVEMENT METHODS --------------

    var movePieceDownwards = function() {
        clearPiece();
        piece.y++;
        drawPiece();
    };

    var movePieceLeft = function() {
        if(!pieceHasReachedAnEnd("left")) {
            clearPiece();
            piece.x--;
            drawPiece();
        }
    };

    var movePieceRight = function() {
        if(!pieceHasReachedAnEnd("right")) {
            clearPiece();
            piece.x++;
            drawPiece();
        }
    };

    var movePieceFasterDownwards = function() {
        if(!pieceHasReachedAnEnd("bottom")) {
            clearPiece();
            piece.y++;
            drawPiece();
        }
    };

    var dropPiece = function() {
        while(!pieceHasReachedAnEnd("bottom")) {
            clearPiece();
            piece.y++;
            drawPiece();
        }
    };

    // -------------- PIECE VALIDATION METHODS --------------

    var pieceHasReachedAnEnd = function(sideToCheck) {
        if(sideToCheck === "right") {
            var mapper = function(coordinate) { return new Coordinate(coordinate.y, coordinate.x + 1) };
        } else if(sideToCheck === "left") {
            mapper = function(coordinate) { return new Coordinate(coordinate.y, coordinate.x - 1) };
        } else if(sideToCheck === "bottom") {
            mapper = function(coordinate) { return new Coordinate(coordinate.y + 1, coordinate.x) };
        }

        var coordinatesToCheck = piece.coordinates.map(mapper);
        for(var i = 0; i < coordinatesToCheck.length; i++) {
            var x = coordinatesToCheck[i].x + piece.x;
            var y = coordinatesToCheck[i].y + piece.y;
            if(spaceAtCoordinatesHasBlockingElement(y, x)) return true;
        }

        return false;
    };

    // -------------- SPACE VALIDATION METHODS --------------

    var spaceAtCoordinatesHasBlockingElement = function(y, x) {
        console.log(y);
        return x < 0 || x >= boardWidth || y >= matrix.length || matrix[y][x] === STATIONARY_PIECE_MARKER;
    };

    // -------------- PAUSE FUNCTIONALITY METHODS --------------

    var setPause = function(toPauseOrNotToPause) {
        paused = toPauseOrNotToPause;
    };

    // -------------- DRAWING METHODS --------------

    var _CanvasDrawer = function() {

        var blockSize = 30;
        var canvas = document.getElementById("canvas");
        canvas.width = blockSize * boardWidth;
        canvas.height = blockSize * (boardHeight);
        window.context = canvas.getContext("2d");
        var backgroundColor = "#000000";
        var pieceColor = "rebeccapurple"

        var getPieceColor = function() {
            return pieceColor;
        };

        this.initializeCanvas = function() {
            window.context.fillStyle = backgroundColor;
            window.context.fillRect(0, 0, canvas.width, canvas.height);
        };

        this.drawPiece = function(clearOrDraw) {

            if(clearOrDraw === "clear") {
                window.context.fillStyle = backgroundColor;
            } else {
                window.context.fillStyle = getPieceColor();
            }

            for(var i = 0; i < piece.coordinates.length; i++) {
                var x = (piece.x + piece.coordinates[i].x) * blockSize;
                var y = (piece.y + piece.coordinates[i].y) * blockSize;
                window.context.fillRect(x, y, blockSize, blockSize);
            }
        };

        this.clearPiece = function() {
            this.drawPiece("clear");
        };

        this.renderMatrix = function() {
            for(var y = 0; y < boardHeight; y++) {
                for(var x = 0; x < boardWidth; x++) {
                    switch(matrix[y][x]) {
                        case STATIONARY_PIECE_MARKER:
                            window.context.fillStyle = getPieceColor();
                            break;
                        default:
                            window.context.fillStyle = backgroundColor;
                    }
                    window.context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                };
            }
        };
    };

    var CanvasDrawer = new _CanvasDrawer();

    // -------------- GAME METHODS --------------

    var game = function() {
       window.setTimeout(function() {
            if(!paused) {
                if(gameOver) return;
                time = Date.now();
                if(pieceHasReachedAnEnd("bottom") && steps !== 0) {
                    convertMovingPieceToStationaryPiece();
                    updateScore();
                    updateLevel();
                    removeCompletedRows();
                    if(topRowHasAStationaryPiece()) {
                        gameOver = true;
                        return;
                    }
                    generateNextPiece();
                } else {
                    movePieceDownwards();
                }
                steps++;
            }
           game();
       }, timeoutIncrement);
    };

    window.game = game;

    var startGame = function() {
        CanvasDrawer.initializeCanvas();
        loadEmptyBoard();
        initializeEventHandlers();
        generateNextPiece();
        game();
    };

    startGame();
};