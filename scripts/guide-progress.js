// scripts/guide-progress.js
class GuideProgress {
  static async markChapterStarted(userId, chapterId) {
    const ref = firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .doc(chapterId);

    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        started: firebase.firestore.Timestamp.now(),
        completed: false,
        readPdf: false,
        quizAttempts: 0,
        quizScore: null,
        quizPassed: false,
        assignmentSubmitted: false
      });
    }
  }

  static async markChapterRead(userId, chapterId) {
    await firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .doc(chapterId)
      .update({ readPdf: true });
  }

  static async markChapterCompleted(userId, chapterId) {
    await firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .doc(chapterId)
      .update({ completed: true });
  }

  static async getUserProgress(userId) {
    const snap = await firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .get();

    let started = 0, completed = 0, scores = [];
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (data.started) started++;
      if (data.completed) completed++;
      if (data.quizScore !== null) scores.push(data.quizScore);
    });

    return { chaptersStarted: started, chaptersCompleted: completed, quizScores: scores };
  }
}