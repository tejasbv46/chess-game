class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.gameStatus = 'active';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveNumber = 1;
        
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeBoard() {
        const initialBoard = {
            "8": ["♜","♞","♝","♛","♚","♝","♞","♜"],
            "7": ["♟","♟","♟","♟","♟","♟","♟","♟"],
            "6": ["","","","","","","",""],
            "5": ["","","","","","","",""],
            "4": ["","","","","","","",""],
            "3": ["","","","","","","",""],
            "2": ["♙","♙","♙","♙","♙","♙","♙","♙"],
            "1": ["♖","♘","♗","♕","♔","♗","♘","♖"]
        };
        return initialBoard;
    }

    initializeUI() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let rank = 8; rank >= 1; rank--) {
            for (let file = 0; file < 8; file++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(rank + file) % 2 === 0 ? 'dark' : 'light'}`;
                square.dataset.rank = rank;
                square.dataset.file = file;
                square.dataset.position = `${String.fromCharCode(97 + file)}${rank}`;

                const piece = this.board[rank][file];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'chess-piece';
                    pieceElement.textContent = piece;
                    pieceElement.draggable = true;
                    pieceElement.dataset.piece = piece;
                    square.appendChild(pieceElement);
                }

                chessboard.appendChild(square);
            }
        }

        this.updateGameStatus();
    }

    attachEventListeners() {
        const chessboard = document.getElementById('chessboard');
        const resetBtn = document.getElementById('resetBtn');

        // Use event delegation for better performance and to handle dynamically created elements
        chessboard.addEventListener('click', (e) => this.handleSquareClick(e));
        chessboard.addEventListener('dragstart', (e) => this.handleDragStart(e));
        chessboard.addEventListener('dragover', (e) => this.handleDragOver(e));
        chessboard.addEventListener('drop', (e) => this.handleDrop(e));
        chessboard.addEventListener('dragend', (e) => this.handleDragEnd(e));
        chessboard.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        resetBtn.addEventListener('click', () => this.resetGame());
    }

    handleSquareClick(e) {
        if (this.gameStatus !== 'active') return;

        const square = e.target.closest('.chess-square');
        if (!square) return;

        const rank = parseInt(square.dataset.rank);
        const file = parseInt(square.dataset.file);
        const piece = this.board[rank][file];

        // If we have a selected square and click on a valid move destination
        if (this.selectedSquare) {
            const isValidMove = this.validMoves.some(move => move.rank === rank && move.file === file);
            if (isValidMove) {
                this.makeMove(this.selectedSquare, { rank, file });
                this.clearSelection();
                return;
            }
            // If clicking on same square, deselect
            if (this.selectedSquare.rank === rank && this.selectedSquare.file === file) {
                this.clearSelection();
                return;
            }
        }

        // Select piece if it belongs to current player
        if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
            this.selectSquare({ rank, file });
        } else {
            this.clearSelection();
        }
    }

    handleDragStart(e) {
        if (this.gameStatus !== 'active') {
            e.preventDefault();
            return;
        }

        const piece = e.target.dataset.piece;
        if (!piece || !this.isPieceOwnedByCurrentPlayer(piece)) {
            e.preventDefault();
            return;
        }

        const square = e.target.closest('.chess-square');
        const rank = parseInt(square.dataset.rank);
        const file = parseInt(square.dataset.file);

        this.selectSquare({ rank, file });
        e.target.classList.add('dragging');
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ rank, file }));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragLeave(e) {
        const square = e.target.closest('.chess-square');
        if (square) {
            square.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const square = e.target.closest('.chess-square');
        if (!square || !this.selectedSquare) return;

        const rank = parseInt(square.dataset.rank);
        const file = parseInt(square.dataset.file);
        
        // Check if this is a valid move
        const isValidMove = this.validMoves.some(move => move.rank === rank && move.file === file);
        
        if (isValidMove) {
            this.makeMove(this.selectedSquare, { rank, file });
        }

        this.clearSelection();
        this.clearDragStyles();
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.clearDragStyles();
    }

    clearDragStyles() {
        document.querySelectorAll('.drag-over').forEach(sq => sq.classList.remove('drag-over'));
    }

    selectSquare(position) {
        this.clearSelection();
        this.selectedSquare = position;
        this.validMoves = this.getValidMoves(position);
        this.highlightSquares();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];
        document.querySelectorAll('.chess-square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'highlighted');
        });
    }

    highlightSquares() {
        if (!this.selectedSquare) return;

        // Highlight selected square
        const selectedSquare = document.querySelector(`[data-rank="${this.selectedSquare.rank}"][data-file="${this.selectedSquare.file}"]`);
        if (selectedSquare) {
            selectedSquare.classList.add('selected');
        }

        // Highlight valid moves
        this.validMoves.forEach(move => {
            const moveSquare = document.querySelector(`[data-rank="${move.rank}"][data-file="${move.file}"]`);
            if (moveSquare) {
                moveSquare.classList.add('valid-move');
            }
        });
    }

    getValidMoves(position) {
        const piece = this.board[position.rank][position.file];
        if (!piece) return [];

        let moves = [];

        switch (piece) {
            case '♙': case '♟': // Pawn
                moves = this.getPawnMoves(position, piece);
                break;
            case '♖': case '♜': // Rook
                moves = this.getRookMoves(position);
                break;
            case '♘': case '♞': // Knight
                moves = this.getKnightMoves(position);
                break;
            case '♗': case '♝': // Bishop
                moves = this.getBishopMoves(position);
                break;
            case '♕': case '♛': // Queen
                moves = this.getQueenMoves(position);
                break;
            case '♔': case '♚': // King
                moves = this.getKingMoves(position);
                break;
        }

        // Filter out moves that would be blocked or invalid
        return moves.filter(move => {
            // Check bounds
            if (move.rank < 1 || move.rank > 8 || move.file < 0 || move.file > 7) {
                return false;
            }
            
            const targetPiece = this.board[move.rank][move.file];
            // Can't capture own pieces
            if (targetPiece && this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                return false;
            }
            
            return true;
        });
    }

    getPawnMoves(position, piece) {
        const moves = [];
        const isWhite = ['♙','♖','♘','♗','♕','♔'].includes(piece);
        const direction = isWhite ? 1 : -1;
        const startRank = isWhite ? 2 : 7;

        // Forward move
        const newRank = position.rank + direction;
        if (newRank >= 1 && newRank <= 8 && !this.board[newRank][position.file]) {
            moves.push({ rank: newRank, file: position.file });

            // Double move from starting position
            if (position.rank === startRank && !this.board[newRank + direction][position.file]) {
                moves.push({ rank: newRank + direction, file: position.file });
            }
        }

        // Diagonal captures
        for (let fileOffset of [-1, 1]) {
            const newFile = position.file + fileOffset;
            if (newFile >= 0 && newFile < 8 && newRank >= 1 && newRank <= 8) {
                const targetPiece = this.board[newRank][newFile];
                if (targetPiece && !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push({ rank: newRank, file: newFile });
                }
            }
        }

        return moves;
    }

    getRookMoves(position) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (let [rankDir, fileDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRank = position.rank + rankDir * i;
                const newFile = position.file + fileDir * i;

                if (newRank < 1 || newRank > 8 || newFile < 0 || newFile > 7) break;

                const targetPiece = this.board[newRank][newFile];
                if (!targetPiece) {
                    moves.push({ rank: newRank, file: newFile });
                } else {
                    if (!this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                        moves.push({ rank: newRank, file: newFile });
                    }
                    break;
                }
            }
        }

        return moves;
    }

    getKnightMoves(position) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (let [rankOffset, fileOffset] of knightMoves) {
            const newRank = position.rank + rankOffset;
            const newFile = position.file + fileOffset;

            if (newRank >= 1 && newRank <= 8 && newFile >= 0 && newFile < 8) {
                moves.push({ rank: newRank, file: newFile });
            }
        }

        return moves;
    }

    getBishopMoves(position) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (let [rankDir, fileDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRank = position.rank + rankDir * i;
                const newFile = position.file + fileDir * i;

                if (newRank < 1 || newRank > 8 || newFile < 0 || newFile > 7) break;

                const targetPiece = this.board[newRank][newFile];
                if (!targetPiece) {
                    moves.push({ rank: newRank, file: newFile });
                } else {
                    if (!this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                        moves.push({ rank: newRank, file: newFile });
                    }
                    break;
                }
            }
        }

        return moves;
    }

    getQueenMoves(position) {
        return [...this.getRookMoves(position), ...this.getBishopMoves(position)];
    }

    getKingMoves(position) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let [rankOffset, fileOffset] of directions) {
            const newRank = position.rank + rankOffset;
            const newFile = position.file + fileOffset;

            if (newRank >= 1 && newRank <= 8 && newFile >= 0 && newFile < 8) {
                moves.push({ rank: newRank, file: newFile });
            }
        }

        return moves;
    }

    makeMove(from, to) {
        const piece = this.board[from.rank][from.file];
        const capturedPiece = this.board[to.rank][to.file];

        // Make the move
        this.board[to.rank][to.file] = piece;
        this.board[from.rank][from.file] = '';

        // Update UI
        this.updateBoardUI();

        // Record move in history
        const moveNotation = this.getMoveNotation(piece, from, to, capturedPiece);
        this.recordMove(moveNotation);

        // Switch turns
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        if (this.currentPlayer === 'white') {
            this.moveNumber++;
        }

        // Check for game end conditions
        this.checkGameEnd();
        this.updateGameStatus();
    }

    updateBoardUI() {
        const squares = document.querySelectorAll('.chess-square');
        squares.forEach(square => {
            const rank = parseInt(square.dataset.rank);
            const file = parseInt(square.dataset.file);
            const piece = this.board[rank][file];

            // Remove existing piece
            const existingPiece = square.querySelector('.chess-piece');
            if (existingPiece) {
                existingPiece.remove();
            }

            // Add new piece if exists
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'chess-piece';
                pieceElement.textContent = piece;
                pieceElement.draggable = true;
                pieceElement.dataset.piece = piece;
                square.appendChild(pieceElement);
            }
        });
    }

    getMoveNotation(piece, from, to, capturedPiece) {
        const fileLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const fromSquare = `${fileLetters[from.file]}${from.rank}`;
        const toSquare = `${fileLetters[to.file]}${to.rank}`;
        const capture = capturedPiece ? 'x' : '-';
        return `${piece}${fromSquare}${capture}${toSquare}`;
    }

    recordMove(moveNotation) {
        const moveHistory = document.getElementById('moveHistory');
        
        if (this.currentPlayer === 'black') { // Just made a white move
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            moveEntry.innerHTML = `
                <span class="move-number">${this.moveNumber}.</span>
                <span class="move-notation">${moveNotation}</span>
            `;
            moveHistory.appendChild(moveEntry);
        } else { // Just made a black move
            const lastEntry = moveHistory.lastElementChild;
            if (lastEntry && lastEntry.classList.contains('move-entry')) {
                lastEntry.innerHTML += ` <span class="move-notation">${moveNotation}</span>`;
            }
        }
        
        moveHistory.scrollTop = moveHistory.scrollHeight;
    }

    isPieceOwnedByCurrentPlayer(piece) {
        const whitePieces = ['♙','♖','♘','♗','♕','♔'];
        const blackPieces = ['♟','♜','♞','♝','♛','♚'];
        
        if (this.currentPlayer === 'white') {
            return whitePieces.includes(piece);
        } else {
            return blackPieces.includes(piece);
        }
    }

    checkGameEnd() {
        // Simple implementation - in a full game you'd check for checkmate/stalemate
        // For now, just continue playing
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameStatusElement = document.getElementById('gameStatus');

        currentPlayerElement.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        currentPlayerElement.className = `status status--${this.currentPlayer}`;

        if (this.gameStatus === 'active') {
            gameStatusElement.textContent = 'In Progress';
            gameStatusElement.className = 'status status--success';
        } else {
            gameStatusElement.textContent = this.gameStatus;
            gameStatusElement.className = 'status status--info';
        }
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.gameStatus = 'active';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveNumber = 1;

        // Clear move history UI
        const moveHistory = document.getElementById('moveHistory');
        moveHistory.innerHTML = '<p>Game started. White to move.</p>';

        this.initializeUI();
        this.updateGameStatus();
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});