import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class FaceEffectScreen extends StatefulWidget {
  @override
  _FaceEffectScreenState createState() => _FaceEffectScreenState();
}

class _FaceEffectScreenState extends State<FaceEffectScreen> {
  File? _selectedImage;
  bool _isLoading = false;
  Map<String, dynamic>? _resultImages; 
  String _selectedGender = 'male';

  final ImagePicker _picker = ImagePicker();
  final ApiService _apiService = ApiService();

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _resultImages = null; 
      });
    }
  }

  Future<void> _generateEffects() async {
    if (_selectedImage == null) return;
    
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.generateFaceEffect(_selectedImage!, _selectedGender);
      setState(() {
        _resultImages = res['images'];
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$_selectedGender 얼굴 반전 생성 완료!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('에러 발생: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('얼굴 반전 밈 (신규)')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Radio<String>(
                  value: 'male',
                  groupValue: _selectedGender,
                  onChanged: (val) => setState(() => _selectedGender = val!),
                ),
                Text('남성'),
                SizedBox(width: 20),
                Radio<String>(
                  value: 'female',
                  groupValue: _selectedGender,
                  onChanged: (val) => setState(() => _selectedGender = val!),
                ),
                Text('여성'),
              ],
            ),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 250,
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  borderRadius: BorderRadius.circular(12),
                  image: _selectedImage != null ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.contain) : null
                ),
                child: _selectedImage == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [Icon(Icons.upload_file, size: 50, color: Colors.blue), SizedBox(height: 10), Text('이미지 업로드', style: TextStyle(color: Colors.blue))],
                      ) : null,
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              icon: _isLoading ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Icon(Icons.auto_awesome),
              label: Text(_isLoading ? '열심히 AI 얼굴 생성 중...' : '두 가지 얼굴 생성하기 (1 크레딧)'),
              style: ElevatedButton.styleFrom(minimumSize: Size(double.infinity, 50), backgroundColor: Colors.amber),
              onPressed: _isLoading || _selectedImage == null ? null : _generateEffects,
            ),
            SizedBox(height: 30),
            if (_resultImages != null) ...[
              Card(
                child: Column(
                  children: [
                    Container(padding: EdgeInsets.all(10), color: Colors.blue, width: double.infinity, child: Text('😎 극도의 자신감 (Gigachad)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                    Image.network(_resultImages!['confident']),
                  ],
                ),
              ),
              SizedBox(height: 10),
              Card(
                child: Column(
                  children: [
                    Container(padding: EdgeInsets.all(10), color: Colors.deepPurple, width: double.infinity, child: Text('😭 초라한 쭈구리 (Cowering)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                    Image.network(_resultImages!['cowering']),
                  ],
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
