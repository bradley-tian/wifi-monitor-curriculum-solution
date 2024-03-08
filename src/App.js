import React from 'react';
import './App.css';
import Heatmap from './pages/heatmap';
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className = 'App'>
        <Routes>
            <Route path='/' element={<Heatmap/>}/>
        </Routes>
    </div>
);
}

export default App;
