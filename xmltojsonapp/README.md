# Flutter Project

## Overview
This project is a Flutter-based mobile application that integrates with Firebase for authentication and user data management. The app provides functionalities for user login, signup, and data entry, all powered by a smooth and user-friendly interface.

## Features
- **User Authentication**: Login and signup using Firebase.
- **Data Entry Interface**: A screen for users to input and manage data.
- **Server Communication**: Sends data in XML format to a Flask app hosted on PythonAnywhere and retrieves a JSON response.
- **Firebase Integration**: Seamless backend services for user authentication and data storage.

## Project Structure
Here’s an overview of the main Dart files in the project:

- **`lib/main.dart`**: The entry point of the application.
- **`lib/auth_service.dart`**: Contains logic for handling authentication, including login and signup functionalities.
- **`lib/firebase_options.dart`**: Configures Firebase services and settings.
- **`lib/login_screen.dart`**: UI for user login.
- **`lib/signup_screen.dart`**: UI for user registration.
- **`lib/data_entry_screen.dart`**: UI and logic for sending user data to a Flask server.

## Data Flow
Once logged in, users can enter their **name** and **email** on the Data Entry screen. This triggers the following process:
1. The entered data is converted into XML format.
2. The app sends an XML request to the Flask app deployed at:  
   **`https://TrainedPro.pythonanywhere.com/receive-data`**
3. The Flask app:
   - Converts the XML data to JSON format.
   - Stores the JSON data in the Firebase database.
   - Sends back the JSON data as a response.
4. The app then displays the JSON response on the UI.

## Code Explanation for `data_entry_screen.dart`
Here’s how the data is sent and handled:
- **XML Conversion**: Data entered by the user is converted to XML format using the `convertToXML` function.
- **HTTP POST Request**: The XML data is sent to the Flask endpoint using an HTTP POST request with the `http` package.
- **Response Handling**: The JSON response from the server is decoded and displayed on the app's UI.
- **Error Handling**: Logs and user feedback handle errors and unsuccessful responses.

## Prerequisites
- **Flutter SDK**: Version 3.0 or higher.
- **Firebase Project**: Ensure you have a Firebase project set up and the `google-services.json` file configured.

## Setup
1. Clone the repository:
   ```bash
   git clone LINK TO ADD
   ```
2. Navigate to the project directory:
   ```bash
   cd xmltojsonapp
   ```
3. Install dependencies:
   ```bash
   flutter pub get
   ```
4. Configure Firebase:
   - Add your `google-services.json` (Android).
5. Run the app:
   ```bash
   flutter run
   ```