import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'login_screen.dart';
import 'data_entry_screen.dart';
import 'package:logger/logger.dart';

class SignupScreen extends StatelessWidget {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final Logger logger = Logger();

  SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Sign Up")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(hintText: "Enter your email"),
            ),
            TextField(
              controller: passwordController,
              decoration:
                  const InputDecoration(hintText: "Enter your password"),
              obscureText: true,
            ),
            ElevatedButton(
              onPressed: () async {
                String email = emailController.text;
                String password = passwordController.text;
                AuthService authService = AuthService();
                User? user = await authService.signUp(email, password);

                if (user != null) {
                  if (!context.mounted) return;
                  logger.i("Signup successful for $email");
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => DataEntryScreen()),
                  );
                } else {
                  if (!context.mounted) return;
                  logger.e("Signup failed for $email");
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Signup failed")),
                  );
                }
              },
              child: const Text("Sign Up"),
            ),
            TextButton(
              onPressed: () {
                // Navigate to LoginScreen
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => LoginScreen()),
                );
              },
              child: const Text("Already have an account? Login"),
            ),
          ],
        ),
      ),
    );
  }
}
