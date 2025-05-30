const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.autoExpireAndRenewSubscriptions = functions.pubsub
  .schedule("every 24 hours") // Runs once daily
  .timeZone("UTC")
  .onRun(async (context) => {
    const schoolsRef = db.collection("users").doc("schools").collection("members");
    const today = new Date();

    const snapshot = await schoolsRef.get();
    snapshot.forEach(async (doc) => {
      const schoolData = doc.data();
      const schoolRef = doc.ref;

      if (schoolData.subscriptionExpiry) {
        const expiryDate = schoolData.subscriptionExpiry.toDate();

        if (expiryDate < today) {
          if (schoolData.autoRenew) {
            // ✅ Auto-Renew Subscription
            const newExpiryDate = new Date();
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1); // Extend 1 year

            await schoolRef.update({
              subscriptionExpiry: newExpiryDate,
              subscriptionActive: true,
            });

            console.log(`Auto-renewed subscription for ${schoolData.schoolCode}`);
          } else {
            // ❌ Expire Subscription
            await schoolRef.update({
              subscriptionActive: false,
            });

            console.log(`Subscription expired for ${schoolData.schoolCode}`);
          }
        }
      }
    });
  });
exports.updateStudentSubscriptionStatus = functions.firestore
  .document("users/schools/members/{schoolId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.subscriptionActive !== oldData.subscriptionActive) {
      const studentsRef = db.collection("users").doc("students").collection("members");
      const studentsSnapshot = await studentsRef.where("schoolCode", "==", newData.schoolCode).get();

      studentsSnapshot.forEach(async (studentDoc) => {
        await studentDoc.ref.update({ isSubscribed: newData.subscriptionActive });
      });

      console.log(`Updated student subscriptions for ${newData.schoolCode}`);
    }
  });
