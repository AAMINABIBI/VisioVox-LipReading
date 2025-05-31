// firebaseConfig.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig.extra.firebase;

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);

export { auth };