// scripts/guide-quiz.js
class GuideQuiz {
  constructor(questions) {
    this.questions = questions.map(q => ({
      ...q,
      options: this._shuffle([...q.options])
    }));
    this.userAnswers = [];
    this.currentIndex = 0;
    this.score = 0;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  submitAnswer(selectedIndex) {
    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.correctIndex;
    this.userAnswers.push({
      questionIndex: this.currentIndex,
      selectedIndex,
      isCorrect
    });
    if (isCorrect) this.score++;
    this.currentIndex++;

    return {
      isCorrect,
      explanation: q.explanation,
      currentScore: this.score,
      totalQuestions: this.questions.length,
      progress: (this.currentIndex / this.questions.length) * 100
    };
  }

  async finishQuiz(userId, chapterId, passingScore = 70) {
    const percent = Math.round((this.score / this.questions.length) * 100);
    const passed = percent >= passingScore;

    // Save to Firestore
    const progressRef = firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .doc(chapterId);

    await progressRef.update({
      quizAttempts: firebase.firestore.FieldValue.increment(1),
      quizScore: percent,
      quizPassed: passed
    });

    // If passed, trigger certificate generation
    if (passed && typeof CertificateGenerator !== 'undefined') {
      await CertificateGenerator.maybeGenerate(userId, chapterId);
    }

    window.dispatchEvent(new CustomEvent('quizCompleted', {
      detail: { passed, score: percent }
    }));

    return { passed, score: percent };
  }
}