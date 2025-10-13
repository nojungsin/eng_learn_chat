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

// ✅ 로그인 여부 확인용 PrivateRoute
function PrivateRoute({ children }: { children: React.ReactElement }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 기본 루트 → 로그인으로 리다이렉트 */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* ✅ 비로그인 상태에서도 접근 가능한 페이지 */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/reset" element={<ResetPassword />} />

                {/* ✅ 로그인 필요한 보호 페이지들 */}
                <Route
                    path="/home"
                    element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/feedback"
                    element={
                        <PrivateRoute>
                            <Feedback />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/vocab"
                    element={
                        <PrivateRoute>
                            <Vocab />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/test"
                    element={
                        <PrivateRoute>
                            <Test />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <PrivateRoute>
                            <Chat />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/mypage"
                    element={
                        <PrivateRoute>
                            <Mypage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/report"
                    element={
                        <PrivateRoute>
                            <Report />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/choose"
                    element={
                        <PrivateRoute>
                            <Choose />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/voice"
                    element={
                        <PrivateRoute>
                            <Voice />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/text"
                    element={
                        <PrivateRoute>
                            <Text />
                        </PrivateRoute>
                    }
                />

                {/* 잘못된 경로 → 로그인으로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
