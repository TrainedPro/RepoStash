import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class DataEntryScreen extends StatefulWidget {
  const DataEntryScreen({super.key});

  @override
  DataEntryScreenState createState() => DataEntryScreenState();
}

class DataEntryScreenState extends State<DataEntryScreen> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final Logger logger = Logger();

  // This variable will hold the server response to display on the UI
  String serverResponse = '';

  // Function to convert data to XML format
  String convertToXML(String name, String email) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<user>\n'
        '    <name>$name</name>\n'
        '    <email>$email</email>\n'
        '</user>';
  }

  // Function to send XML data to the Flask endpoint
  Future<void> sendData() async {
    String name = nameController.text;
    String email = emailController.text;

    // Proceed only if both fields are not empty
    if (name.isNotEmpty && email.isNotEmpty) {
      // Convert data to XML
      String xmlData = convertToXML(name, email);

      try {
        final response = await http.post(
          Uri.parse('https://TrainedPro.pythonanywhere.com/receive-data'),
          headers: {"Content-Type": "application/xml"},
          body: xmlData,
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          // Parse the JSON response from the server
          final jsonResponse = jsonDecode(response.body);

          setState(() {
            // Display the JSON response in a readable format
            serverResponse = jsonEncode(jsonResponse);
          });

          // Log the successful response
          logger.i("Data sent successfully: $jsonResponse");

          // Clear the text fields
          nameController.clear();
          emailController.clear();
        } else {
          logger.e("Failed to send data. Status code: ${response.statusCode}");
          setState(() {
            serverResponse = 'Failed to send data. Please try again.';
          });
        }
      } catch (e) {
        logger.e("Error occurred while sending data: $e");
        setState(() {
          serverResponse = 'An error occurred. Please try again.';
        });
      }
    } else {
      setState(() {
        serverResponse = 'Please enter both name and email.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Data Entry")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(hintText: "Enter your name"),
            ),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(hintText: "Enter your email"),
            ),
            ElevatedButton(
              onPressed: sendData,
              child: const Text("Submit"),
            ),
            const SizedBox(height: 20),
            // Display server response
            Text(
              'Server Response: $serverResponse',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    super.dispose();
  }
}
