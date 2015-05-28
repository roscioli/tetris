window.onload = function() {

    // -------------- INSTANCE VARIABLES --------------

    var Game = {};

    var Coordinate = function(y, x) {
        this.y = y;
        this.x = x;
    };

    var Piece = function(piece) {
        if(!piece) {
            this.x = 0;
            this.y = 0;
            this.color = "";
            this.coordinates = [];
            this.next = null;
            this.locked = false;
        } else {
            this.x = piece.x;
            this.y = piece.y;
            this.color = piece.color;
            this.coordinates = piece.coordinates;
            this.next = piece.next;
            this.locked = piece.locked;
        }
    };

    var PIECES = [
        {
            coordinates: [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(1,0), new Coordinate(1,1)],
            color: "#4F3"
        },{
            coordinates: [new Coordinate(1,0), new Coordinate(1,1), new Coordinate(1,2), new Coordinate(0,2)],
            color: "#8CC"
        },{
            coordinates: [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(1,1), new Coordinate(1,2)],
            color: "#161"
        },{
            coordinates: [new Coordinate(0,0), new Coordinate(1,0), new Coordinate(1,1), new Coordinate(1,2)],
            color: "#309"
        },{
            coordinates: [new Coordinate(1,0), new Coordinate(1,1), new Coordinate(0,1), new Coordinate(0,2)],
            color: "#F4A"
        },{
            coordinates: [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(0,2), new Coordinate(0,3)],
            color: "#5A2"
        },{
            coordinates: [new Coordinate(0,0), new Coordinate(0,1), new Coordinate(0,2), new Coordinate(1,1)],
            color: "#39B"
        }
    ];

    var MOVING_PIECE_MARKER = "*";

    var MOVEMENT = {
        down: { axis: "y", addition: 1},
        right: { axis: "x", addition: 1},
        left: { axis: "x", addition: -1}
    };

    // -------------- DOM ACCESSOR METHODS --------------

    var getTetris = function() {
        return document.getElementById("tetris");
    };

    var getMessage = function() {
        return document.getElementById("message");
    };

    // -------------- GAME INITIALIZER METHODS --------------


    var initializeGameVariables = function() {
        Game = {
            boardWidth: 10,
            boardHeight: 16,
            time: Date.now(),
            timeout: 1000,
            levelSpeedup: 50,
            steps: 0,
            paused: false,
            gameOver: false,
            score: 0,
            lines: 0,
            level: 1,
            linesPerLevel: 4,
            matrix: [],
            piece: new Piece(),
            timeForNextGame: false,
            message: []
        };
    };

    initializeGameVariables();

    var loadEmptyBoard = function() {
        Game.matrix = [];
        for(var y = 0; y < Game.boardHeight; y++) {
            Game.matrix.push(getAFreshRow());
        }
    };

    var getAFreshRow = function(_marker) {
        var row = [];
        var marker = !!_marker ? _marker : 0;
        for(var i = 0; i < Game.boardWidth; i++) {
            row.push(marker);
        }
        return row;
    };

    //  -------------- EVENT HANDLER METHODS --------------

    var EVENT_HANDLERS = {
        handlers: [{
            keyCode: 32,
            gesture: "press",
            preventDefault: true,
            action: function() { dropPiece(); },
            element: getTetris()
        },{
            keyCode: 37,
            gesture: "panleft",
            preventDefault: true,
            action: function() { movePiece(MOVEMENT.left); },
            element: getTetris()
        },{
            keyCode: 38,
            gesture: "tap",
            preventDefault: true,
            action: function() {
                if(Game.gameOver && !!Game.timeForNextGame) {
                    startGame();
                    clearMessage();
                    return;
                }
                rotatePiece();
            },
            element: getTetris()
        },{
            keyCode: 39,
            gesture: "panright",
            preventDefault: true,
            action: function() { movePiece(MOVEMENT.right); },
            element: getTetris()
        },{
            keyCode: 40,
            gesture: "pandown",
            preventDefault: true,
            action: function() { movePiece(MOVEMENT.down); },
            element: getTetris()
        }],
        default: {
            keyCode: "default",
            gesture: "pinch",
            action: function() { togglePause(); },
            element: document.body
        }
    };

    var handleValidGameKeypress = function(e, isGesture) {
        var handler = EVENT_HANDLERS.handlers.filter(function(h) { return h.keyCode === e.keyCode; })[0];
        if(!!handler) {
            if(!!handler.preventDefault) e.preventDefault();
            handler.action();
        } else {
            EVENT_HANDLERS.default.action();
        }
    };

    var initializeEventHandlers = function() {
        document.onkeydown = function(e) {
            e = e || window.event;
            if(Game.paused) {
                setPause(false);
                return;
            }
            if(Game.gameOver && !!Game.timeForNextGame) {
                startGame();
                clearMessage();
                return;
            }
            handleValidGameKeypress(e);
        };
        EVENT_HANDLERS.handlers.forEach(function(handler) {
            createGestureHandler(handler);
        });
        createGestureHandler(EVENT_HANDLERS.default);
    };

    var createGestureHandler = function(handler) {
        var timeIntervalForGesture = 90;
        (new Hammer(handler.element)).on(handler.gesture, function(event) {
            var now = Date.now();
            if((!!handler.timeLastExecuted && now - handler.timeLastExecuted > timeIntervalForGesture)
                || !handler.timeLastExecuted) {
                handler.timeLastExecuted = now;
                handler.action();
            }
        });
    };

    // -------------- BOARD VALIDATION METHODS --------------

    var topRowHasAStationaryPiece = function() {
        return Game.matrix[0].some(spaceIsABlock);
    };

    // -------------- BOARD UPKEEP: ROW DELETION METHODS --------------

    var isACompleteRow = function(row) {
        return !row.contains(0);
    };

    var isAnEmptyRow = function(row) {
        return row.every(function(x) { return x === 0; })
    };

    var getNumberOfCompletedRows = function() {
        return Game.matrix.reduce(function(prev, row) { return prev + (isACompleteRow(row) ? 1 : 0) }, 0);
    };

    var removeCompletedRows = function() {
        var newMatrixPrefix = [];
        var newMatrix = [];
        for(var i = Game.matrix.length - 1; i >= 0; i--) {
            var row = Game.matrix[i];
            isACompleteRow(row) ?
                newMatrixPrefix.push(getAFreshRow())
                : newMatrix.unshift(row);
        }
        Game.matrix = newMatrixPrefix.concat(newMatrix);
        gameCanvas.renderMatrix();
    };

    // -------------- GAME UPKEEP: SCORE & LEVEL METHODS --------------

    var showScore = function() {
        document.getElementById("score").innerHTML = "zen: " + Game.score;
    };

    var updateScore = function() {
        var SCORES = [0, 40, 100, 300, 1200];
        var numberOfCompletedRows = getNumberOfCompletedRows();
        Game.score += SCORES[numberOfCompletedRows] * getLevel();
        Game.lines += numberOfCompletedRows;
    };

    var getLevel = function() {
        return Math.floor(Game.lines / Game.linesPerLevel) + 1;
    };

    var getTimeout = function() {
        return Math.max(Game.timeout - ((Game.level - 1) * Game.levelSpeedup), Game.levelSpeedup);
    };

    var updateLevel = function() {
        var newlyCalculatedLevel = getLevel();
        if(newlyCalculatedLevel > Game.level) {
            Game.level = newlyCalculatedLevel;
            console.log("level: " + Game.level);
            console.log("timeout: " + getTimeout());
        }
    };

    // -------------- PIECE GENERATION, TRANSFORMATION, & DESTRUCTION METHODS --------------

    var generateNextPiece = function() {
        Game.piece = new Piece(Game.piece.next);
        if(!Game.piece.next) Game.piece.next = new Piece();
        var index = Math.floor(Math.random() * PIECES.length);
        Game.piece.next.coordinates = PIECES[index].coordinates;
        Game.piece.next.color = PIECES[index].color;
        nextCanvas.renderNextPiece(Game.piece.next);
        var width = getMaxXOfCoordinates(Game.piece.next.coordinates);
        var height = getMaxYOfCoordinates(Game.piece.next.coordinates);
        Game.piece.next.y = 0 - height;
        Game.piece.next.x = Math.floor((Game.boardWidth - width) / 2);
        drawPiece();
    };

    var generateFirstPiece = function() {
        generateNextPiece();
        generateNextPiece();
    };

    var renderPiece = function(render) {
        if(!render) { var matrixMarker = 0; } 
        else { var matrixMarker = MOVING_PIECE_MARKER; }
        gameCanvas.renderPiece(Game.piece, !!render);
        var matrixMarker = !render ? 0 : MOVING_PIECE_MARKER;
        for(var i = 0; i < Game.piece.coordinates.length; i++) {
            var coord = Game.piece.coordinates[i];
            if(Game.piece.y + coord.y < 0) continue;
            Game.matrix[Game.piece.y + coord.y][Game.piece.x + coord.x] = matrixMarker;
        }
    };

    var clearPiece = function() { renderPiece(false); };

    var drawPiece = function() { renderPiece(true); };

    var convertMovingPieceToStationaryPiece = function() {
        Game.piece.coordinates.forEach(function(coord) {
            if(Game.piece.y + coord.y < 0) return;
            Game.matrix[coord.y + Game.piece.y][coord.x + Game.piece.x] = Game.piece.color;
        });
    };

    // -------------- PIECE ROTATION METHODS --------------

    var rotatePiece = function() {
        if(Game.piece.locked || Game.paused) return;
        var origHeight = getMaxYOfCoordinates(Game.piece.coordinates);
        var origWidth = getMaxXOfCoordinates(Game.piece.coordinates);
        var maxDim = Math.max(origWidth, origHeight);
        var rotatedPiece = {
            coordinates: Game.piece.coordinates.map(function(coord) {
                return new Coordinate(0 - coord.x, coord.y)
            }),
            x: Game.piece.x// + Math.floor(maxDim / 2)
        };
        rotatedPiece.coordinates = rotatedPiece.coordinates.map(function(coord) {
            return new Coordinate(coord.y + origWidth, coord.x)
        });
        while(rotatedPiece.x + origHeight >= Game.boardWidth) rotatedPiece.x--;
        var everyCoordinateIsValidAfterRotation = rotatedPiece.coordinates.every(function(coord) {
            return !spaceIsOffLimits(coord.y + Game.piece.y, coord.x + rotatedPiece.x)
        });
        if(everyCoordinateIsValidAfterRotation) {
            clearPiece();
            Game.piece.x = rotatedPiece.x;
            Game.piece.coordinates = rotatedPiece.coordinates;
            drawPiece();
        }
    };

    // -------------- PIECE MOVEMENT METHODS --------------

    var movePiece = function(movement) {
        if(Game.piece.locked || Game.paused) return;
        if(!pieceHasReachedAnEnd(movement)) {
            clearPiece();
            Game.piece[movement.axis] += movement.addition;
            drawPiece();
        }
    };

    var dropPiece = function() {
        if(Game.paused) return;
        while(!pieceHasReachedAnEnd(MOVEMENT.down)) {
            clearPiece();
            Game.piece.y++;
            drawPiece();
        }
        Game.piece.locked = true;
    };

    // -------------- PIECE QUERYING METHODS --------------

    var pieceHasReachedAnEnd = function(movement) {
        return Game.piece.coordinates.some(function(coord) {
            var x = coord.x + Game.piece.x + (movement.axis === "x" ? movement.addition : 0);
            var y = coord.y + Game.piece.y + (movement.axis === "y" ? movement.addition : 0);
            return spaceIsOffLimits(y, x);
        });
    };

    // -------------- COORDINATE QUERYING METHODS --------------

    var getMaxDimensionOfCoordinates = function(coordinates, axis) {
        return coordinates.reduce(function(prev, curr) { return Math.max(prev, curr[axis]); }, 0);
    };

    var getMaxXOfCoordinates = function(coordinates) {
        return getMaxDimensionOfCoordinates(coordinates, "x");
    };

    var getMaxYOfCoordinates = function(coordinates) {
        return getMaxDimensionOfCoordinates(coordinates, "y");
    };

    // -------------- SPACE QUERYING METHODS --------------

    var spaceIsOffLimits = function(y, x) {
        return x < 0 || x >= Game.boardWidth || y >= Game.boardHeight 
                || (y >= 0 && spaceIsABlock(Game.matrix[y][x]));
    };

    var spaceIsABlock = function(space) {
        return space !== MOVING_PIECE_MARKER && space !== 0;
    };

    // -------------- PAUSE FUNCTIONALITY METHODS --------------

    var setPause = function(toPauseOrNotToPause) {
        Game.paused = toPauseOrNotToPause;
    };

    var togglePause = function() {
        Game.paused = !Game.paused;
    };

    // -------------- DRAWING METHODS --------------

    var Canvas = function(params) {

        if(!params) params = {};

        var blockSize = 28;
        var canvas = document.getElementById(params.htmlId);
        canvas.width = blockSize * Game.boardWidth;
        canvas.height = blockSize * Game.boardHeight;
        var context = canvas.getContext("2d");
        var backgroundColor = (params.backgroundColor || "#000");
        var that = this;

        var getPieceColor = function() {
            return Game.piece.color;
        };

        var getSpaceColor = function(y, x) {
            var space = Game.matrix[y][x];
            return spaceIsABlock(space) ? space : backgroundColor;
        };

        this.initializeCanvas = function() {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        };

        this.renderNextPiece = function() {
            canvas.width = (getMaxXOfCoordinates(Game.piece.next.coordinates) + 1) * blockSize;
            canvas.height = (getMaxYOfCoordinates(Game.piece.next.coordinates) + 1) * blockSize;
            that.initializeCanvas();
            that.renderPiece(Game.piece.next, true);
        };

        this.hide = function() {
            canvas.width = 0;
            canvas.height = 0;
        }

        this.renderPiece = function(piece, render) {

            !render ? context.fillStyle = backgroundColor
                : context.fillStyle = piece.color;

            piece.coordinates.forEach(function(coord) {
                var x = (piece.x + coord.x) * blockSize;
                var y = (piece.y + coord.y) * blockSize;
                context.fillRect(x, y, blockSize, blockSize);
            });
        };

        this.renderMatrix = function() {
            for(var y = 0; y < Game.boardHeight; y++) {
                for(var x = 0; x < Game.boardWidth; x++) {
                    context.fillStyle = getSpaceColor(y, x);
                    context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                };
            }
        };
    };

    var gameCanvas = new Canvas({htmlId: "tetris"});
    var nextCanvas = new Canvas({
        htmlId: "next", 
        backgroundColor: "#FFF"
    });

    // -------------- GAME METHODS --------------

    var game = function() {
        showScore();
        window.setTimeout(function() {
            if(!Game.paused) {
                if(Game.gameOver) return;
                Game.time = Date.now();
                if(pieceHasReachedAnEnd(MOVEMENT.down) && Game.steps !== 0) {
                    convertMovingPieceToStationaryPiece();
                    updateScore();
                    updateLevel();
                    removeCompletedRows();
                    if(topRowHasAStationaryPiece()) {
                        Game.gameOver = true;
                        Game.timeForNextGame = false;
                        alertUserOfGameOver();
                        return;
                    }
                    generateNextPiece();
                } else {
                    movePiece(MOVEMENT.down);
                }
                Game.steps++;
            }
            game();
        }, getTimeout());
    };

    var initializeGame = function() {
        initializeGameVariables();
        gameCanvas.initializeCanvas();
        loadEmptyBoard();
        initializeEventHandlers();
    };

    var startGame = function() {
        initializeGame();
        generateFirstPiece();
        game();
    };

    initializeGame();
    startGame();

    window.Game = Game;

    var alertUserOfGameOver = function() {
        appendToMessage("Game over.");
        if(storeNewHighScore(Game.score)) {
            appendToMessage("Highest zen achieved.");
        } else if(storeNewTopScore(Game.score)) {
            appendToMessage("Nice zen.");
        }
        nextCanvas.hide();
        window.setTimeout(promptUserForNewGame, 1000);
    };

    // -------------- MESSAGE SET METHODS --------------

    var promptUserForNewGame = function() {
        Game.timeForNextGame = true; 
        var msg = "Click the board to start a new game.";
        appendToMessage(msg);
    };

    var displayMessage = function(msg) {
        getMessage().innerHTML = Game.message.join("<br/><br/>");
    };

    var appendToMessage = function(msg) {
        Game.message.push(msg);
        getMessage().innerHTML = Game.message.join("<br/><br/>");
    };

    var clearMessage = function() {
        getMessage().innerHTML = "";
    };

    // -------------- SCORE PERSISTENCE METHODS --------------

    var TOP_RANGE = 5;

    var getHighScores = function() {
        return JSON.parse(localStorage.highScores || "[]");
    };

    var addScoreToHighScores = function(score) {
        var highScores = getHighScores();
        highScores.push(score);
        highScores.sortNumbers().reverse();
        highScores = highScores.slice(0, TOP_RANGE);
        localStorage.highScores = JSON.stringify(highScores);
    };

    var scoreIsNewHighScore = function(score) {
        return score > (getHighScores()[0] || 0);
    };

    var scoreIsInTopRange = function(score) {
        var highScores = getHighScores();
        return score < highScores[0] || score > (highScores.last() || 0) 
                || highScores.length < TOP_RANGE;
    };

    var storeNewHighScore = function(score) {
        if(scoreIsNewHighScore(score) && score != 0) {
            addScoreToHighScores(score);
            return true;
        }
    };

    var storeNewTopScore = function(score) {
        if(scoreIsInTopRange(score) && score != 0) {
            addScoreToHighScores(score);
            return true;
        }
    };

    // -------------- ARRAY PROTOTYPE EXTENSION METHODS --------------

    Array.prototype.last = function() {
        return this[this.length - 1];
    };

    Array.prototype.contains = function(x) {
        return this.indexOf(x) >= 0;
    };

    Array.prototype.sortNumbers = function() {
        return this.sort(function(a, b) { return a - b; });
    };
};
