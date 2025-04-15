import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Feedback from './pages/Feedback';
import Vocab from './pages/Vocab';
import Mypage from './pages/Mypage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/login" element={<Login />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/vocab" element={<Vocab />} />
                <Route path="/mypage" element={<Mypage />} />
            </Routes>
        </Router>
    );
}

export default App;
