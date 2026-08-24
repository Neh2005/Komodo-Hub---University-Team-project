
/* **** Karmugilan's part **** */

import { useEffect, useState } from "react";
import { auth, db } from "../firebaseconfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./StudentTimetable.css";
import Header from "./Header";

const localizer = momentLocalizer(moment);

const StudentTimetable = ({ classId }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedClassId, setResolvedClassId] = useState(classId || null);

  useEffect(() => {
    document.body.classList.add("student-timetable-body");
    document.documentElement.classList.add("student-timetable-html");
    return () => {
      document.body.classList.remove("student-timetable-body");
      document.documentElement.classList.remove("student-timetable-html");
    };
  }, []);

  // ✅ Fetch classId from Firestore if not passed as a prop — from the SIGNED-IN student's
  // own profile document. The previous version fetched the first document in the entire
  // student collection, so every student who opened this page without a classId prop saw
  // whichever class happened to be first in the collection, not their own.
  const [classIdError, setClassIdError] = useState(null);

  useEffect(() => {
    // auth.currentUser can be transiently null right after mount (see StudentDashboard.jsx
    // for the same issue) — wait for a real auth state instead of checking synchronously.
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (classId) return;

      if (!firebaseUser) {
        setClassIdError("You need to be logged in to view your timetable.");
        setLoading(false);
        return;
      }
      try {
        const studentSnap = await getDoc(doc(db, "users/student/members", firebaseUser.uid));
        if (studentSnap.exists() && studentSnap.data().classID) {
          setResolvedClassId(studentSnap.data().classID);
        } else {
          // No classID on the profile yet — a real, terminal state, not something to keep
          // spinning on forever (the previous version never called setLoading(false) here).
          setClassIdError("You haven't joined a class yet — ask your teacher for your class code and add it on your profile.");
          setLoading(false);
        }
      } catch (error) {
        console.error("🔥 Error fetching classId:", error);
        setClassIdError("Couldn't load your class. Please try again.");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [classId]);

  // ✅ Fetch timetables when classId is available
  useEffect(() => {
    if (!resolvedClassId) {
      console.warn("⚠️ Waiting for classId...");
      return;
    }

    const fetchTimetables = async () => {
      try {
        // Scoped server-side to this student's own class, instead of pulling every class's
        // timetable and filtering client-side.
        const timetableQuery = query(collection(db, "timetable"), where("classID", "==", resolvedClassId));
        const timetableSnapshot = await getDocs(timetableQuery);
        setTimetable(timetableSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("🔥 Error fetching timetables:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetables();
  }, [resolvedClassId]);

  if (loading) return <p>Loading timetable...</p>;

  if (classIdError) {
    return (
      <div className="timetable-container">
        <Header />
        <p>{classIdError}</p>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <Header />
      <h1>Class Timetable</h1>
      {timetable.length === 0 ? (
        <p>No timetable available for this class.</p>
      ) : (
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Subjects</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((entry, index) => (
              <tr key={index}>
                <td>{entry.day || "Unknown"}</td>
                <td>{entry.time} - {entry.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 📌 Display in Calendar Format */}
      {timetable.length > 0 && (
        <Calendar
          localizer={localizer}
          events={timetable.map((item) => ({
            title: item.subject,
            start: moment(item.day, "DD MMMM").year(moment().year()).toDate(), // ✅ Correctly parses the date
            end: moment(item.day, "DD MMMM").year(moment().year()).add(2, "hours").toDate(), // ✅ Adds duration properly
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 1500 }}
        />
      )}
    </div>
  );
};

export default StudentTimetable;
