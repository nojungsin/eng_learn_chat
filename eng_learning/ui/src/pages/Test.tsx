import { useState } from 'react';
import './Test.css';  // 스타일 파일 연결

export default function Test() {
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      question: 'What is the meaning of "improve"?',
      options: ['Make better', 'Make worse', 'Stay the same'],
      answer: 'Make better',
    },
    {
      question: 'What is the opposite of "happy"?',
      options: ['Sad', 'Excited', 'Joyful'],
      answer: 'Sad',
    },
    {
      question: 'Which word means "conversation"?',
      options: ['Talk', 'Walk', 'Run'],
      answer: 'Talk',
    },
  ];

  const handleAnswer = (selectedOption: string) => {
    if (selectedOption === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      alert(`Test completed! Your score is: ${score + 1}`);
    }
  };

  return (
    <div className="test-container">
      <div className="test-card">
        <h2>📝 Test</h2>
        <h3>{questions[currentQuestion].question}</h3>
        <div className="options">
          {questions[currentQuestion].options.map((option, index) => (
            <button key={index} onClick={() => handleAnswer(option)} className="option-btn">
              {option}
            </button>
          ))}
        </div>
        <div className="score">
          <p>Current Score: {score}</p>
        </div>
      </div>
    </div>
  );
}
