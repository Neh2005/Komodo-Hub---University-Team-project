
 /* *** Maneesh's part *** */

import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Quiz.css";
import Header from "./Header";

const Quiz = () => {
  const questions = [
    { question: "What does it mean when an animal is endangered?", options: ["It has a large population", "It is an extinct animal", "It is at risk of extinction", "It is dangerous to humans"], correct: ["It is at risk of extinction"] },
    { question: "Which of the following actions can help endangered species?", options: ["Protect and restore natural habitats", "Hunt animals for fun", "Cutting down more forests", "Increase pollution"], correct: ["Protect and restore natural habitats"] },
    { question: "What do you mean by endemic species?", options: ["Species that are found all over the world", "Species that are found only in a specific region", "Species that are migratory", "Species that live in zoos"], correct: ["Species that are found only in a specific region"] },
    { question: "Why is it important to avoid buying products made from endangered animals?", options: ["To make them more expensive", "To prevent further harm to their population", "To make them famous", "Because they are not good quality"], correct: ["To prevent further harm to their population"] },
    { question: "What does reforestation mean?", options: ["Burning forests to clear land", "Cutting down more trees", "Planting new trees to restore forests", "Removing animals from forests"], correct: ["Planting new trees to restore forests"] },
    { question: "What is poaching?", options: ["Hunting animals illegally", "Studying animal behavior", "Protecting wild animals", "Living with wild animals"], correct: ["Hunting animals illegally"] }, 
    { question: "The main goal of animal conservation is to kill endangered species and destroy their natural habitats.", options: ["True", "False"], correct: ["False"] }, 
    { question: "Why are national parks and wildlife reserves important?", options: ["They allow humans to build more houses", "They provide safe habitats for animals", "They are places to keep dangerous animals away from people", "They can be used for tourism"], correct: ["They provide safe habitats for animals"] }, 
    { question: "What can people do to help stop deforestation?", options: ["Cut down more trees", "Support companies that use sustainable products", "Burn forests for farming", "Plant more trees"], correct: ["Support companies that use sustainable products", "Plant more trees"] }, 
    { question: "What can students do to help protect animals?", options: ["Release pets into the wild", "Support wildlife conservation projects", "Feed wild animals in the jungle", "Learn and educate others about endangered species"], correct: ["Learn and educate others about endangered species"] },
  ];

  const [userId, setUserId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [timer, setTimer] = useState(1800); // 30 minutes
  const navigate = useNavigate();

  // Fetch User ID and previous progress
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", "student", "members", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.timeLeft && userData.timeLeft > 0) {
            setTimer(userData.timeLeft);
            setScore(userData.points || 0);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Quiz Timer
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      handleSubmit();
    }
  }, [timer]);

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    const isCorrect = questions[currentQuestion].correct.includes(option);
    setFeedback(isCorrect ? "✅ Correct!" : `❌ Incorrect! The correct answer is ${questions[currentQuestion].correct.join(" or ")}`);

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setTimeout(handleNextQuestion, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setFeedback("");
    } else {
      setFeedback("🎉 You've completed all questions! Click Submit.");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(null);
      setFeedback("");
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert("User not logged in. Please try again.");
      return;
    }

    try {
      const userRef = doc(db, "users", "student", "members", userId);
      await updateDoc(userRef, { points: score, timeLeft: timer });

      alert(`Quiz submitted! Your score: ${score}`);
      navigate("/studentdashboard");
    } catch (error) {
      console.error("Error updating points:", error);
      alert("An error occurred while saving your score. Please try again.");
    }
  };

  return (
    <div className="quiz-wrapper">
      <Header />
      <header className="quiz-header">
        <h1>📝 Quiz Challenge</h1>
        <div className="quiz-timer">⏳ Time Left: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</div>
      </header>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
      </div>

      <div className="quiz-container">
        <h2>{questions[currentQuestion].question}</h2>
        <div className="quiz-options">
          {questions[currentQuestion].options.map((option, index) => (
            <button key={index} className={`quiz-option ${selectedAnswer === option ? (questions[currentQuestion].correct.includes(option) ? "correct" : "wrong") : ""}`} onClick={() => handleAnswer(option)} disabled={selectedAnswer !== null}>{option}</button>
          ))}
        </div>
        <h3 className="feedback">{feedback}</h3>
        <button className="prev-btn" onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>Previous</button>
        <button className="next-btn" onClick={handleNextQuestion} disabled={!selectedAnswer && currentQuestion < questions.length - 1}>Next</button>

        {currentQuestion === questions.length - 1 && <button className="final-submit-btn" onClick={handleSubmit}>Submit Quiz</button>}
      </div>
    </div>
  );
};

export default Quiz;
