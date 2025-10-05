'use client';

import { PostInput } from "@/components/features/PostInput";
import { PostsFeed } from "@/components/features/PostsFeed";
import { CustomSelect } from "@/components/features/CustomSelect";
import { usePostFilter } from "@/hooks/usePostFilter";
import styles from "../app/page.module.css";
import { FaUserFriends } from "react-icons/fa";
import { FaGlobe } from "react-icons/fa6";

export function MainContent() {
  const { filter, setFilter } = usePostFilter();

  return (
    <>
      <PostInput />
      
      <div className={styles.filterContainer}>
        <span></span>
        <CustomSelect 
          options={[
            { value: 'friends', label: 'Amigos', icon: <FaUserFriends /> },
            { value: 'all', label: 'Todos', icon: <FaGlobe /> },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      
      <PostsFeed filter={filter} />
    </>
  );
}