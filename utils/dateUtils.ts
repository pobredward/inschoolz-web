import { Timestamp } from "firebase/firestore";

export function formatDate(date: Date | Timestamp): string {
  const dateObject = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();
  const diff = now.getTime() - dateObject.getTime();
  const diffMinutes = Math.floor(diff / 60000);
  const diffHours = Math.floor(diff / 3600000);
  const diffDays = Math.floor(diff / 86400000);

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return dateObject.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}

export function formatTime(date: Date | Timestamp): string {
  const dateObject = date instanceof Timestamp ? date.toDate() : date;
  return dateObject.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
