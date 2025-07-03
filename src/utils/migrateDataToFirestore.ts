import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

interface User {
  // Define the structure of your user object based on your localStorage data
  id?: string; // Firestore will generate an ID, but you might have one in localStorage
  name: string;
  email: string;
  role: string; // e.g., 'student', 'teacher', 'principal', 'super admin'
  schoolId: string;
  // Add other user properties as needed
}

const migrateUsersToFirestore = async () => {
  try {
    const usersString = localStorage.getItem('edusphere_users');
    if (!usersString) {
      console.log('No user data found in localStorage.');
      return;
    }

    const users: User[] = JSON.parse(usersString);

    if (users.length === 0) {
      console.log('No users to migrate.');
      return;
    }

    console.log(`Migrating ${users.length} users to Firestore...`);

    const usersCollectionRef = collection(db, 'users');

    for (const user of users) {
      // You might want to remove the 'id' property if localStorage stored it and you want Firestore to generate a new one
      const userWithoutId = { ...user };
      delete userWithoutId.id;

      await addDoc(usersCollectionRef, userWithoutId);
      console.log(`Added user: ${user.email || user.name}`);
    }

    console.log('User migration to Firestore completed.');

  } catch (error) {
    console.error('Error migrating users to Firestore:', error);
  }
};

export default migrateUsersToFirestore;