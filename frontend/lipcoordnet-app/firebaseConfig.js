import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; // Add Firestore
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig.extra.firebase;

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);
const db = firebase.firestore(app); // Initialize Firestore

export { auth, db };