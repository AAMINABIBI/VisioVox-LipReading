import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDpm_NtQdjGoXDEMkjj6xZVh2-TRefVqZk",
  authDomain: "visiovox-90dfb.firebaseapp.com",
  projectId: "visiovox-90dfb",
  storageBucket: "visiovox-90dfb.firebasestorage.app",
  messagingSenderId: "619681158693",
  appId: "1:619681158693:web:2886a82db1d2e80583d1cc",
  measurementId: "G-DW0DGYWDGE"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);

export { auth };