import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;

  void _register() async {
    if (_emailController.text.isEmpty || _passController.text.isEmpty || _nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('모든 정보를 입력해주세요.')));
      return;
    }

    setState(() => _isLoading = true);
    final success = await _apiService.register(
      _emailController.text,
      _passController.text,
      _nameController.text,
    );
    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => DashboardScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('회원가입 실패: 이미 가입된 이메일이거나 오류가 발생했습니다.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('회원가입')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(Icons.person_add, size: 80, color: Colors.deepPurple),
            SizedBox(height: 20),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: '이름', border: OutlineInputBorder()),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: '이메일', border: OutlineInputBorder()),
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
              onPressed: _isLoading ? null : _register,
              child: _isLoading ? CircularProgressIndicator(color: Colors.white) : Text('회원가입 및 시작하기'),
            ),
          ],
        ),
      ),
    );
  }
}
