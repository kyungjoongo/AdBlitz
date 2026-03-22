# Flutter 연동 가이드 (음성 재생성 & 얼굴 반전 밈 기능)

웹(React)과 동일하게 모바일(Flutter) 환경에서도 방금 백엔드에 추가한 두 가지 새로운 기능을 사용할 수 있도록 구현한 Dart 코드 샘플입니다.
현재 프로젝트 내에 완전한 Flutter 프로젝트 구조가 포함되어 있지 않아, 기존 Flutter 앱에 즉시 붙여넣어 사용할 수 있도록 작성했습니다.

## 1. API 서비스 (`api_service.dart`)
`http` 패키지를 사용하여 백엔드와 통신하는 함수들입니다. (이미 `dio`를 사용하고 계시다면 `dio` 포맷으로 쉽게 변경 가능합니다.)

```dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = 'YOUR_BACKEND_URL/api'; // 백엔드 주소로 변경하세요
  final String token = 'YOUR_USER_TOKEN';        // Auth 토큰 연동

  // 1. 음성 재생성 API
  Future<Map<String, dynamic>> regenerateVoice(String videoId, String engine, String gender, String style) async {
    final response = await http.post(
      Uri.parse('$baseUrl/videos/regenerate-voice/$videoId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'voiceEngine': engine,
        'voiceGender': gender,
        'voiceStyle': style,
      }),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? '음성 재생성에 실패했습니다.');
    }
  }

  // 2. 얼굴 반전 필터 (Meme) API
  Future<Map<String, dynamic>> generateFaceEffect(File imageFile) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/effects/two-face'));
    request.headers.addAll({'Authorization': 'Bearer $token'});
    
    // Multipart로 이미지 파일 담기
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    var jsonResponse = jsonDecode(responseData);
    
    if (response.statusCode == 201) {
      return jsonResponse;
    } else {
      throw Exception(jsonResponse['error'] ?? '얼굴 반전 생성에 실패했습니다.');
    }
  }
}
```

---

## 2. 화면 코드: 스냅챗 스타일 얼굴 반전 화면 (`face_effect_screen.dart`)
`image_picker` 패키지를 통해 사용자 갤러리/카메라에서 사진을 받고, 결과를 화면에 2개 띄워줍니다.

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'api_service.dart';

class FaceEffectScreen extends StatefulWidget {
  @override
  _FaceEffectScreenState createState() => _FaceEffectScreenState();
}

class _FaceEffectScreenState extends State<FaceEffectScreen> {
  File? _selectedImage;
  bool _isLoading = false;
  Map<String, dynamic>? _resultImages; // { confident, cowering }

  final ImagePicker _picker = ImagePicker();
  final ApiService _apiService = ApiService();

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _resultImages = null; // 초기화
      });
    }
  }

  Future<void> _generateEffects() async {
    if (_selectedImage == null) return;
    
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.generateFaceEffect(_selectedImage!);
      setState(() {
        _resultImages = res['images'];
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('생성 성공! (1크레딧 차감됨)')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('에러 발생: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('얼굴 반전 밈 생성기')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(border: Border.all(color: Colors.grey)),
                child: _selectedImage != null
                    ? Image.file(_selectedImage!, fit: BoxFit.contain)
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [Icon(Icons.upload_file, size: 40), Text('사진 선택하기')],
                      ),
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isLoading || _selectedImage == null ? null : _generateEffects,
              child: _isLoading ? CircularProgressIndicator() : Text('반전 얼굴 2가지 만들기 (1크레딧)'),
            ),
            SizedBox(height: 30),
            if (_resultImages != null) ...[
              Text('😎 자신감 넘치는 (Gigachad) 모드', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Image.network(_resultImages!['confident']),
              SizedBox(height: 20),
              Text('😭 쭈구리 (Cowering) 모드', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Image.network(_resultImages!['cowering']),
            ]
          ],
        ),
      ),
    );
  }
}
```

---

## 3. 대화창 (Dialog) - 다른 음성으로 재재생 (`VideoDetailScreen.dart` 내부에 호출)
비디오 상세보기 화면 등에서 띄울 수 있는 팝업 모달(BottomSheet/Dialog) 예시입니다.

```dart
import 'package:flutter/material.dart';
import 'api_service.dart';

Future<void> showRegenerateVoiceDialog(BuildContext context, String videoId) async {
  String selectedEngine = 'minimax';
  String selectedGender = 'female';
  String selectedStyle = 'energetic_girl';
  bool isRegenerating = false;

  await showDialog(
    context: context,
    builder: (BuildContext dialogContext) {
      return StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: Text('음성 재생성 (1 크레딧)'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: selectedEngine,
                  items: [
                    DropdownMenuItem(value: 'minimax', child: Text('기본 (MiniMax)')),
                    DropdownMenuItem(value: 'tiktok', child: Text('틱톡/캡컷 기계음')),
                    DropdownMenuItem(value: 'fal_premium', child: Text('프리미엄 성우')),
                  ],
                  onChanged: (val) {
                    setState(() {
                      selectedEngine = val!;
                      // 엔진 변경 시 기본 목소리 자동 매핑
                      if (val == 'tiktok') selectedStyle = 'kr_002';
                      else if (val == 'fal_premium') selectedStyle = 'female_pro';
                      else selectedStyle = 'energetic_girl';
                    });
                  },
                  decoration: InputDecoration(labelText: 'AI 음성 엔진'),
                ),
                DropdownButtonFormField<String>(
                  value: selectedGender,
                  items: [
                    DropdownMenuItem(value: 'female', child: Text('여자')),
                    DropdownMenuItem(value: 'male', child: Text('남자')),
                  ],
                  onChanged: (val) => setState(() => selectedGender = val!),
                  decoration: InputDecoration(labelText: '목소리 성별'),
                ),
                DropdownButtonFormField<String>(
                  value: selectedStyle,
                  items: selectedEngine == 'minimax' 
                    ? [
                        DropdownMenuItem(value: 'energetic_girl', child: Text('에너지 넘치는 소녀')),
                        DropdownMenuItem(value: 'excited_boy', child: Text('흥분한 소년')),
                        DropdownMenuItem(value: 'storyteller', child: Text('이야기꾼 (ASMR)')),
                        DropdownMenuItem(value: 'booming', child: Text('웅장한 목소리')),
                      ] 
                    : selectedEngine == 'tiktok'
                    ? [
                        DropdownMenuItem(value: 'kr_002', child: Text('상쾌한 아가씨 (kr_002)')),
                        DropdownMenuItem(value: 'kr_003', child: Text('에너지 남성 (kr_003)')),
                        DropdownMenuItem(value: 'kr_004', child: Text('상큼한 소녀 (kr_004)')),
                      ]
                    : [
                        DropdownMenuItem(value: 'female_pro', child: Text('프리미엄 여성 성우')),
                        DropdownMenuItem(value: 'male_pro', child: Text('프리미엄 남성 성우')),
                      ],
                  onChanged: (val) => setState(() => selectedStyle = val!),
                  decoration: InputDecoration(labelText: '보이스 스타일'),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: Text('취소'),
              ),
              ElevatedButton(
                onPressed: isRegenerating
                    ? null
                    : () async {
                        setState(() => isRegenerating = true);
                        try {
                          await ApiService().regenerateVoice(videoId, selectedEngine, selectedGender, selectedStyle);
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('새로운 영상으로 재생성 시작 (2초 소요)!')));
                          Navigator.pop(dialogContext); // 다이얼로그 닫기
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('에러 발생: $e')));
                        } finally {
                          setState(() => isRegenerating = false);
                        }
                      },
                child: isRegenerating ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : Text('재생성 시작'),
              ),
            ],
          );
        }
      );
    }
  );
}
```
