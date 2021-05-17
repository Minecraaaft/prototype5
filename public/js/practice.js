
var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

var stockfish = new Worker(wasmSupported ? '../node_modules/stockfish/src/stockfish.js' : '../node_modules/stockfish.wasm/stockfish.js');
var counter = -1

stockfish.onmessage = function (event) {
    console.log(event.data ? event.data : event)

    // 
    if (event.data.substring(0, 8) == "bestmove") {
        game.move({
            from: event.data.substring(9, 11),
            to: event.data.substring(11, 13),
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        })
        board.position(game.fen())
        updateStatus()
    }
}

var level = 10;
var maximumError = 4000 / (level + 1);
var ProbabilityValue = 10 * level;

var pgnCounter = 0;
var pgnString = "";

stockfish.postMessage('uci');
//stockfish.postMessage("setoption name skill level value " + level);
//stockfish.postMessage("setoption name Skill Level Maximum error value " + maximumError);
//stockfish.postMessage("setoption name Skill Level Probability value " + ProbabilityValue);

//--------------------------------------------------

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')


function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (move === null) return 'snapback'

    // gives the new position
    stockfish.postMessage("position fen " + game.fen());
    // starts search for move
    stockfish.postMessage("go depth 10");

    updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen())
}

function updateStatus() {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    $status.html(status)
    $fen.html(game.fen())
    $pgn.html(game.pgn())

    if (counter >= 0) {
        updatePgn();

    }
    counter++
}

function updatePgn() {

    var pgnData = (game.history() + '').replace(/,/g, "");
    if (counter % 2 == 0) {
        var pgnNotationBar = document.getElementsByClassName('turnBar')[0];
        var movePgn = document.createElement('div');
        movePgn.className = "move";

        movePgn.innerHTML = `${counter / 2 + 1}. ` + pgnData.substr(pgnString.length, pgnData.length);
        pgnNotationBar.appendChild(movePgn);


    } else {
        var changeMoveComponent = document.getElementsByClassName('move')[(counter - 1) / 2];
        changeMoveComponent.innerHTML += ' ' + pgnData.substr(pgnString.length, pgnData.length);
    }
    pgnString += pgnData.substr(pgnString.length, pgnData.length);

}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()

// choose level ----------------------------------------------

const selected = document.querySelector(".selected");
const optionsContainer = document.querySelector(".option-container");

const optionsList = document.querySelectorAll(".option");

selected.addEventListener("click", () => {
    optionsContainer.classList.toggle("active");
});

optionsList.forEach((o) => {
    o.addEventListener("click", () => {
        var lvlLabel = o.querySelector("label").innerHTML
        selected.innerHTML = lvlLabel;
        optionsContainer.classList.remove("active");

        level = lvlLabel;
        maximumError = 4000 / (level + 1);
        ProbabilityValue = 10 * level;
        stockfish.postMessage("setoption name skill level value " + level);
        stockfish.postMessage("setoption name Skill Level Maximum error value " + maximumError);
        stockfish.postMessage("setoption name Skill Level Probability value " + ProbabilityValue);

        console.log(level)
    })
})