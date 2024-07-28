import React, { useState } from 'react';
import './App.css';
import Game from './Game';
import { FaPlay } from 'react-icons/fa'; // Import play icon from react-icons

function App() {
  return (
    <div className="App bg-image">
      <div className="header-container">
        <div className="title-heading">
          <img src="/images/title1.png" alt="Title" />
        </div>
        <div className="game-icon">
          <img src="/images/game-icon.png" alt="Game Icon" />
        </div>
      </div>
      <Game/>
      <footer className="App-footer">
        <p>© 2024 Connecting Polka. All rights reserved. Author: Abhishek Kumar, Satvik Khetan</p>
      </footer>
    </div>
  );
}

export default App;
