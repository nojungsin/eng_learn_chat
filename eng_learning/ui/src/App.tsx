// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Feedback from './pages/Feedback';
import Vocab from './pages/Vocab';
import Chat from './pages/Chat';
import Test from './pages/Test';
import Report from './pages/Report';
import Mypage from './pages/Mypage';
import Choose from './pages/Choose';
import Voice from './pages/Voice';
import Text from './pages/Text';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/vocab" element={<Vocab />} />
                <Route path="/test" element={<Test />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/mypage" element={<Mypage />} />{/* ✅ /mypage 라우트 설정 */}
                <Route path="/report" element={<Report />} />
                <Route path="/choose" element={<Choose />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/text" element={<Text />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/reset" element={<ResetPassword />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
