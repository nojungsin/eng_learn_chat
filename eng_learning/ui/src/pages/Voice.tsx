import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voice.css';

export default function VoiceChat() {
    const [isTopicSelected, setIsTopicSelected] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);

    const navigate = useNavigate();

    const handleTopicSelect = (topic: string) => {
        setSelectedTopic(topic);
        setIsTopicSelected(true);
        setMessages([`You selected: ${topic}`]);
    };

    const handleExit = () => {
        navigate('/feedback');
    };

    const startRecording = () => {
        setIsRecording(true);
        console.log("Recording started...");
        // 실제 음성 인식 로직 추가
    };

    const stopRecording = () => {
        setIsRecording(false);
        console.log("Recording stopped...");
        setMessages([...messages, "AI's response based on recorded speech"]);
    };

    return (
        <div className="voice-chat-container">
            <div className="voice-chat-box">
                {isTopicSelected && (
                    <button className="exit-button" onClick={handleExit}>
                        ❌
                    </button>
                )}

                <div className="voice-chat-header">
                    {isTopicSelected
                        ? `🎤 롤플레이 주제: ${selectedTopic}`
                        : '🎤 롤플레이 주제 선택'}
                </div>

                {!isTopicSelected && (
                    <div className="topic-selection">
                        <p>어떤 롤플레이를 할까요?</p>
                        <button onClick={() => handleTopicSelect('병원에서 의사와 환자')}>🏥 병원</button>
                        <button onClick={() => handleTopicSelect('레스토랑에서 주문하기')}>🍽️ 레스토랑</button>
                        <button onClick={() => handleTopicSelect('공항에서 체크인하기')}>✈️ 공항</button>
                        <button onClick={() => handleTopicSelect('호텔에서 체크인하기')}>🏨 호텔</button>
                    </div>
                )}

                {isTopicSelected && (
                    <>
                        <div className="voice-chat-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className="message">
                                    <span>{msg}</span>
                                </div>
                            ))}
                        </div>

                        <div className="voice-chat-controls">
                            <button
                                className={`record-btn ${isRecording ? 'active' : ''}`}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}