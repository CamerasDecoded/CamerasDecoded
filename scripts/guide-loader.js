// scripts/guide-loader.js
class GuideLoader {
  static async loadGuideChapters(guideId, userId) {
    try {
      const chaptersSnap = await firebase.firestore()
        .collection('pdfGuides')
        .doc(guideId)
        .collection('chapters')
        .orderBy('order', 'asc')
        .get();

      const chapters = [];
      for (const doc of chaptersSnap.docs) {
        const chapterData = doc.data();
        chapterData.id = doc.id;

        // Fetch user progress
        const progressSnap = await firebase.firestore()
          .collection('guideProgress')
          .doc(userId)
          .collection('chapters')
          .doc(doc.id)
          .get();

        const progress = progressSnap.exists ? progressSnap.data() : {
          started: null,
          completed: false,
          readPdf: false,
          quizScore: null,
          quizPassed: false
        };

        chapters.push({
          ...chapterData,
          userProgress: progress
        });
      }

      window.dispatchEvent(new CustomEvent('guideChaptersLoaded', { detail: chapters }));
      return chapters;
    } catch (err) {
      console.error('[GuideLoader] Error loading chapters:', err);
      throw err;
    }
  }

  static async loadChapter(guideId, chapterId) {
    try {
      const chapterSnap = await firebase.firestore()
        .collection('pdfGuides')
        .doc(guideId)
        .collection('chapters')
        .doc(chapterId)
        .get();

      const quizSnap = await chapterSnap.ref
        .collection('quiz')
        .doc('quiz_1')
        .get();

      return {
        chapter: { id: chapterSnap.id, ...chapterSnap.data() },
        quiz: quizSnap.exists ? quizSnap.data() : null
      };
    } catch (err) {
      console.error('[GuideLoader] Error loading chapter:', err);
      throw err;
    }
  }
}