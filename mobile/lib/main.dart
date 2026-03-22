import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(AdBlitzApp());
}

class AdBlitzApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AdBlitz',
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        visualDensity: VisualDensity.adaptivePlatformDensity,
        scaffoldBackgroundColor: Colors.grey.shade100,
        appBarTheme: AppBarTheme(
          color: Colors.white,
          iconTheme: IconThemeData(color: Colors.deepPurple),
          titleTextStyle: TextStyle(color: Colors.deepPurple, fontSize: 20, fontWeight: FontWeight.bold),
          elevation: 0,
        ),
      ),
      home: LoginScreen(),
    );
  }
}
