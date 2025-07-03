import { useState, useEffect } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User as AppUser, UserRole } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get user profile from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          id: firebaseUser.uid, // Use Firebase Auth UID as the user ID
          email: firebaseUser.email!,
          // Map other fields from Firestore document to AppUser type
          name: data.name,
          role: data.role as UserRole, // Ensure role is correctly typed
          schoolId: data.school_id,
          phone: data.phone,
          qualification: data.qualification,
          classId: data.class_id,
          rollNumber: data.roll_number,
          parentName: data.parent_name ,
          parentPhone: data.parent_phone ,
          isFirstLogin: data.is_first_login ,
          createdAt: data.created_at,
          lastLogin: data.last_login,
        };
      });
      }
    } catch (error: any) {
      // If there's an error fetching profile, it might be a new user without a profile yet
      // We can still set the basic user info from Firebase Auth
      console.error('Error fetching user profile:', error);
      // toast.error('Failed to load user profile'); // Commenting out to avoid toast on expected no profile for new users
    } finally {
      // If no profile was found, we can still consider the user "logged in" via Firebase Auth
      // but with limited profile information.
      const currentUser = auth.currentUser;
 if (currentUser && !userDoc.exists()) {
         // Optionally set a basic user object here if needed before profile is created
         // setUser({ id: currentUser.uid, email: currentUser.email!, role: UserRole.Student /* default */, ... });
      }
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        // Update last login in Firestore
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString()
        });
      }
      toast.success('Signed in successfully!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<AppUser>) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        // Create user profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email!,
          name: userData.name!,
          role: userData.role!,
          schoolId: userData.schoolId || null,
          phone: userData.phone || null,
          qualification: userData.qualification || null,
          classId: userData.classId || null,
          rollNumber: userData.rollNumber || null,
          parentName: userData.parentName || null,
          parentPhone: userData.parentPhone || null,
          createdAt: new Date().toISOString(),
          isFirstLogin: true,
        });
      }
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await signOut(auth); // Use Firebase Auth signOut function
      
      setUser(null);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const userDocRef = doc(db, 'users', user.id); // Use user.id which is the Firebase Auth UID
      await updateDoc(userDocRef, {
        ...updates // Spread updates object to apply all provided fields
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (newPassword: string) => {
 try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);

        // Update isFirstLogin in Firestore
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          await updateDoc(userDocRef, { isFirstLogin: false });
          // Update local state if user is loaded
          setUser(prevUser => prevUser ? { ...prevUser, isFirstLogin: false } : null);
        } else {
          console.warn('User document not found for isFirstLogin update:', auth.currentUser.uid);
        }
      }

      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
  };
};