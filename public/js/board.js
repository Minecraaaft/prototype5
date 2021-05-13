

const socket = io.connect("https://speedchess.org");




var board = null
var game = new Chess()
var playerColor = '';
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var pgnString = '';
var counter = -1

socket.on('chooseColor', chooseColor => {
    var config = {
        orientation: chooseColor,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    }
    board = Chessboard('myBoard', config)
})

socket.on('met', (msg) => {
    console.log(msg)
})

socket.on('clientCount', number => {
    socket.emit('serverCount', number)
})

socket.on('serverMove', (moveMessage) => {
    
    var move = game.move({
        from: moveMessage.source,
        to: moveMessage.target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    board.position(game.fen())
    updateStatus()
    
})


function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false
    
    // only pick up pieces for the side to move
    if ((orientation === 'white' && piece.search(/^w/) === -1) ||
      (orientation === 'black' && piece.search(/^b/) === -1)) {
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
    var moveMessage = {
        source: source,
        target: target
    }
    socket.emit('clientMove', (moveMessage));


    // illegal move
    if (move === null) return 'snapback'
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
    $pgn.html(game.pgn())
    if ( counter >= 0){
        updatePgn();
        
    }
    counter++
    
       



}


function updatePgn() {
    
    var pgnData = (game.history() + '').replace(/,/g, "");
    console.log(pgnData)
    if (counter % 2 == 0) {
        var pgnNotationBar = document.getElementsByClassName('turnBar')[0];
        var movePgn = document.createElement('div');
        movePgn.className = "move";
        
        movePgn.innerHTML = `${counter / 2 + 1}. ` + pgnData.substr(pgnString.length, pgnData.length);
        pgnNotationBar.appendChild(movePgn);
        

    } else {
        var changeMoveComponent = document.getElementsByClassName('move')[(counter - 1) / 2];
        changeMoveComponent.innerHTML +=' ' + pgnData.substr(pgnString.length, pgnData.length);
    }
    pgnString += pgnData.substr(pgnString.length, pgnData.length);

}



updateStatus()