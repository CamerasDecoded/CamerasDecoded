// scripts/discussion-threads.js
class DiscussionThreads {
  static async loadThreadsForChapter(chapterId) {
    const snap = await firebase.firestore()
      .collection('guideDiscussionThreads')
      .where('chapterId', '==', chapterId)
      .orderBy('createdAt', 'desc')
      .get();

    const threads = [];
    for (const doc of snap.docs) {
      const thread = { id: doc.id, ...doc.data() };
      const repliesSnap = await doc.ref
        .collection('replies')
        .orderBy('createdAt', 'asc')
        .get();
      thread.replies = repliesSnap.docs.map(r => ({ id: r.id, ...r.data() }));
      threads.push(thread);
    }
    return threads;
  }

  static async createThread(userId, userName, userRole, chapterId, title, content) {
    if (!['Instructor', 'Partner'].includes(userRole)) {
      throw new Error('Only instructors and partners can create threads');
    }
    const ref = await firebase.firestore()
      .collection('guideDiscussionThreads')
      .add({
        chapterId,
        authorId: userId,
        authorName: userName,
        title,
        content,
        createdAt: firebase.firestore.Timestamp.now()
      });
    return ref.id;
  }

  static async replyToThread(userId, userName, userRole, threadId, content) {
    await firebase.firestore()
      .collection('guideDiscussionThreads')
      .doc(threadId)
      .collection('replies')
      .add({
        authorId: userId,
        authorName: userName,
        authorRole: userRole,
        content,
        createdAt: firebase.firestore.Timestamp.now(),
        helpful: []
      });
  }
}