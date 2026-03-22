import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _emailController = TextEditingController(text: 'vcarter77@naver.com');
  final TextEditingController _passController = TextEditingController(text: 'ka1114');
  bool _isLoading = false;

  void _login() async {
    setState(() => _isLoading = true);
    final success = await _apiService.login(_emailController.text, _passController.text);
    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => DashboardScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('로그인 실패: 이메일이나 비밀번호를 확인하세요.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text('AdBlitz 로그인')),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.video_camera_back, size: 80, color: Colors.deepPurple),
            SizedBox(height: 20),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: '이메일 (웹 가입 계정)', border: OutlineInputBorder()),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passController,
              obscureText: true,
              decoration: InputDecoration(labelText: '비밀번호', border: OutlineInputBorder()),
            ),
            SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(minimumSize: Size(double.infinity, 50)),
              onPressed: _isLoading ? null : _login,
              child: _isLoading ? CircularProgressIndicator(color: Colors.white) : Text('로그인'),
            ),
            SizedBox(height: 12),
            OutlinedButton(
              style: OutlinedButton.styleFrom(minimumSize: Size(double.infinity, 50)),
              onPressed: _isLoading ? null : () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => RegisterScreen()));
              },
              child: Text('새 계정 만들기 (회원가입)'),
            ),
            SizedBox(height: 24),
            TextButton(
              onPressed: _isLoading ? null : () {
                _emailController.text = 'vcarter77@naver.com';
                _passController.text = 'ka1114';
                _login();
              },
              child: Text('디버그용: 테스트 계정으로 즉시 로그인', style: TextStyle(color: Colors.grey)),
            ),
          ],
        ),
      ),
    );
  }
}
