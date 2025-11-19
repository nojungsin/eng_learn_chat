// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Feedback from './pages/Feedback';
import Vocab from './pages/Vocab';
import Service from './pages/Service';
import Sgfbcm from './pages/Sgfbcm';
import Chat from './pages/Chat';
import Test from './pages/Test';
import PersonalData from './pages/PersonalData';
import Achievement from './pages/Achievement';
import Announcements from './pages/Announcements';
import Report from './pages/Report';
import Mypage from './pages/Mypage';
import Choose from './pages/Choose';
import Faq from './pages/Faq';
import Voice from './pages/Voice';
import Text from './pages/Text';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// 로그인 여부 확인용 PrivateRoute
function PrivateRoute({ children }: { children: React.ReactElement }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
}

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
                <Route path="/achievement" element={<Achievement />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/sgfbcm" element={<Sgfbcm />} />
                <Route path="/service" element={<Service />} />
                <Route path="/mypage" element={<Mypage />} />{/*mypage 라우트 설정 */}
                <Route path="/report" element={<Report />} />
                <Route path="/personaldata" element={<PersonalData />} />
                <Route path="/choose" element={<Choose />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/text" element={<Text />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/reset" element={<ResetPassword />} />
                {/* 잘못된 경로 → 로그인으로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
