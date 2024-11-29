import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'signup_screen.dart';
import 'data_entry_screen.dart';
import 'package:logger/logger.dart';

class LoginScreen extends StatelessWidget {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final Logger logger = Logger();

  LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Login")),
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
                User? user = await authService.signIn(email, password);

                if (user != null) {
                  if (!context.mounted) return;
                  logger.i("Login successful for $email");
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => DataEntryScreen()),
                  );
                } else {
                  if (!context.mounted) return;
                  logger.e("Login failed for $email");
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Login failed")),
                  );
                }
              },
              child: const Text("Login"),
            ),
            TextButton(
              onPressed: () {
                // Navigate to SignupScreen
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => SignupScreen()),
                );
              },
              child: const Text("Don't have an account? Sign up"),
            ),
          ],
        ),
      ),
    );
  }
}
