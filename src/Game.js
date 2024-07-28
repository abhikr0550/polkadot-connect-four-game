import React, { useState, useEffect, useRef } from 'react';
import './Game.css';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import Web3 from 'web3';
import contractjson from './details/contract.json';
import { FaPlay } from 'react-icons/fa'; // Import play icon from react-icons

let contract = null;
let selectedAccount = null;
const ADDRESS = "";

const loadedData = JSON.stringify(contractjson);
const abi = JSON.parse(loadedData);

const ROWS = 6;
const COLS = 7;

const createEmptyBoard = () => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
};

const checkWin = (board) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (checkDirection(board, row, col, 0, 1) ||
          checkDirection(board, row, col, 1, 0) ||
          checkDirection(board, row, col, 1, 1) ||
          checkDirection(board, row, col, 1, -1)) {
        return board[row][col];
      }
    }
  }
  return null;
};

const checkDirection = (board, row, col, rowDir, colDir) => {
  const player = board[row][col];
  if (!player) return false;
  for (let i = 1; i < 4; i++) {
    const newRow = row + rowDir * i;
    const newCol = col + colDir * i;
    if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS || board[newRow][newCol] !== player) {
      return false;
    }
  }
  return true;
};

const isBoardFull = (board) => {
  for (let col = 0; col < COLS; col++) {
    if (!board[0][col]) {
      return false;
    }
  }
  return true;
};

const Game = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('Red');
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameBeginSound, setGameBeginSound] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [countdownStarted, setCountdownStarted] = useState(false);

  useEffect(() => {
    setGameBeginSound(new Audio('sound/game_begin.wav'));
  }, []);

  let publicCost = 1000000000000000000;

  const redAudioRef = useRef(null);
  const yellowAudioRef = useRef(null);

  useEffect(() => {
    async function checkNetwork() {
      let provider = window.ethereum;
      const web3 = new Web3(provider);
      provider.on('chainChanged', function () {
        window.location.reload();
      });
      provider.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
          selectedAccount = accounts[0];
          setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
          console.log('Selected Account change is' + selectedAccount);
        } else {
          window.location.reload();
          console.error('No account is found');
        }
      });
      let accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        selectedAccount = accounts[0];
        setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
      }
    }
    checkNetwork();
  }, []);

  async function onConnectClick() {
    let provider = window.ethereum;
    if (typeof provider !== 'undefined') {
      provider
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          selectedAccount = accounts[0];
          setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
          console.log('Selected Account is ' + selectedAccount);
        })
        .catch((err) => {
          console.log(err);
        });

      provider.on('chainChanged', function () {
        window.location.reload();
      });

      provider.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
          selectedAccount = accounts[0];
          console.log('Selected Account change is' + selectedAccount);
        } else {
          window.location.reload();
          console.error('No account is found');
        }
      });

      provider.on('message', function (message) {
        console.log(message);
      });

      provider.on('connect', function (info) {
        console.log('Connected to network ' + info);
      });

      provider.on('disconnect', function (error) {
        console.log('Disconnected from network ' + error);
        window.location.reload();
      });
    } else {
      NotificationManager.error('Please connect metamask', '', 3000);
    }
  }

  function startGame1() {
    setGameStarted(true)
    gameBeginSound.play();
  }

  async function startGame() {
    let provider = window.ethereum;
    const web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();
    if (accounts[0] === undefined) {
      NotificationManager.error('Please connect metamask', '', 3000);
    } else {
      contract = new web3.eth.Contract(abi, ADDRESS);

      try {
        NotificationManager.info('Transaction in process', '', 3000);
        const receipt = await contract.methods.startPlay().send({ from: accounts[0], value: publicCost });

        if (receipt.status) {
          NotificationManager.success('Transaction successful, countdown starting', '', 3000);
          setCountdownStarted(true);
          // hornSound.play();
          let countdownValue = 3;
          const countdownInterval = setInterval(() => {
            setCountdown(countdownValue);
            countdownValue -= 1;
            if (countdownValue < 0) {
              clearInterval(countdownInterval);
              setCountdownStarted(false);
              setGameStarted(true);
            }
          }, 1000);
        } else {
          NotificationManager.error('Transaction failed', '', 3000);
        }
      } catch (error) {
        NotificationManager.error('Transaction rejected', '', 3000);
      }
    }
  };

  const Countdown = ({ countdown }) => (
    <div className="countdown">
      <h1>{countdown}</h1>
    </div>
  );

  const playSound = (player) => {
    if (player === 'Red') {
      redAudioRef.current.play();
    } else {
      yellowAudioRef.current.play();
    }
  };

  async function onRedWin(){
    console.log("Red wins! Perform custom action here.");
    setGameStarted(false);
    let provider = window.ethereum;
    const web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();
    contract = new web3.eth.Contract(abi, ADDRESS);
    try {
      const receipt = await contract.methods.claimReward().send({ from: accounts[0] });
      if (receipt.status) {
        NotificationManager.success('Transaction successful', '', 3000);
      } else {
        NotificationManager.error('Transaction failed', '', 3000);
      }
    } catch (error) {
      NotificationManager.error('Transaction rejected', '', 3000);
    }
  };

  const handleClick = (col) => {
    if (winner || currentPlayer === 'Yellow') return;

    const newBoard = board.map(row => row.slice());
    let row = ROWS - 1;
    while (row >= 0 && newBoard[row][col]) {
      row--;
    }

    if (row >= 0) {
      newBoard[row][col] = currentPlayer;
      setLastMove({ row, col });
      setBoard(newBoard);
      
      playSound('Red');

      const newWinner = checkWin(newBoard);
      setWinner(newWinner);
      setCurrentPlayer('Yellow');
    }
  };

  const findBestMove = (board) => {
    // Check for winning move
    for (let col = 0; col < COLS; col++) {
      const newBoard = board.map(row => row.slice());
      let row = ROWS - 1;
      while (row >= 0 && newBoard[row][col]) {
        row--;
      }
      if (row >= 0) {
        newBoard[row][col] = 'Yellow';
        if (checkWin(newBoard) === 'Yellow') {
          return col;
        }
      }
    }

    // Block opponent's winning move
    for (let col = 0; col < COLS; col++) {
      const newBoard = board.map(row => row.slice());
      let row = ROWS - 1;
      while (row >= 0 && newBoard[row][col]) {
        row--;
      }
      if (row >= 0) {
        newBoard[row][col] = 'Red';
        if (checkWin(newBoard) === 'Red') {
          return col;
        }
      }
    }

    // Choose center column if available
    const centerCol = 3;
    if (!board[0][centerCol]) {
      return centerCol;
    }

    // Prefer columns that are part of a winning strategy
    const winningMoves = [centerCol];
    for (let col = 0; col < COLS; col++) {
      if (!board[0][col] && col !== centerCol) {
        winningMoves.push(col);
      }
    }

    return winningMoves[Math.floor(Math.random() * winningMoves.length)];
  };

  useEffect(() => {
    if (winner === 'Red') {
      onRedWin();
    }
  }, [winner]);

  useEffect(() => {
    if (currentPlayer === 'Yellow' && !winner) {
      const botMove = () => {
        const newBoard = board.map(row => row.slice());
        const col = findBestMove(newBoard);

        let row = ROWS - 1;
        while (row >= 0 && newBoard[row][col]) {
          row--;
        }

        if (row >= 0) {
          newBoard[row][col] = 'Yellow';
          setLastMove({ row, col });
          setBoard(newBoard);
          
          playSound('Yellow');

          const newWinner = checkWin(newBoard);
          setWinner(newWinner);
          setCurrentPlayer('Red');
        } else {
          // If the chosen column is full, find another valid move
          const validMoves = [];
          for (let col = 0; col < COLS; col++) {
            if (!board[0][col]) {
              validMoves.push(col);
            }
          }
          if (validMoves.length > 0) {
            const newCol = validMoves[Math.floor(Math.random() * validMoves.length)];
            row = ROWS - 1;
            while (row >= 0 && newBoard[row][newCol]) {
              row--;
            }
            if (row >= 0) {
              newBoard[row][newCol] = 'Yellow';
              setLastMove({ row, newCol });
              setBoard(newBoard);

              playSound('Yellow');

              const newWinner = checkWin(newBoard);
              setWinner(newWinner);
              setCurrentPlayer('Red');
            }
          }
        }
      };

      const timer = setTimeout(botMove, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, board, winner]);

  return (
    <header className="App-header">
      <div className="connectWallet">
          {selected !== null ? (
            <button className="fontStyle">Connected {selected}</button>
          ) : (
            <button className="fontStyle" onClick={startGame1}>
              Connect to Wallet
            </button>
          )}
        </div>
        {!gameStarted ? (
          <div className="start-screen">
            <button className="play-button" onClick={startGame}>
              <FaPlay className="play-icon" />
              Play
            </button>
          </div>
        ) : (
    <div className="board-container">
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div key={colIndex} className="cell" onClick={() => handleClick(colIndex)}>
                <div className={`disc ${cell} ${lastMove && lastMove.row === rowIndex && lastMove.col === colIndex ? 'drop' : ''}`}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {winner && (
      <h2 style={{ color: winner === 'Red' ? 'red' : 'yellow' }}>{winner} wins!</h2>)}
      <audio ref={redAudioRef} src="sound/coin_drop.mp3" />
      <audio ref={yellowAudioRef} src="sound/coin_drop.mp3" />
    </div>
    )}
    </header>
  );
};

export default Game;
