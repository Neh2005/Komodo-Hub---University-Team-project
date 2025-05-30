
/* **** Karmugilan's part **** */

import React, { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";
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

  // ✅ Fetch classId from Firestore if not passed as a prop
  useEffect(() => {
    const fetchClassId = async () => {
      if (!classId) {
        console.warn("⚠️ No classId provided, trying to fetch from Firestore...");
        try {
          const studentQuery = query(collection(db, "users/student/members"));
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            const studentData = studentSnapshot.docs[0].data();
            setResolvedClassId(studentData.classID);
            console.log("✅ Fetched classId from Firestore:", studentData.classID);
          } else {
            console.warn("⚠️ No student found in Firestore.");
          }
        } catch (error) {
          console.error("🔥 Error fetching classId:", error);
        }
      }
    };

    fetchClassId();
  }, [classId]);

  // ✅ Fetch timetables when classId is available
  useEffect(() => {
    if (!resolvedClassId) {
      console.warn("⚠️ Waiting for classId...");
      return;
    }

    const fetchTimetables = async () => {
      try {
        console.log("🔄 Fetching all timetables...");
        const timetableSnapshot = await getDocs(collection(db, "timetable"));

        let matchedTimetable = [];
        timetableSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.classID === resolvedClassId) {
            console.log("✅ Matched Timetable:", data);
            matchedTimetable.push(data); // ✅ Store timetable as an array
          }
        });

        if (matchedTimetable.length > 0) {
          setTimetable(matchedTimetable);
        } else {
          console.warn("⚠️ No matching timetable found for this class.");
          setTimetable([]);
        }
      } catch (error) {
        console.error("🔥 Error fetching timetables:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetables();
  }, [resolvedClassId]);

  if (loading) return <p>Loading timetable...</p>;

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
