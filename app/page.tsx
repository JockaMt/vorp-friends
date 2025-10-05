import { Post } from "@/components/Post";
import styles from "./page.module.css";
import { PostInput } from "@/components/PostInput";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { CustomSelect } from "@/components/CustomSelect";
import { FaUserFriends } from "react-icons/fa";
import { FaGlobe } from "react-icons/fa6";
import { ChatComponent } from "@/components/ChatComponent";

export default function Home() {
  return (
    <div className={styles.page}>
      <ChatComponent />
      <div className={styles.mainContent}>
        <ProfileSidebar imageUrl="https://avatars.githubusercontent.com/u/74666954?v=4" />
        <main className={styles.content}>
          <PostInput />
          <div className={styles.filterContainer}>
            <span></span><CustomSelect options={[
              { value: 'friends', label: 'Amigos', icon: <FaUserFriends /> },
              { value: 'all', label: 'Todos', icon: <FaGlobe /> },
            ]} />
          </div>
          <Post owner="Jane Smith" likes={25} comments={[{ user: "Alice", text: "Looks amazing!" }]} shares={5} date="2023-06-10" text="Just had a great day at the beach!" image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmb3MJCVP5mJtJe3cSdDlfRH0kA49yVJJl4Q&s" location="Rio de Janeiro" />
          <Post owner="Alice Johnson" likes={15} comments={[{ user: "Bob", text: "Nice video!" }]} shares={2} date="2023-06-12" text="Check out this cool video!" video="https://www.w3schools.com/html/mov_bbb.mp4" />
          <Post owner="Bob Brown" text="No media here, just text!" />
          <Post owner="John Doe" likes={10} comments={[{ user: "Charlie", text: "Hello!" }]} shares={1} date="2023-03-15" text="Hello, world!" />
          <Post owner="Bob Brown" text="No media here, just text!" />
          <Post owner="John Doe" likes={5} comments={[{ user: "Dave", text: "Hi there!" }]} shares={0} date="2023-03-15" text="Hello, world!" />
        </main>
        <div className={styles.rightSidebar}>
          <aside className={styles.rightAside}>
            <h3>Grupos</h3>
            <p>Você não está em nenhum grupo.</p>
          </aside>
          <aside className={styles.rightAside}>
            <h3>Eventos</h3>
            <p>Você não está em nenhum evento.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
