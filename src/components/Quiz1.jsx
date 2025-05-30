
 /* *** Karmugilan's part *** */

import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Quiz.css";
import Header from "./Header";

const Quiz1 = () => {
  const questions = [
    { question: "Which of these is an endangered animal found only in Indonesia?", options: ["Bald Eagle", "Bengal Tiger", "Javan Gibbon", "African Elephant"], correct: "Javan Gibbon" }, 
    { question: "The Bali Myna is a common bird found in every country?", options: ["True", "False"], correct: "False" }, 
    { question: "Which national park in Indonesia is home to the Javan Rhinoceros?", options: ["Kruger National Park", "Ujung Kulon National Park", "Yellowstone National Park", "Serengeti National Park"], correct: "Ujung Kulon National Park" }, 
    { question: "Which of these conservation actions can help protect endangered animals?", options: ["Hunting animals for fun", "Avoiding illegal wildlife products", "Throwing trash in forests", "Keeping wild animals as pets"], correct: "Avoiding illegal wildlife products" }, 
    { question: "Which of this is a major threat to Celebes Crested Macaques?", options: ["Hunting and habitat destruction", "Too much food in the wild", "Reforestation", "Overpopulation of macaques"], correct: "Hunting and habitat destruction" }, 
    { question: "Why is it important to protect rainforests?", options: ["They take up too much space", "They have no use for people or animals", "They provide oxygen and are home to many animals", "They are too dark and dangerous"], correct: "They provide oxygen and are home to many animals" },
    { question: "Which of the following is an endangered species?", options: ["Orangutan", "Horse", "Squirrel", "Cat"], correct: "Option 1" },
    { question: "Which of these reptiles is an endangered species found only in Indonesia?", options: ["Komodo Dragon", "Green Iguana", "Cobra", "Chameleon"], correct: "Komodo Dragon" },
    { question: "Which of the following is a reason why many endemic species in Indonesia are disappearing?", options: ["They move to other countries", "They are adapting to new environments", "Habitat destruction, illegal hunting, and pollution", "They are growing too fast"], correct: "Habitat destruction, illegal hunting, and pollution" }, 
    { question: "Which of these ocean animals is endangered due to pollution and habitat destruction?", options: ["Clownfish", "Starfish", "Dolphin", "Green Sea Turtle"], correct: "Green Sea Turtle" }
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

export default Quiz1;
