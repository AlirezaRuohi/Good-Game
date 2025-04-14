document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("chessboard");
    const boardSize = 8;
    const king = { type: "king", row: 0, col: 0, symbol: "♔" };
    const targetPosition = { row: 7, col: 7 };
    const pieces = generatePieces(boardSize, king, targetPosition);

    function generatePieces(boardSize, king, target) {
        const pieceTypes = [
            { type: "bishop", symbol: "♝" },
            { type: "rook", symbol: "♜" },
            { type: "knight", symbol: "♞" }
        ];
        let pieces = [];
        let occupiedPositions = new Set();
        occupiedPositions.add(`${king.row},${king.col}`);
        occupiedPositions.add(`${target.row},${target.col}`);
        pieces.push(king);
        pieceTypes.forEach(piece => {
            let row, col;
            do {
                row = Math.floor(Math.random() * boardSize);
                col = Math.floor(Math.random() * boardSize);
            } while (occupiedPositions.has(`${row},${col}`));

            pieces.push({ type: piece.type, row, col, symbol: piece.symbol });
            occupiedPositions.add(`${row},${col}`);
        });
        return pieces;
    }

    let bombCount;
    let bombs = generateBombs(boardSize, 8, 10, pieces);
    let revealedBombs = new Set();

    function generateBombs(boardSize, minBombs, maxBombs, pieces) {
        bombCount = Math.floor(Math.random() * (maxBombs - minBombs + 1)) + minBombs;
        let bombPositions = new Set();

        while (bombPositions.size < bombCount) {
            let row = Math.floor(Math.random() * boardSize);
            let col = Math.floor(Math.random() * boardSize);
            let isOccupied = pieces.some(p => p.row === row && p.col === col);
            if (!isOccupied) {
                if (row != 7 && col != 7) {
                    bombPositions.add(`${row},${col}`);
                }
            }
        }

        return bombPositions;
    }

    function countAdjacentBombs(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (bombs.has(`${r},${c}`)) {
                    count++;
                }
            }
        }
        return count;
    }

    function createBoard() {
        board.innerHTML = "";

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement("div");
                cell.classList.add("cell", (i + j) % 2 === 0 ? "white" : "black");
                cell.dataset.row = i;
                cell.dataset.col = j;
                let piece = pieces.find(p => p.row === i && p.col === j);
                cell.addEventListener("click", () => handleCellClick(piece, cell, i, j));

                if (piece) {
                    cell.innerHTML = piece.symbol;
                    cell.dataset.type = piece.type;
                    if (piece.type === "king") cell.classList.add("gold");
                }

                if (i === targetPosition.row && j === targetPosition.col) {
                    cell.classList.add("target");
                }

                if (revealedBombs.has(`${i},${j}`)) {
                    cell.classList.add("bomb");
                    cell.innerHTML = "💣";
                }

                board.appendChild(cell);
            }
        }
    }

    let selectedPiece = null;
    let row_i = 0, col_j
    function handleCellClick(piece, cell, row, col) {
        if (revealedBombs.has(`${row},${col}`)) {
            return;
        }
        console.log(`piece : ${piece} , cell ${selectedPiece} , col_j: ${col_j} , row_i: ${row_i}`)
        if (selectedPiece == piece) {
            selectedPiece = null;
            removeHighlights();
            console.log("yes")
            return;
        }


        if (piece) {
            selectedPiece = piece;
            row_i = row
            col_j = col
            removeHighlights();
            highlightValidMoves(piece);
            return;
        }

        if (selectedPiece && !cell.classList.contains("highlight")) {
            selectedPiece = null;
            removeHighlights();
            return;
        }

        if (selectedPiece && bombs.has(`${row},${col}`)) {
            removePieceOnBomb(selectedPiece, row, col, cell);
            setTimeout(() => {
                const kingExists = pieces.some(p => p.type === "king");
                if (!kingExists) {
                    showGameMessage(" Game Over", "The King has been eliminated.", "red");
                }
            }, 100);
            return;
        }

        if (selectedPiece) {
            movePiece(selectedPiece, row, col);
            selectedPiece = null;
            removeHighlights();
        }

    }

    function removeHighlights() {
        document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
    }

    function movePiece(piece, newRow, newCol) {
        if (!piece) return;

        const targetCell = document.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
        if (!targetCell) return;

        if (pieces.some(p => p !== piece && p.row === newRow && p.col === newCol)) return;

        const previousRow = piece.row;
        const previousCol = piece.col;
        const previousCell = document.querySelector(`[data-row='${previousRow}'][data-col='${previousCol}']`);

        if (previousCell) {
            previousCell.innerHTML = "";

            if (piece.initialMove) {
                const previousBombs = countAdjacentBombs(previousRow, previousCol);
                if (previousBombs > 0) {
                    previousCell.innerHTML = `<span class="big-bomb-count">${previousBombs}</span>`;
                }
            }

            previousCell.replaceWith(previousCell.cloneNode(true));
            const newPreviousCell = document.querySelector(`[data-row='${previousRow}'][data-col='${previousCol}']`);
            newPreviousCell.addEventListener("click", () => handleCellClick(null, newPreviousCell, previousRow, previousCol));
        }

        piece.row = newRow;
        piece.col = newCol;
        targetCell.innerHTML = piece.symbol;

        if (!piece.initialMove) piece.initialMove = true;

        highlightCellWithBombInfo(newRow, newCol);

        if (piece.type === "king") {
            targetCell.classList.add("gold");
        } else {
            targetCell.classList.remove("gold");
        }

        targetCell.replaceWith(targetCell.cloneNode(true));
        const newTargetCell = document.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
        newTargetCell.addEventListener("click", () => handleCellClick(piece, newTargetCell, newRow, newCol));

        selectedPiece = piece;

        if (piece.type === "king" && newRow === targetPosition.row && newCol === targetPosition.col) {
            showGameMessage(" Victory!", "The king arrived at his destination.", "green");
        }
    }
    function showGameMessage(title, message, color) {
        const overlay = document.createElement("div");
        overlay.classList.add("game-overlay");

        const msgBox = document.createElement("div");
        msgBox.classList.add("message-box");
        msgBox.innerHTML = `
<h1 style="color: ${color};">${title}</h1>
<p>${message}</p>
<button onclick="location.reload();">OK</button>
`;

        overlay.appendChild(msgBox);
        document.body.appendChild(overlay);
    }

    function highlightValidMoves(piece) {
        const { type, row, col } = piece;
        document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));

        let directions = [];

        if (type === "knight") {
            directions = [
                { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
                { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 }
            ];
        } else if (type === "bishop") {
            directions = [
                { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
            ];
        } else if (type === "rook") {
            directions = [
                { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
            ];
        } else if (type === "king") {
            directions = [
                { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
                { r: 0, c: -1 }, { r: 0, c: 1 },
                { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
            ];
        }

        directions.forEach(direction => {
            let r = row + direction.r, c = col + direction.c;

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);

                if (!cell || pieces.find(p => p.row === r && p.col === c) || cell.classList.contains('flag') || revealedBombs.has(`${r},${c}`)) return;

                cell.classList.add("highlight");

                if (type === "king" || type === "knight") {
                    break;
                }

                r += direction.r;
                c += direction.c;
            }
        });
    }

    function removePieceOnBomb(piece, row, col, cell) {
        cell.classList.add("bomb", "revealed-bomb");
        cell.innerHTML = "💣";
        revealedBombs.add(`${row},${col}`);

        const index = pieces.indexOf(piece);
        if (index !== -1) {
            pieces.splice(index, 1);
        }

        selectedPiece = null;
        document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
        createBoard();
    }

    function highlightCellWithBombInfo(row, col) {
        const targetCell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);

        const adjacentBombs = countAdjacentBombs(row, col);

        targetCell.style.backgroundColor = "blue";

        if (adjacentBombs > 0) {
            const bombCountElement = document.createElement("span");
            bombCountElement.classList.add("bomb-count");
            bombCountElement.innerText = adjacentBombs;
            targetCell.appendChild(bombCountElement);
        }

        if (bombs.has(`${row},${col}`)) {
            targetCell.innerHTML = "💣";
        }
    }
    createBoard();
});