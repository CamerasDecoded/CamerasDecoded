// scripts/certificate-generator.js
class CertificateGenerator {
  static async maybeGenerate(userId, chapterId) {
    // Check if already exists
    const certSnap = await firebase.firestore()
      .collection('certificates')
      .where('userId', '==', userId)
      .where('chapterId', '==', chapterId)
      .get();
    if (certSnap.size > 0) return; // already earned

    // Get progress and quiz score
    const progSnap = await firebase.firestore()
      .collection('guideProgress')
      .doc(userId)
      .collection('chapters')
      .doc(chapterId)
      .get();
    const score = progSnap.data().quizScore;

    // Get chapter title
    const chapterSnap = await firebase.firestore()
      .collection('pdfGuides')
      .doc('guide_v1')
      .collection('chapters')
      .doc(chapterId)
      .get();
    const title = chapterSnap.data().title;

    const certCode = `${chapterId.toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Save certificate
    const docRef = await firebase.firestore()
      .collection('certificates')
      .add({
        userId,
        chapterId,
        chapterTitle: title,
        completionDate: firebase.firestore.Timestamp.now(),
        quizScore: score,
        certificateCode: certCode,
        pdfUrl: '' // will be generated on request
      });

    window.dispatchEvent(new CustomEvent('certificateGenerated', {
      detail: { certificateId: docRef.id, certCode }
    }));
  }

  // Optional: generate PDF using jsPDF (load library on demand)
  static async generatePdf(certificateId) {
    // Implementation would use jsPDF to create a PDF blob
    // and return a download URL or trigger download
    console.log('PDF generation not yet implemented for cert:', certificateId);
    alert('PDF download coming soon!');
  }
}