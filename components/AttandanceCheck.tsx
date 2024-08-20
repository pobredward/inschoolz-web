import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
import { userState, userExperienceState, userLevelState } from "../store/atoms";
import {
  checkAttendance,
  getAttendanceState,
} from "../services/attendanceService";
import { AttendanceState } from "../types";
import ExperienceModal from "./modal/ExperienceModal";
import { FaCheck } from "react-icons/fa";
import { updateUserExperience } from "../utils/experience";
const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];

const AttendanceCheck: React.FC = () => {
  const [user, setUser] = useRecoilState(userState);
  const setUserExperience = useSetRecoilState(userExperienceState);
  const setUserLevel = useSetRecoilState(userLevelState);
  const [attendanceState, setAttendanceState] =
    useState<AttendanceState | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expGained, setExpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (user) {
      getAttendanceState(user.uid, new Date()).then(setAttendanceState);
    }
  }, [user]);

  const handleAttendanceCheck = async () => {
    if (user && attendanceState?.canCheckToday) {
      try {
        const newState = await checkAttendance(user.uid, new Date());
        setAttendanceState(newState);

        const result = await updateUserExperience(user.uid, 10, "출석체크");

        setUserExperience(result.newExperience);
        setUserLevel(result.newLevel);
        setUser((prevUser) => ({
          ...prevUser!,
          experience: result.newExperience,
          level: result.newLevel,
        }));

        setExpGained(result.expGained);
        setNewLevel(result.levelUp ? result.newLevel : undefined);
        setShowExpModal(true);
      } catch (error) {
        console.error("Error during attendance check:", error);
      }
    }
  };

  if (!user || !attendanceState) return null;

  const today = new Date();
  const mondayOfWeek = new Date(today);
  mondayOfWeek.setDate(
    today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
  );

  return (
    <Container>
      <AttendanceInfo>
        <StreakInfo>연속 출석: {attendanceState.currentStreak}일</StreakInfo>
        <LastAttendance>
          마지막 출석:{" "}
          {attendanceState.lastAttendance
            ? attendanceState.lastAttendance.toLocaleDateString()
            : "없음"}
        </LastAttendance>
      </AttendanceInfo>
      <WeekContainer>
        {DAYS_OF_WEEK.map((day, index) => {
          const date = new Date(mondayOfWeek);
          date.setDate(mondayOfWeek.getDate() + index);
          const dateString = date.toISOString().split("T")[0];
          const isAttended = attendanceState.monthlyAttendances[dateString];
          const isToday = date.toDateString() === today.toDateString();

          return (
            <DayCell key={day} isToday={isToday} isAttended={isAttended}>
              <DayLabel>{day}</DayLabel>
              <DateLabel>{date.getDate()}</DateLabel>
              {isAttended && <StampIcon />}
            </DayCell>
          );
        })}
      </WeekContainer>
      <CheckButton
        onClick={handleAttendanceCheck}
        disabled={!attendanceState.canCheckToday}
      >
        {attendanceState.canCheckToday
          ? "출석체크하기"
          : "오늘은 이미 출석했습니다"}
      </CheckButton>
      <ExperienceModal
        isOpen={showExpModal}
        onClose={() => setShowExpModal(false)}
        expGained={expGained}
        newLevel={newLevel}
      />
    </Container>
  );
};

const Container = styled.div`
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const AttendanceInfo = styled.div`
  margin-bottom: 1rem;
`;

const StreakInfo = styled.p`
  font-weight: 600;
  margin: 0rem;
  font-size: 1.1rem;
  color: #333;
`;

const LastAttendance = styled.p`
  color: #888;
  margin: 0.5rem 0;
  font-size: 0.95rem;
`;

const WeekContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 1.5rem;

  @media (max-width: 600px) {
    gap: 5px;
  }
`;

const DayCell = styled.div<{ isToday: boolean; isAttended: boolean }>`
  flex: 1;
  max-width: calc(
    (100% - 60px) / 7
  ); /* 60px is the total gap (10px * 6 gaps) */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${(props) => (props.isToday ? "#e8f9e8" : "#f5f5f5")};
  border: ${(props) =>
    props.isToday ? "2px solid #77dd77" : "1px solid #d9d9d9"};
  position: relative;

  @media (max-width: 600px) {
    max-width: 100%;
    padding: 0.3rem;
  }
`;

const DayLabel = styled.span`
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
  color: #555;
`;

const DateLabel = styled.span`
  font-size: 1rem;
  color: #777;
`;

const StampIcon = styled(FaCheck)`
  position: absolute;
  top: 5px;
  right: 5px;
  color: var(--primary-button);
`;

const CheckButton = styled.button`
  width: 100%;
  padding: 0.85rem;
  background-color: var(--primary-button);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--primary-hover);
  }

  &:disabled {
    background-color: var(--gray-button);
    cursor: not-allowed;
  }
`;

export default AttendanceCheck;
