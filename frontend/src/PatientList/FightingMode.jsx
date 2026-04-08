import React, { useState, useRef } from 'react';
import API_BASE_URL from "../utils/config";
import './FightingMode.css';
import confetti from "canvas-confetti";

const FightingMode = ({ users }) => {
  const [category, setCategory] = useState('sleep_quality_score');
  const [isFighting, setIsFighting] = useState(false);
  const [winner, setWinner] = useState(null);

  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');

  const avatar1Ref = useRef(null);
  const avatar2Ref = useRef(null);

  const [records1, setRecords1] = useState([]);
  const [records2, setRecords2] = useState([]);

  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');

  const [result, setResult] = useState('');

  const fetchUserRecords = async (nick, setRecords) => {
    if (!nick) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/get-user-records/${nick}/`);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const shootConfetti = (ref) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const shoot = () => {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x, y },
      });
    };

    shoot();
    setTimeout(shoot, 150);
    setTimeout(shoot, 300);
  };

  const fight = () => {
    const r1 = records1.find(r => r.record_date === date1);
    const r2 = records2.find(r => r.record_date === date2);

    if (!r1 || !r2) {
      setResult("❌ Brak danych");
      return;
    }

    setIsFighting(true);
    setResult("⚔️ Walka trwa...");
    setWinner(null);

    setTimeout(() => {
      let value1, value2;
      let winnerNick = null;

      switch (category) {
        case "sleep_hours":
          value1 = r1.sleep_hours;
          value2 = r2.sleep_hours;
          //winnerNick = value1 > value2 ? user1 : user2;
          break;

        case "sleep_quality_score":
          // value1 = r1.sleep_quality_score;
          // value2 = r2.sleep_quality_score;
          value1 = Number(r1.sleep_quality_score);
          value2 = Number(r2.sleep_quality_score);
          //winnerNick = value1 > value2 ? user1 : user2;
          break;

        case "sleep_start_hour":
          value1 = Number(r1.sleep_start_hour);
          value2 = Number(r2.sleep_start_hour);
          //winnerNick = value1 < value2 ? user1 : user2;
          break;

        case "stress_level":
          const stressMap = { low: 1, medium: 2, high: 3 };
          value1 = stressMap[r1.stress_level] || 0;
          value2 = stressMap[r2.stress_level] || 0;
          //winnerNick = value1 < value2 ? user1 : user2;
          break;

        case "activity_level":
          const activityMap = { low: 1, medium: 2, high: 3 };
          value1 = activityMap[r1.activity_level] || 0;
          value2 = activityMap[r2.activity_level] || 0;
          //winnerNick = value1 > value2 ? user1 : user2;
          break;

        default:
          return;
      }

      if (value1 > value2) {
        //setResult(`🏆 WYGRYWA: ${user1} (${value1} vs ${value2})`);
        setResult(`🏆 WYGRYWA: ${user1}`);
        setWinner(user1);
        shootConfetti(avatar1Ref);

      } else if (value2 > value1) {
        //setResult(`🏆 WYGRYWA: ${user2} (${value2} vs ${value1})`);
        setResult(`🏆 WYGRYWA: ${user2}`);
        setWinner(user2);
        shootConfetti(avatar2Ref);

      } else {
        setResult("🤝 Remis");
        setWinner(null);
      }

      setIsFighting(false);
      console.log("VALUE1:", value1, "VALUE2:", value2);

      setIsFighting(false);
    }, 2000);
  };

  const getUser = (nick) => users.find(u => u.nick === nick);

  const renderUser = (userNick, setUser, setRecords, records, setDate, avatarRef, isWinner) => (
    <div className="fighter">
      <img
        ref={avatarRef}
        src={
          getUser(userNick)?.image
            ? `${API_BASE_URL}/media/${getUser(userNick).image}`
            : `${API_BASE_URL}/media/default-avatar.png`
        }
        className={`avatar_fight ${isWinner ? 'winner' : ''}`}
        alt="avatar"
      />

      <select onChange={(e) => {
        const nick = e.target.value;
        setUser(nick);
        fetchUserRecords(nick, setRecords);
      }}>
        <option value="">Wybierz usera</option>
        {users.map(u => (
          <option key={u.nick} value={u.nick}>{u.nick}</option>
        ))}
      </select>

      <select onChange={(e) => setDate(e.target.value)}>
        <option>Wybierz datę</option>
        {records.map(r => (
          <option key={r.record_date} value={r.record_date}>
            {r.record_date}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fight-layout">

      {renderUser(user1, setUser1, setRecords1, records1, setDate1, avatar1Ref, winner === user1)}

      <div className="fight-center">
        <button
          className={`fight-btn ${isFighting ? 'fighting' : ''}`}
          onClick={fight}
          disabled={isFighting}
        >
          {isFighting ? "⚔️ WALKA..." : "⚔️ FIGHT"}
        </button>

        <select onChange={(e) => setCategory(e.target.value)}>
          <option value="sleep_hours">Sen (ilość)</option>
          <option value="sleep_quality_score">Jakość snu</option>
          <option value="sleep_start_hour">Godzina snu</option>
          <option value="activity_level">Aktywność</option>
          <option value="stress_level">Stres</option>
        </select>

        {result && (
          <div
            className={`fight-result ${
              result.includes("WYGRYWA") ? "win" :
              result.includes("REMIS") ? "draw" : ""
            }`}
          >
            {result}
          </div>
        )}
      </div>

      {renderUser(user2, setUser2, setRecords2, records2, setDate2, avatar2Ref, winner === user2)}

    </div>
  );
};

export default FightingMode;