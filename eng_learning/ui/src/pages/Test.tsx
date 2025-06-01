import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Test.css';

const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as any;
const recognition = new SpeechRecognition();

export default function Test() {
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userText, setUserText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const navigate = useNavigate();

  const questions = [
    {
      type: 'choice',
      question: 'What is the meaning of "improve"?',
      options: ['Make better', 'Make worse', 'Stay the same'],
      answer: 'Make better',
    },
    {
      type: 'choice',
      question: 'What is the opposite of "happy"?',
      options: ['Sad', 'Excited', 'Joyful'],
      answer: 'Sad',
    },
    {
      type: 'choice',
      question: 'Which word means "conversation"?',
      options: ['Talk', 'Walk', 'Run'],
      answer: 'Talk',
    },
    {
      type: 'speech',
      question: 'Say the word "apple"',
      answer: 'apple',
    },
    {
      type: 'speech',
      question: 'Say the word "banana"',
      answer: 'banana',
    },
  ];

  const current = questions[currentQuestion];

  const handleAnswer = (selectedOption: string) => {
    if (selectedOption === current.answer) {
      setScore(score + 1);
    }
    goNext();
  };

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserText('');
    } else {
      alert(`Test completed! Your score is: ${score}`);
      navigate('/'); // 테스트 완료 후 홈으로 이동
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();
  };

  recognition.onresult = (event: any) => {
    const speechToText = event.results[0][0].transcript;
    setUserText(speechToText);
    if (speechToText.toLowerCase() === current.answer.toLowerCase()) {
      setScore(score + 1);
    }
    goNext();
  };

  return (
      <div className="test-container">
        <div className="test-card">
          <div className="test-header">
            <button className="back-button" onClick={() => navigate('/home')}>
              &lt;
            </button>
            <h2>📝 Test</h2>
          </div>

          {current.type === 'choice' && current.options &&(
              <>
                <h3>{current.question}</h3>
                <div className="options">
                  {current.options.map((option, index) => (
                      <button key={index} onClick={() => handleAnswer(option)} className="option-btn">
                        {option}
                      </button>
                  ))}
                </div>
              </>
          )}

          {current.type === 'speech' && (
              <div className="speech-test">
                <h3>{current.question}</h3>
                <button onClick={startRecording} disabled={isRecording} className="record-btn">
                  {isRecording ? 'Recording...' : 'Start Recording'}
                </button>
                <button onClick={stopRecording} disabled={!isRecording} className="stop-btn">
                  Stop Recording
                </button>
                <p>Recognized Speech: {userText}</p>
              </div>
          )}

          <div className="score">
            <p>Current Score: {score}</p>
          </div>
        </div>
      </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
