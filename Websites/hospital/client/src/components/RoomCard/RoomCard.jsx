"use client";
import styles from "./roomcard.module.css";
import { useRouter } from "next/navigation";

export default function RoomCard({ room }) {
  const router = useRouter();
  console.log(room)
  const handleView = () => {
    router.push(`/private_routes/room/${room.room_id}?patient_id=${room.patient_id}&room_number=${room.room_number}&floor_number=${room.floor_id}&isOccupied=${room.isOccupied}`);
  };

  return (
    <div className={`${styles.card} ${room.isOccupied ? styles.occupied : styles.available}`}>
      <div className={styles.header}>
        <h3 className={styles.roomNumber}>Room {room.room_number}</h3>
        <span className={styles.floor}>Floor {room.floor_id}</span>
      </div>

      <div className={styles.statusWrapper}>
        <span className={styles.statusLabel}>Status:</span>
        <span className={styles.statusValue}>
          {room.isOccupied ? "Occupied" : "Available"}
        </span>
      </div>

      <button onClick={handleView} className={styles.viewButton}>
        View
      </button>
    </div>
  );
}
