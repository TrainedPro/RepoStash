import 'package:firebase_auth/firebase_auth.dart';
import 'package:logger/logger.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final Logger logger = Logger();

  // Sign up method
  Future<User?> signUp(String email, String password) async {
    try {
      UserCredential userCredential =
          await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      logger.i("User signed up: $email"); // Log the successful signup
      return userCredential.user;
    } on FirebaseAuthException catch (e) {
      if (e.code == 'weak-password') {
        logger.e("The password provided is too weak.");
      } else if (e.code == 'email-already-in-use') {
        logger.e("The account already exists for that email.");
      }
    } catch (e) {
      logger.e("An error occurred: $e");
    }
    return null; // Return null if there's an error
  }

  // Sign in method
  Future<User?> signIn(String email, String password) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      logger.i("User signed in: $email"); // Log the successful login
      return userCredential.user;
    } on FirebaseAuthException catch (e) {
      if (e.code == 'invalid-credential') {
        logger.e("Credentials Are Invalid!");
      } else if (e.code == 'invalid-email') {
        logger.e("The email address is not valid.");
      } else {
        logger.e("Login failed with error code: ${e.code}");
        logger.e("Error message: ${e.message}");
      }
    } catch (e) {
      logger.e("An unexpected error occurred: $e");
    }
    return null; // Return null if there's an error
  }

  // Sign out method
  Future<void> signOut() async {
    await _auth.signOut();
    logger.i("User signed out.");
  }

  // Get the current user
  User? getCurrentUser() {
    return _auth.currentUser;
  }
}
